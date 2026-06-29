import type { Server, AffectedGroup, SupportGroup, ServerStatus, Priority, YesNo, Essential8 } from "@/types/server";

function idToSno(id: unknown): number {
  const text = String(id ?? "");
  const numericSuffix = text.match(/(\d+)$/)?.[1];
  if (numericSuffix) return Number(numericSuffix);
  return Array.from(text).reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

// Maps a servers row → app Server
export function rowToServer(r: any): Server {
  let affected: AffectedGroup[] = [];
  if (Array.isArray(r.affected_groups)) affected = r.affected_groups;
  else if (typeof r.affected_groups === "string" && r.affected_groups.trim()) {
    try { affected = JSON.parse(r.affected_groups); } catch { affected = []; }
  }
  return {
    id: r.id ?? String(r.sno ?? ""),
    sno: Number(r.sno ?? idToSno(r.id)),
    servername: r.servername ?? r.server_name ?? "",
    serialnumber: r.serialnumber ?? r.serial_number ?? "",
    ilo: r.ilo ?? "",
    location: r.location ?? "",
    sociAsset: r.soci_asset ?? "",
    pciAsset: r.pci_asset ?? "",
    model: r.model ?? "",
    dnsip: r.dnsip ?? r.ip_address ?? "",
    os: r.os ?? "",
    osSupportEnds: r.os_support_ends ?? r.os_support_end_date ?? "",
    internetFacing: (r.internet_facing ?? "No") as YesNo,
    status: (r.status ?? "Active") as ServerStatus,
    network: r.network ?? "",
    sdomain: r.sdomain ?? r.domain ?? "",
    isPatched: (r.is_patched ?? "No") as YesNo,
    essential8: (r.essential8 ?? "ML0") as Essential8,
    buildDate: r.build_date ?? "",
    businessFunction: r.business_function ?? "",
    patchSequence: r.patch_sequence ?? "",
    maintenanceComment: r.maintenance_comment ?? "",
    day: r.day ?? "",
    time: r.time ?? "",
    buildEngineer: r.build_engineer ?? "",
    serverDescription: r.server_description ?? "",
    alive: (r.alive ?? "Yes") as YesNo,
    lastCollated: r.last_collated ?? "",
    priority: (r.priority ?? "Medium") as Priority,
    patchCategory: r.patch_category ?? "",
    notes: r.notes ?? "",
    softwareInstalledUrl: r.software_installed_url ?? "",
    backupDetailsUrl: r.backup_details_url ?? "",
    patchContact: r.patch_contact ?? "",
    patchNotes: r.patch_notes ?? "",
    designEngineer: r.design_engineer ?? "",
    primaryGroupId: r.primary_group_id ?? "",
    affectedGroups: affected,
    updatedAt: r.updated_at ?? new Date().toISOString(),
  };
}

// Field -> { table, column }. Splits server fields between
// server_general_details and server_summary.
type Tbl = "general" | "summary";
const FIELD_TABLE: Record<string, { table: Tbl; col: string }> = {
  id:                  { table: "general", col: "id" },
  servername:          { table: "general", col: "servername" },
  serialnumber:        { table: "general", col: "serial_number" },
  ilo:                 { table: "general", col: "ilo" },
  location:            { table: "general", col: "location" },
  sociAsset:           { table: "general", col: "soci_asset" },
  pciAsset:            { table: "general", col: "pci_asset" },
  model:               { table: "general", col: "model" },
  dnsip:               { table: "general", col: "ip_address" },
  os:                  { table: "general", col: "os" },
  osSupportEnds:       { table: "general", col: "os_support_end_date" },
  internetFacing:      { table: "general", col: "internet_facing" },
  status:              { table: "general", col: "status" },
  network:             { table: "general", col: "network" },
  sdomain:             { table: "general", col: "domain" },
  isPatched:           { table: "general", col: "is_patched" },
  buildDate:           { table: "general", col: "build_date" },
  businessFunction:    { table: "general", col: "business_function" },
  buildEngineer:       { table: "general", col: "build_engineer" },
  serverDescription:   { table: "general", col: "server_description" },
  alive:               { table: "general", col: "alive" },
  notes:               { table: "general", col: "notes" },
  softwareInstalledUrl:{ table: "general", col: "software_installed_url" },
  backupDetailsUrl:    { table: "general", col: "backup_details_url" },
  patchContact:        { table: "general", col: "patch_contact" },
  designEngineer:      { table: "general", col: "design_engineer" },
  primaryGroupId:      { table: "general", col: "primary_group_id" },
  affectedGroups:      { table: "general", col: "affected_groups" },

  maintenanceComment:  { table: "summary", col: "maintenance_comment" },
  day:                 { table: "summary", col: "day" },
  time:                { table: "summary", col: "time" },
  lastCollated:        { table: "summary", col: "last_collated" },
  priority:            { table: "summary", col: "priority" },
  patchCategory:       { table: "summary", col: "patch_category" },
  patchSequence:       { table: "summary", col: "patch_sequence" },
  patchNotes:          { table: "summary", col: "patch_notes" },
  essential8:          { table: "summary", col: "essential8" },
};

export function splitPatch(p: Partial<Server>): {
  general: Record<string, any>;
  summary: Record<string, any>;
} {
  const general: Record<string, any> = {};
  const summary: Record<string, any> = {};
  for (const k of Object.keys(p)) {
    if (k === "sno" || k === "updatedAt") continue;
    const m = FIELD_TABLE[k];
    if (!m) continue;
    let v: any = (p as any)[k];
    if (k === "affectedGroups") v = v ?? [];
    (m.table === "general" ? general : summary)[m.col] = v;
  }
  return { general, summary };
}

// Backwards compat for any caller that still expects a flat row mapping
export function patchToRow(p: Partial<Server>): Record<string, any> {
  const { general, summary } = splitPatch(p);
  return { ...general, ...summary };
}

export function rowToGroup(r: any): SupportGroup {
  return { id: r.id, name: r.name, manager: r.manager, members: r.members ?? [] };
}

export function emptyServer(sno: number): Server {
  const id = `srv-${Date.now()}`;
  return {
    id,
    sno,
    servername: "NEW-SERVER",
    serialnumber: "",
    ilo: "",
    location: "",
    sociAsset: "",
    pciAsset: "",
    model: "",
    dnsip: "",
    os: "Windows Server 2022",
    osSupportEnds: "",
    internetFacing: "No",
    status: "Active",
    network: "",
    sdomain: "",
    isPatched: "No",
    essential8: "ML0",
    buildDate: "",
    businessFunction: "",
    patchSequence: "",
    maintenanceComment: "",
    day: "",
    time: "",
    buildEngineer: "",
    serverDescription: "",
    alive: "Yes",
    lastCollated: new Date().toISOString(),
    priority: "Medium",
    patchCategory: "",
    notes: "",
    softwareInstalledUrl: "",
    backupDetailsUrl: "",
    patchContact: "",
    patchNotes: "",
    designEngineer: "",
    primaryGroupId: "",
    affectedGroups: [],
    updatedAt: new Date().toISOString(),
  };
}
