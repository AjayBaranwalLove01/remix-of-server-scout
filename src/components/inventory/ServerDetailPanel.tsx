import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Server as ServerIcon,
  FileText,
  ShieldCheck,
  Users,
  Save,
  ExternalLink,
  Plus,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { Server } from "@/types/server";
import { useServerStore } from "@/store/serverStore";
import { useMastersStore } from "@/store/mastersStore";
import { useAuthStore } from "@/store/authStore";
import { validateServer } from "@/lib/serverValidation";
import { InlineText, InlineTextarea, InlineSelect, InlineToggle } from "./InlineEdit";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SoftwareItem {
  id: string;
  displayname: string;
  displayversion: string;
  platform: string;
  recordtime: string;
}

function SoftwareInventoryDialog({ servername }: { servername: string }) {
  const [open, setOpen] = useState(false);
  const [software, setSoftware] = useState<SoftwareItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSoftware = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/servers/${encodeURIComponent(servername)}/software`);
      if (!res.ok) throw new Error("Failed to fetch software inventory");
      const data = await res.json();
      setSoftware(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      fetchSoftware();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1 text-accent hover:underline text-sm font-medium">
          Open <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <span>Software Inventory</span>
            <span className="text-sm font-normal text-muted-foreground">({servername})</span>
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <p className="text-sm text-muted-foreground">Loading installed software...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg py-8 justify-center">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <>
            {software.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground border border-dashed rounded-lg">
                No software records found for this server in the inventory database.
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Software Name</TableHead>
                      <TableHead className="font-semibold w-[120px]">Version</TableHead>
                      <TableHead className="font-semibold w-[100px]">Platform</TableHead>
                      <TableHead className="font-semibold w-[180px]">Detected At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {software.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-foreground max-w-sm truncate" title={item.displayname}>
                          {item.displayname}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">{item.displayversion || "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{item.platform || "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {item.recordtime ? new Date(item.recordtime).toLocaleString() : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  icon,
  children,
  accent = "primary",
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  accent?: "primary" | "accent" | "warning" | "info";
}) {
  const ringColor = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    warning: "bg-warning/10 text-warning",
    info: "bg-info/10 text-info",
  }[accent];

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border bg-gradient-surface">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", ringColor)}>
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

export function ServerDetailPanel({
  server,
  stageEdit,
  onSave,
  isDirty,
}: {
  server: Server;
  stageEdit: (patch: Partial<Server>) => void;
  onSave: () => void;
  isDirty: boolean;
}) {
  const groups = useServerStore((s) => s.groups);
  const allServers = useServerStore((s) => s.servers);
  const canWrite = useAuthStore((s) => s.user?.canWrite ?? false);
  const { locations, os: osList, loaded: mastersLoaded, fetchAll: fetchMasters } = useMastersStore();
  useEffect(() => { if (!mastersLoaded) fetchMasters(); }, [mastersLoaded, fetchMasters]);

  const primaryGroup = groups.find((g) => g.id === server.primaryGroupId);
  const activeLocations = locations.filter((l) => !l.status || l.status === "Active" || l.location_name === server.location);
  const activeOs = osList.filter((o) => !o.status || o.status === "Active" || o.os_name === server.os);

  const errors = useMemo(
    () => validateServer(server, { servers: allServers, locations, os: osList, selfId: server.id }),
    [server, allServers, locations, osList]
  );
  const blocked = Object.keys(errors).length > 0;

  const handleOsChange = (osName: string) => {
    const match = osList.find((o) => o.os_name === osName);
    stageEdit({ os: osName, osSupportEnds: match?.os_support_end_date ?? "" });
  };

  const availableForAdd = groups.filter(
    (g) => g.id !== server.primaryGroupId && !server.affectedGroups.some((a) => a.groupId === g.id)
  );

  const addAffected = (groupId: string) => {
    if (!groupId) return;
    stageEdit({
      affectedGroups: [...server.affectedGroups, { groupId, selectedMembers: [] }],
    });
  };

  const removeAffected = (groupId: string) => {
    stageEdit({
      affectedGroups: server.affectedGroups.filter((a) => a.groupId !== groupId),
    });
  };

  const toggleAffectedMember = (groupId: string, member: string) => {
    stageEdit({
      affectedGroups: server.affectedGroups.map((a) =>
        a.groupId === groupId
          ? {
              ...a,
              selectedMembers: a.selectedMembers.includes(member)
                ? a.selectedMembers.filter((m) => m !== member)
                : [...a.selectedMembers, member],
            }
          : a
      ),
    });
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header strip */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Detailed view · {server.sno}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Last updated {new Date(server.updatedAt).toLocaleString()}
          </p>
        </div>
        {!canWrite ? (
          <div className="text-xs px-2.5 py-1.5 rounded-md bg-muted text-muted-foreground border border-border flex items-center gap-1.5 font-medium select-none shadow-sm">
            <X className="w-3.5 h-3.5" /> Read-Only Mode
          </div>
        ) : (
          <button
            onClick={onSave}
            disabled={!isDirty || blocked}
            title={blocked ? "Resolve validation errors before saving" : undefined}
            className="inline-flex items-center gap-1.5 h-9 px-4 text-sm rounded-md bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" /> Save server
          </button>
        )}
      </div>

      {blocked && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-2 text-xs text-destructive flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <ul className="space-y-0.5">
            {Object.entries(errors).map(([k, msg]) => <li key={k}>{msg}</li>)}
          </ul>
        </div>
      )}

      {/* General */}
      <Section title="General" icon={<ServerIcon className="w-4 h-4" />} accent="primary">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
          <Field label="Server Name">
            <InlineText value={server.servername} onSave={(v) => stageEdit({ servername: v })} />
            {errors.servername && <p className="text-[11px] text-destructive mt-0.5">{errors.servername}</p>}
          </Field>
          <Field label="Serial Number">
            <InlineText value={server.serialnumber} onSave={(v) => stageEdit({ serialnumber: v })} />
          </Field>
          <Field label="ILO">
            <InlineText value={server.ilo} onSave={(v) => stageEdit({ ilo: v })} />
          </Field>
          <Field label="Location">
            <select
              value={server.location}
              onChange={(e) => stageEdit({ location: e.target.value })}
              disabled={!canWrite}
              className="h-9 w-full px-2 text-sm rounded-md border border-border bg-card outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <option value="">— Select location —</option>
              {activeLocations.map((l) => (
                <option key={l.id} value={l.location_name}>{l.location_name}</option>
              ))}
            </select>
            {errors.location && <p className="text-[11px] text-destructive mt-0.5">{errors.location}</p>}
          </Field>
          <Field label="SOCI Asset">
            <InlineSelect
              value={server.sociAsset || "No"}
              onSave={(v) => stageEdit({ sociAsset: v as "Yes" | "No" })}
              options={[{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }]}
            />
          </Field>
          <Field label="PCI Asset">
            <InlineSelect
              value={server.pciAsset || "No"}
              onSave={(v) => stageEdit({ pciAsset: v as "Yes" | "No" })}
              options={[{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }]}
            />
          </Field>
          <Field label="Model">
            <InlineText value={server.model} onSave={(v) => stageEdit({ model: v })} />
          </Field>
          <Field label="IP Address">
            <InlineText value={server.dnsip} onSave={(v) => stageEdit({ dnsip: v })} />
          </Field>
          <Field label="OS">
            <select
              value={server.os}
              onChange={(e) => handleOsChange(e.target.value)}
              disabled={!canWrite}
              className="h-9 w-full px-2 text-sm rounded-md border border-border bg-card outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <option value="">— Select OS —</option>
              {activeOs.map((o) => (
                <option key={o.id} value={o.os_name}>{o.os_name}</option>
              ))}
            </select>
            {errors.os && <p className="text-[11px] text-destructive mt-0.5">{errors.os}</p>}
          </Field>
          <Field label="OS Support Ends">
            <span className="text-sm font-mono text-muted-foreground">
              {server.osSupportEnds || "—"}
            </span>
            <p className="text-[10px] text-muted-foreground mt-0.5">Auto-filled from OS Master</p>
          </Field>
          <Field label="Internet Facing">
            <InlineToggle
              value={server.internetFacing}
              onSave={(v) => stageEdit({ internetFacing: v })}
            />
          </Field>
          <Field label="Status">
            <InlineSelect
              value={server.status}
              onSave={(v) => stageEdit({ status: v as Server["status"] })}
              options={[
                { value: "Active", label: "Active" },
                { value: "Down", label: "Down" },
                { value: "Maintenance", label: "Maintenance" },
              ]}
            />
          </Field>
          <Field label="Network">
            <InlineText value={server.network} onSave={(v) => stageEdit({ network: v })} />
          </Field>
          <Field label="Domain">
            <InlineText value={server.sdomain} onSave={(v) => stageEdit({ sdomain: v })} />
          </Field>
          <Field label="Is Patched">
            <InlineToggle value={server.isPatched} onSave={(v) => stageEdit({ isPatched: v })} />
          </Field>
          <Field label="Essential 8">
            <InlineToggle value={server.essential8} onSave={(v) => stageEdit({ essential8: v })} />
          </Field>
        </div>
      </Section>

      {/* Summary */}
      <Section title="Summary Details" icon={<FileText className="w-4 h-4" />} accent="info">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
          <Field label="Build Date">
            <InlineText type="date" value={server.buildDate} onSave={(v) => stageEdit({ buildDate: v })} />
          </Field>
          <Field label="Business Function">
            <InlineText value={server.businessFunction} onSave={(v) => stageEdit({ businessFunction: v })} />
          </Field>
          <Field label="Patch Sequence">
            <InlineText value={server.patchSequence} onSave={(v) => stageEdit({ patchSequence: v })} />
          </Field>
          <Field label="Maintenance Day">
            <InlineSelect
              value={server.day}
              onSave={(v) => stageEdit({ day: v })}
              options={["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
                .map((d) => ({ value: d, label: d }))}
            />
          </Field>
          <Field label="Maintenance Time">
            <InlineText type="time" value={server.time} onSave={(v) => stageEdit({ time: v })} />
          </Field>
          <Field label="Build Engineer">
            <InlineText value={server.buildEngineer} onSave={(v) => stageEdit({ buildEngineer: v })} />
          </Field>
          <Field label="Alive">
            <InlineToggle value={server.alive} onSave={(v) => stageEdit({ alive: v })} />
          </Field>
          <Field label="Priority">
            <InlineSelect
              value={server.priority}
              onSave={(v) => stageEdit({ priority: v as Server["priority"] })}
              options={[
                { value: "High", label: "High" },
                { value: "Medium", label: "Medium" },
                { value: "Low", label: "Low" },
              ]}
            />
          </Field>
          <Field label="Patch Category">
            <InlineSelect
              value={server.patchCategory}
              onSave={(v) => stageEdit({ patchCategory: v })}
              options={["Critical","Important","Standard","Optional"].map((c) => ({ value: c, label: c }))}
            />
          </Field>
          <Field label="Last Collated">
            <span className="font-mono text-xs text-muted-foreground">
              {new Date(server.lastCollated).toLocaleString()}
            </span>
          </Field>
          <Field label="View Software Installed">
            <SoftwareInventoryDialog servername={server.servername} />
          </Field>
          <Field label="Backup Details">
            <a href={server.backupDetailsUrl} target="_blank" rel="noreferrer"
               className="inline-flex items-center gap-1 text-accent hover:underline text-sm">
              Open <ExternalLink className="w-3 h-3" />
            </a>
          </Field>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Maintenance Comment">
            <InlineTextarea value={server.maintenanceComment} onSave={(v) => stageEdit({ maintenanceComment: v })} />
          </Field>
          <Field label="Server Description">
            <InlineTextarea value={server.serverDescription} onSave={(v) => stageEdit({ serverDescription: v })} />
          </Field>
        </div>

        <div className="mt-5">
          <Field label="Notes">
            <InlineTextarea value={server.notes} onSave={(v) => stageEdit({ notes: v })} />
          </Field>
        </div>
      </Section>

      {/* Patching */}
      <Section title="Patching" icon={<ShieldCheck className="w-4 h-4" />} accent="accent">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Patch Contact">
            <InlineText value={server.patchContact} onSave={(v) => stageEdit({ patchContact: v })} />
          </Field>
          <Field label="Design Engineer">
            <InlineText value={server.designEngineer} onSave={(v) => stageEdit({ designEngineer: v })} />
          </Field>
        </div>
        <div className="mt-5">
          <Field label="Patch Notes">
            <InlineTextarea value={server.patchNotes} onSave={(v) => stageEdit({ patchNotes: v })} />
          </Field>
        </div>
      </Section>

      {/* Support Information */}
      <Section title="Support Information" icon={<Users className="w-4 h-4" />} accent="warning">
        <div className="space-y-6">
          {/* Primary group */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Primary Assignee Group
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-accent-soft/40 border border-accent/20">
              <Field label="Currently Assigned Group">
                <select
                  value={server.primaryGroupId}
                  onChange={(e) => stageEdit({ primaryGroupId: e.target.value })}
                  disabled={!canWrite}
                  className="h-9 w-full px-2 text-sm rounded-md border border-border bg-card outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Team Manager">
                <span className="inline-flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-semibold">
                    {primaryGroup?.manager.split(" ").map((n) => n[0]).join("")}
                  </span>
                  <span className="font-medium">{primaryGroup?.manager}</span>
                </span>
              </Field>
              <Field label="Team Members">
                <div className="flex flex-wrap gap-1.5">
                  {primaryGroup?.members.map((m) => (
                    <span key={m} className="px-2 py-0.5 text-xs rounded-full bg-card border border-border text-foreground">
                      {m}
                    </span>
                  ))}
                </div>
              </Field>
            </div>
          </div>

          {/* Affected groups */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Affected Support Groups
              </p>
              {canWrite && (
                <div className="flex items-center gap-2">
                  <select
                    defaultValue=""
                    onChange={(e) => { addAffected(e.target.value); e.currentTarget.value = ""; }}
                    className="h-8 px-2 text-xs rounded-md border border-border bg-card outline-none focus:ring-2 focus:ring-accent/30"
                  >
                    <option value="" disabled>+ Add available group...</option>
                    {availableForAdd.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {server.affectedGroups.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8 border border-dashed border-border rounded-lg">
                No affected groups. Use the dropdown to add one.
              </div>
            ) : (
              <div className="space-y-3">
                {server.affectedGroups.map((a) => {
                  const g = groups.find((gg) => gg.id === a.groupId);
                  if (!g) return null;
                  return (
                    <div key={a.groupId} className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{g.name}</span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              Manager: {g.manager}
                            </span>
                          </div>
                          <div className="mt-3">
                            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
                              Team Members
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {g.members.map((m) => {
                                const selected = a.selectedMembers.includes(m);
                                return (
                                  <button
                                    key={m}
                                    onClick={() => toggleAffectedMember(g.id, m)}
                                    disabled={!canWrite}
                                    className={cn(
                                      "px-2.5 py-1 text-xs rounded-full border transition-colors flex items-center gap-1",
                                      selected
                                        ? "bg-accent text-accent-foreground border-accent"
                                        : "bg-card text-muted-foreground border-border hover:border-accent hover:text-foreground"
                                    )}
                                  >
                                    {selected && <Plus className="w-3 h-3 rotate-45" />}
                                    {m}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        {canWrite && (
                          <button
                            onClick={() => removeAffected(g.id)}
                            className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-colors"
                            title="Remove group"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}
