import { ReactNode, useEffect, useMemo, useState, useCallback } from "react";
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
  ChevronDown,
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

function formatBuildDate(dateVal: string | null | undefined): string {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    
    const day = d.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    
    return `${day} ${month} ${year} ${hh}:${mm}:${ss}`;
  } catch (e) {
    return dateVal;
  }
}

function formatSupportEndDate(dateVal: string | null | undefined): string {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    
    const day = d.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    
    return `${day} ${month} ${year}`;
  } catch (e) {
    return dateVal;
  }
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
  const statusTypes = useServerStore((s) => s.statusTypes);
  const fetchStatusTypes = useServerStore((s) => s.fetchStatusTypes);
  const patchCategories = useServerStore((s) => s.patchCategories);
  const patchSequences = useServerStore((s) => s.patchSequences);
  const serverDomains = useServerStore((s) => s.serverDomains);
  const engineers = useServerStore((s) => s.engineers);
  const dropdownsLoaded = useServerStore((s) => s.dropdownsLoaded);
  const fetchDropdownMasters = useServerStore((s) => s.fetchDropdownMasters);

  const canWrite = useAuthStore((s) => s.user?.canWrite ?? false);
  const { locations, os: osList, loaded: mastersLoaded, fetchAll: fetchMasters } = useMastersStore();
  useEffect(() => { if (!mastersLoaded) fetchMasters(); }, [mastersLoaded, fetchMasters]);
  useEffect(() => { if (statusTypes.length === 0) fetchStatusTypes(); }, [statusTypes, fetchStatusTypes]);
  useEffect(() => { if (!dropdownsLoaded) fetchDropdownMasters(); }, [dropdownsLoaded, fetchDropdownMasters]);

  // Cache state for ServiceNow group managers and team members
  const [groupDetailsCache, setGroupDetailsCache] = useState<Record<string, {
    manager: { sys_id: string; name: string } | null;
    members: { sys_id: string; name: string }[];
    loading: boolean;
  }>>({});

  // Collapsed support groups panels
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const fetchGroupDetails = useCallback(async (groupId: string) => {
    if (!groupId) return;
    if (groupDetailsCache[groupId]) return; // already fetched/fetching

    setGroupDetailsCache((prev) => ({
      ...prev,
      [groupId]: { manager: null, members: [], loading: true }
    }));

    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`/api/groups/${groupId}/members`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("Failed to fetch group details");
      const data = await res.json();
      
      setGroupDetailsCache((prev) => ({
        ...prev,
        [groupId]: {
          manager: data.manager,
          members: data.members || [],
          loading: false
        }
      }));
    } catch (err) {
      console.error(`Failed to load details for ServiceNow group ${groupId}:`, err);
      setGroupDetailsCache((prev) => ({
        ...prev,
        [groupId]: { manager: null, members: [], loading: false }
      }));
    }
  }, [groupDetailsCache]);

  // Auto-fetch details for primary group
  useEffect(() => {
    if (server.primaryGroupId && !groupDetailsCache[server.primaryGroupId]) {
      fetchGroupDetails(server.primaryGroupId);
    }
  }, [server.primaryGroupId, fetchGroupDetails, groupDetailsCache]);

  // Auto-fetch details for affected groups
  useEffect(() => {
    (server.affectedGroups || []).forEach((ag) => {
      if (ag.groupId && !groupDetailsCache[ag.groupId]) {
        fetchGroupDetails(ag.groupId);
      }
    });
  }, [server.affectedGroups, fetchGroupDetails, groupDetailsCache]);

  const toggleCollapseGroup = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

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
    (g) => !server.affectedGroups.some((a) => a.groupId === g.id)
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
              {formatSupportEndDate(server.osSupportEnds)}
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
              options={statusTypes.map((st) => ({ value: st, label: st }))}
            />
          </Field>
          <Field label="Network">
            <InlineText value={server.network} onSave={(v) => stageEdit({ network: v })} />
          </Field>
          <Field label="Domain">
            <InlineSelect
              value={server.sdomain}
              onSave={(v) => stageEdit({ sdomain: v })}
              options={serverDomains.map(d => ({ value: d, label: d }))}
            />
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
            <InlineText
              type="date"
              value={server.buildDate ? new Date(server.buildDate).toISOString().split('T')[0] : ""}
              onSave={(v) => stageEdit({ buildDate: v })}
              display={() => formatBuildDate(server.buildDate)}
            />
          </Field>
          <Field label="Business Function">
            <InlineText value={server.businessFunction} onSave={(v) => stageEdit({ businessFunction: v })} />
          </Field>
          <Field label="Patch Sequence">
            <InlineSelect
              value={server.patchSequence}
              onSave={(v) => stageEdit({ patchSequence: v })}
              options={patchSequences.map(s => ({ value: s, label: s }))}
            />
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
            <InlineSelect
              value={server.buildEngineer}
              onSave={(v) => stageEdit({ buildEngineer: v })}
              options={engineers.map(e => ({ value: e, label: e }))}
            />
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
              options={patchCategories.map((c) => ({ value: c, label: c }))}
            />
          </Field>
          <Field label="Last Collated">
            <span className="font-mono text-xs text-muted-foreground">
              {formatBuildDate(server.lastCollated)}
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
            <InlineSelect
              value={server.designEngineer}
              onSave={(v) => stageEdit({ designEngineer: v })}
              options={engineers.map(e => ({ value: e, label: e }))}
            />
          </Field>
        </div>
        <div className="mt-5">
          <Field label="Patch Notes">
            <InlineTextarea value={server.patchNotes} onSave={(v) => stageEdit({ patchNotes: v })} />
          </Field>
        </div>
      </Section>

      {/* Support Information */}
      {/* Support Information */}
      <Section title="Support Information" icon={<Users className="w-4 h-4" />} accent="warning">
        <div className="space-y-6">
          {/* Primary Group & Assignee */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Primary Assignee Group & Assignee
            </p>
            <div className="p-4 rounded-lg bg-accent-soft/30 border border-accent/20 space-y-4">
              <Field label="Currently Assigned Group">
                <select
                  value={server.primaryGroupId}
                  onChange={(e) => {
                    stageEdit({ 
                      primaryGroupId: e.target.value,
                      assignee: "" // reset assignee on group change
                    });
                  }}
                  disabled={!canWrite}
                  className="h-9 w-full px-2.5 text-sm rounded-md border border-border bg-card outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>Select Primary Group...</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </Field>

              {server.primaryGroupId && (
                <div className="mt-4 pt-3 border-t border-accent/15 space-y-3">
                  {(() => {
                    const details = groupDetailsCache[server.primaryGroupId];
                    if (!details || details.loading) {
                      return (
                        <div className="flex items-center justify-center py-4 gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin text-accent" />
                          <span>Loading team members...</span>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {/* Group Name & Manager */}
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Group Manager
                          </span>
                          {details.manager ? (
                            <div className="flex items-center justify-between p-2.5 rounded-md border border-border bg-card text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">👤 {details.manager.name}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-bold uppercase tracking-wider">
                                  Manager
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs italic text-muted-foreground">
                              No manager assigned to this group
                            </div>
                          )}
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-accent/15 my-2" />

                        {/* Team Members */}
                        <div className="space-y-2">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Team Members
                          </span>
                          {details.members.length === 0 ? (
                            <div className="text-sm text-muted-foreground py-2 italic">
                              No team members found
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {details.members.map((m) => (
                                <div
                                  key={m.sys_id}
                                  className="flex items-center p-2.5 rounded-md border border-border bg-card text-sm text-muted-foreground"
                                >
                                  <span>{m.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Affected Support Groups */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Affected Support Groups
              </p>
              {canWrite && (
                <select
                  defaultValue=""
                  onChange={(e) => { addAffected(e.target.value); e.currentTarget.value = ""; }}
                  className="h-8 px-2.5 text-xs rounded-md border border-border bg-card outline-none focus:ring-2 focus:ring-accent/30"
                >
                  <option value="" disabled>+ Add affected group...</option>
                  {availableForAdd.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              )}
            </div>

            {server.affectedGroups.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8 border border-dashed border-border rounded-lg">
                No affected support groups selected.
              </div>
            ) : (
              <div className="space-y-3">
                {server.affectedGroups.map((a) => {
                  const g = groups.find((gg) => gg.id === a.groupId);
                  if (!g) return null;

                  const isCollapsed = collapsedGroups.has(a.groupId);
                  const details = groupDetailsCache[a.groupId];

                  return (
                    <div key={a.groupId} className="rounded-lg border border-border bg-card overflow-hidden transition-all">
                      {/* Collapsible Header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
                        <button
                          type="button"
                          onClick={() => toggleCollapseGroup(a.groupId)}
                          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-accent transition-colors"
                        >
                          <ChevronDown className={cn("w-4 h-4 transition-transform", isCollapsed && "transform -rotate-90")} />
                          <span>{g.name}</span>
                        </button>
                        {canWrite && (
                          <button
                            type="button"
                            onClick={() => removeAffected(a.groupId)}
                            className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-colors"
                            title="Remove group"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Collapsible Body */}
                      {!isCollapsed && (
                        <div className="p-4 space-y-3">
                          {(() => {
                            if (!details || details.loading) {
                              return (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                                  <span>Loading members...</span>
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-3">
                                {/* Manager */}
                                {details.manager ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-foreground">👤 {details.manager.name}</span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold uppercase tracking-wider">
                                      Manager
                                    </span>
                                  </div>
                                ) : (
                                  <div className="text-xs italic text-muted-foreground">
                                    No manager assigned
                                  </div>
                                )}

                                {/* Divider */}
                                <div className="h-px bg-border my-2" />

                                {/* Team Members List */}
                                <div className="space-y-2">
                                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Team Members
                                  </span>
                                  {details.members.length === 0 ? (
                                    <div className="text-xs text-muted-foreground italic py-1">
                                      No team members found
                                    </div>
                                  ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                      {details.members.map((m) => (
                                        <span
                                          key={m.sys_id}
                                          className="px-2.5 py-1 text-xs rounded-full border border-border bg-card text-muted-foreground"
                                        >
                                          {m.name}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
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
