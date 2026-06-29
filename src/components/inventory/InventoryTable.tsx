import { Fragment, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Filter,
  Search,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { useServerStore } from "@/store/serverStore";
import type { Server } from "@/types/server";
import { StatusBadge, PatchedBadge, PriorityBadge } from "./StatusBadge";
import { InlineText, InlineSelect } from "./InlineEdit";
import { ServerDetailPanel } from "./ServerDetailPanel";
import { highlightMatch } from "@/lib/highlight";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PAGE_SIZE = 6;

export function InventoryTable() {
  const {
    servers,
    updateServer,
    createServer,
    deleteServer,
    fetchAll,
    loading,
    loaded,
    searchTerm,
    searchFilters,
  } = useServerStore();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [domainFilter, setDomainFilter] = useState<string>("All");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [pendingEdits, setPendingEdits] = useState<Record<number, Partial<Server>>>({});
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<Server | null>(null);

  useEffect(() => {
    if (!loaded) fetchAll();
  }, [loaded, fetchAll]);

  const domains = useMemo(
    () => Array.from(new Set(servers.map((s) => s.sdomain))),
    [servers]
  );

  const filtersKey = searchFilters.join(",");
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filtersKey]);

  const matchesGlobalSearch = (s: Server): boolean => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    const checks: boolean[] = [];
    if (searchFilters.includes("status")) {
      const haystacks = [
        s.status.toLowerCase(),
        s.isPatched === "Yes" ? "patched" : "unpatched",
      ];
      checks.push(haystacks.some((h) => h.includes(q)));
    }
    if (searchFilters.includes("custom")) {
      const fields = [
        s.servername, s.sdomain, s.serialnumber, s.patchContact,
        s.dnsip, s.internetFacing, s.sociAsset, s.essential8,
      ];
      checks.push(fields.some((f) => String(f ?? "").toLowerCase().includes(q)));
    }
    return checks.some(Boolean);
  };

  const customSearchActive =
    !!searchTerm.trim() && searchFilters.includes("custom");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return servers.filter((s) => {
      if (!matchesGlobalSearch(s)) return false;
      if (statusFilter !== "All" && s.status !== statusFilter) return false;
      if (domainFilter !== "All" && s.sdomain !== domainFilter) return false;
      if (!q) return true;
      return (
        s.servername.toLowerCase().includes(q) ||
        s.dnsip.includes(q) ||
        s.os.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.sdomain.toLowerCase().includes(q)
      );
    });
  }, [servers, query, statusFilter, domainFilter, searchTerm, filtersKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stageEdit = (sno: number, patch: Partial<Server>) => {
    setPendingEdits((p) => ({ ...p, [sno]: { ...p[sno], ...patch } }));
  };

  const markSaving = (sno: number, on: boolean) =>
    setSavingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(sno);
      else next.delete(sno);
      return next;
    });

  const saveRow = async (sno: number) => {
    const patch = pendingEdits[sno];
    if (!patch) return;
    markSaving(sno, true);
    try {
      await updateServer(sno, patch);
      setPendingEdits((p) => {
        const next = { ...p };
        delete next[sno];
        return next;
      });
      toast.success(`Saved changes to ${servers.find((s) => s.sno === sno)?.servername}`);
    } catch (e: any) {
      toast.error(`Save failed: ${e.message ?? e}`);
    } finally {
      markSaving(sno, false);
    }
  };

  const saveAll = async () => {
    const ids = Object.keys(pendingEdits).map(Number);
    if (!ids.length) {
      toast.info("No pending changes");
      return;
    }
    try {
      await Promise.all(ids.map((sno) => updateServer(sno, pendingEdits[sno])));
      setPendingEdits({});
      toast.success(`Saved ${ids.length} server${ids.length === 1 ? "" : "s"}`);
    } catch (e: any) {
      toast.error(`Save failed: ${e.message ?? e}`);
    }
  };

  const discardAll = () => {
    setPendingEdits({});
    toast.message("Discarded pending changes");
  };

  const handleCreate = async () => {
    try {
      const created = await createServer();
      if (created) {
        setExpanded(created.sno);
        setPage(1);
        toast.success("New server added — edit details below");
      }
    } catch (e: any) {
      toast.error(`Create failed: ${e.message ?? e}`);
    }
  };

  const handleDelete = async (srv: Server) => {
    try {
      await deleteServer(srv.sno);
      setPendingEdits((p) => {
        const next = { ...p };
        delete next[srv.sno];
        return next;
      });
      if (expanded === srv.sno) setExpanded(null);
      toast.success(`Deleted ${srv.servername}`);
    } catch (e: any) {
      toast.error(`Delete failed: ${e.message ?? e}`);
    } finally {
      setConfirmDelete(null);
    }
  };

  const exportCsv = () => {
    const headers = [
      "Server Name", "IP", "OS", "Status", "Patched", "Location", "Domain", "Network", "Priority",
    ];
    const rows = filtered.map((s) => [
      s.servername, s.dnsip, s.os, s.status, s.isPatched, s.location, s.sdomain, s.network, s.priority,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `server-inventory-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported CSV");
  };

  const merged = (s: Server): Server => ({ ...s, ...(pendingEdits[s.sno] || {}) });
  const pendingCount = Object.keys(pendingEdits).length;

  return (
    <div className="surface-card overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-border flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 h-9 px-3 rounded-md bg-muted/50 border border-border min-w-[240px] flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search by name, IP, OS, location..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-9 px-2 text-sm rounded-md border border-border bg-card outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option>All</option>
              <option>Active</option>
              <option>Down</option>
              <option>Maintenance</option>
            </select>
            <select
              value={domainFilter}
              onChange={(e) => { setDomainFilter(e.target.value); setPage(1); }}
              className="h-9 px-2 text-sm rounded-md border border-border bg-card outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="All">All domains</option>
              {domains.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-warning/10 text-warning border border-warning/30">
              {pendingCount} unsaved
            </span>
          )}
          <button
            onClick={discardAll}
            disabled={!pendingCount}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-sm rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Discard
          </button>
          <button
            onClick={saveAll}
            disabled={!pendingCount}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-sm rounded-md bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
          >
            <Save className="w-3.5 h-3.5" /> Save all
          </button>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-sm rounded-md bg-accent text-accent-foreground hover:bg-accent/90 font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New server
          </button>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 text-left">
              {[
                "", "Server", "IP Address", "OS", "Status", "Patched",
                "Location", "Domain", "Priority", "Actions",
              ].map((h) => (
                <th key={h} className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((srv) => {
              const s = merged(srv);
              const isExpanded = expanded === s.sno;
              const isDirty = !!pendingEdits[s.sno];
              return (
                <Fragment key={s.sno}>
                  <tr
                    className={cn(
                      "border-t border-border hover:bg-muted/30 transition-colors",
                      isDirty && "bg-warning/5",
                      isExpanded && "bg-accent/5"
                    )}
                  >
                    <td className="px-3 py-3 w-10">
                      <button
                        onClick={() => setExpanded(isExpanded ? null : s.sno)}
                        className="w-6 h-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <InlineText
                        value={s.servername}
                        onSave={(v) => stageEdit(s.sno, { servername: v })}
                        display={(v) => (
                          <span className="font-mono font-semibold text-foreground">
                            {customSearchActive ? highlightMatch(v, searchTerm) : v}
                          </span>
                        )}
                      />
                      <p className="text-[11px] text-muted-foreground mt-0.5">{s.model}</p>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">
                      <InlineText
                        value={s.dnsip}
                        onSave={(v) => stageEdit(s.sno, { dnsip: v })}
                        display={(v) => (
                          <span>{customSearchActive ? highlightMatch(v, searchTerm) : v}</span>
                        )}
                      />
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{s.os}</td>
                    <td className="px-3 py-3">
                      <InlineSelect
                        value={s.status}
                        onSave={(v) => stageEdit(s.sno, { status: v as Server["status"] })}
                        options={[
                          { value: "Active", label: "Active" },
                          { value: "Down", label: "Down" },
                          { value: "Maintenance", label: "Maintenance" },
                        ]}
                        className="text-xs"
                      />
                      <div className="mt-1"><StatusBadge status={s.status} /></div>
                    </td>
                    <td className="px-3 py-3"><PatchedBadge patched={s.isPatched} /></td>
                    <td className="px-3 py-3 text-xs text-muted-foreground max-w-[180px] truncate">{s.location}</td>
                    <td className="px-3 py-3 text-xs font-mono text-muted-foreground">
                      {customSearchActive ? highlightMatch(s.sdomain, searchTerm) : s.sdomain}
                    </td>
                    <td className="px-3 py-3"><PriorityBadge priority={s.priority} /></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => saveRow(s.sno)}
                          disabled={!isDirty || savingIds.has(s.sno)}
                          className="inline-flex items-center gap-1 h-7 px-2.5 text-xs rounded-md bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed font-medium transition-colors"
                        >
                          {savingIds.has(s.sno) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                        </button>
                        <button
                          onClick={() => setConfirmDelete(s)}
                          title="Delete server"
                          className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-gradient-to-b from-accent/5 to-transparent">
                      <td colSpan={10} className="p-0">
                        <div className="animate-fade-in-up">
                          <ServerDetailPanel
                            server={s}
                            stageEdit={(patch) => stageEdit(s.sno, patch)}
                            onSave={() => saveRow(s.sno)}
                            isDirty={isDirty}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    {loading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin opacity-60" />
                        <p className="text-sm font-medium text-foreground">Loading servers…</p>
                      </>
                    ) : (
                      <>
                        <Search className="w-8 h-8 opacity-40" />
                        <p className="text-sm font-medium text-foreground">No results found</p>
                        <p className="text-xs">
                          {searchTerm
                            ? <>No servers match <span className="font-mono">"{searchTerm}"</span> in the selected scope{searchFilters.length > 1 ? "s" : ""}.</>
                            : "Try adjusting your filters or add a new server."}
                        </p>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between text-sm">
        <p className="text-muted-foreground text-xs">
          Showing <span className="font-mono text-foreground">{pageRows.length}</span> of{" "}
          <span className="font-mono text-foreground">{filtered.length}</span> servers
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-8 px-3 text-xs rounded-md border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={cn(
                "h-8 w-8 text-xs rounded-md transition-colors",
                page === i + 1
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-8 px-3 text-xs rounded-md border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this server?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes{" "}
              <span className="font-mono font-semibold">{confirmDelete?.servername}</span>{" "}
              from the inventory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
