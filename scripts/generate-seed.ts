import { supportGroups, initialServers } from "../src/data/mockData";
import { splitPatch } from "../src/lib/serverMapper";
import { Server, SupportGroup } from "../src/types/server";

function sqlStr(v: string | null | undefined): string {
  if (v == null || v === "") return "''";
  return "'" + v.replace(/'/g, "''").replace(/\\/g, "\\\\") + "'";
}

function sqlArray(arr: string[]): string {
  if (!arr || arr.length === 0) return "'{}'";
  return "ARRAY[" + arr.map(sqlStr).join(", ") + "]";
}

function jsonb(v: any): string {
  return "'" + JSON.stringify(v ?? []).replace(/'/g, "''") + "'::jsonb";
}

function now(): string {
  return "'" + new Date().toISOString() + "'::timestamptz";
}

const rows = (arr: string[][]) => arr.map((r) => "(" + r.join(", ") + ")").join(",\n");

function writeMasters(): string {
  const groupRows = (supportGroups as SupportGroup[]).map((g) => [
    sqlStr(g.id), sqlStr(g.name), sqlStr(g.manager), sqlArray(g.members), now(), now(),
  ]);
  const locations = new Set<string>();
  const oses = new Map<string, string>();
  for (const s of initialServers as Server[]) {
    if (s.location) locations.add(s.location);
    if (s.os) oses.set(s.os, s.osSupportEnds);
  }
  const locRows = Array.from(locations).map((loc) => [sqlStr(loc), "'Active'", now(), now()]);
  const osRows = Array.from(oses.entries()).map(([os, end]) => [sqlStr(os), sqlStr(end), "'Active'", now(), now()]);

  return [
    "INSERT INTO public.support_groups (id, name, manager, members, created_at, updated_at) VALUES",
    rows(groupRows),
    "ON CONFLICT (id) DO NOTHING;",
    "\nINSERT INTO public.locations_master (location_name, status, created_at, updated_at) VALUES",
    rows(locRows),
    "ON CONFLICT (lower(location_name)) DO NOTHING;",
    "\nINSERT INTO public.os_master (os_name, os_support_end_date, status, created_at, updated_at) VALUES",
    rows(osRows),
    "ON CONFLICT (lower(os_name)) DO NOTHING;",
  ].join("\n");
}

function writeGeneral(range?: [number, number]): string {
  const generalCols = [
    "id", "servername", "serial_number", "ilo", "location", "soci_asset", "pci_asset", "model", "ip_address",
    "os", "os_support_end_date", "internet_facing", "status", "network", "domain", "is_patched", "build_date",
    "business_function", "build_engineer", "server_description", "alive", "notes", "software_installed_url",
    "backup_details_url", "patch_contact", "design_engineer", "primary_group_id", "affected_groups", "created_at", "updated_at",
  ];
  let list = initialServers as Server[];
  if (range) list = list.slice(range[0], range[1]);
  const generalRows = list.map((s) => {
    const id = `srv-${s.sno}`;
    const { general } = splitPatch(s);
    const all = { id, ...general };
    return generalCols.map((k) => {
      if (k === "affected_groups") return jsonb(all[k]);
      if (k === "created_at" || k === "updated_at") return now();
      return sqlStr(all[k]);
    });
  });
  return [
    "INSERT INTO public.server_general_details (" + generalCols.join(", ") + ") VALUES",
    rows(generalRows),
    "ON CONFLICT (id) DO NOTHING;",
  ].join("\n");
}

function writeSummary(): string {
  const summaryCols = ["servername", "essential8", "patch_sequence", "maintenance_comment", "day", "time", "last_collated", "priority", "patch_category", "patch_notes", "created_at", "updated_at"];
  const summaryRows = (initialServers as Server[]).map((s) => {
    const { summary } = splitPatch(s);
    return summaryCols.map((k) => {
      if (k === "servername") return sqlStr(s.servername);
      if (k === "created_at" || k === "updated_at") return now();
      return sqlStr((summary as any)[k]);
    });
  });
  return [
    "INSERT INTO public.server_summary (" + summaryCols.join(", ") + ") VALUES",
    rows(summaryRows),
    "ON CONFLICT (servername) DO NOTHING;",
  ].join("\n");
}

const files = [
  ["supabase/migrations/20260629102516_seed_mock_masters.sql", writeMasters()],
  ["supabase/migrations/20260629102517_seed_mock_general_1.sql", writeGeneral([0, 5])],
  ["supabase/migrations/20260629102518_seed_mock_general_2.sql", writeGeneral([5, 10])],
  ["supabase/migrations/20260629102519_seed_mock_summary.sql", writeSummary()],
];

for (const [path, content] of files) {
  await Bun.write(path, content);
  console.log(`Wrote ${path} (${Math.round(content.length / 1024)} KB)`);
}
