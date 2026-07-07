import { Fragment, useEffect, useState } from "react";
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
  ChevronUp,
  SlidersHorizontal,
} from "lucide-react";
import { useServerStore } from "@/store/serverStore";
import { useAuthStore } from "@/store/authStore";
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

export function InventoryTable() {
  const {
    servers,
    groups,
    updateServer,
    createServer,
    deleteServer,
    fetchAll,
    fetchFiltersMetadata,
    availableFilters,
    loading,
    loaded,
    searchTerm,
    searchFilters,
    setSearchTerm,

    // Store filters state
    statusFilter,
    domainFilter,
    stateFilter,
    locationFilter,
    siteTypeFilter,
    ownerFilter,
    osFilter,
    priorityFilter,
    businessGroupFilter,
    virtualGuestFilter,
    internetFacingFilter,
    pciAssetFilter,
    sociAssetFilter,
    isPatchedFilter,
    patchCategoryFilter,

    // Store pagination/sorting state
    page,
    total,
    pageSize,
    sortBy,
    sortOrder,

    setFilter,
    setPage,
    setPageSize,
    setSorting,
    resetFilters,
    statusTypes,
    fetchStatusTypes
  } = useServerStore();

  const canWrite = useAuthStore((s) => s.user?.canWrite ?? false);

  const [query, setQuery] = useState(searchTerm);
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [pendingEdits, setPendingEdits] = useState<Record<number, Partial<Server>>>({});
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<Server | null>(null);

  // Initial loads
  useEffect(() => {
    if (!loaded) {
      fetchAll();
      fetchFiltersMetadata();
      fetchStatusTypes();
    }
  }, [loaded, fetchAll, fetchFiltersMetadata, fetchStatusTypes]);

  // Sync external search term changes back to local query input
  useEffect(() => {
    setQuery(searchTerm);
  }, [searchTerm]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm !== query) {
        setSearchTerm(query);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [query, searchTerm, setSearchTerm]);

  const customSearchActive = !!searchTerm.trim() && searchFilters.includes("custom");

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

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
    // Note: in a server-side context we export all matching rows. 
    // For simplicity, we trigger a full data fetch or export current rows.
    const headers = [
      "Server Name", "IP", "OS", "Status", "Patched", "Location", "Domain", "Network", "Priority",
    ];
    const rows = servers.map((s) => [
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
    toast.success("Exported CSV (Current Page)");
  };

  const toggleSort = (colName: string) => {
    if (sortBy === colName) {
      setSorting(colName, sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSorting(colName, "ASC");
    }
  };

  const merged = (s: Server): Server => ({ ...s, ...(pendingEdits[s.sno] || {}) });
  const pendingCount = Object.keys(pendingEdits).length;

  return (
    <div className="surface-card overflow-hidden space-y-2">
      {/* Toolbar */}
      <div className="p-4 border-b border-border flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          {/* Quick search input */}
          <div className="flex items-center gap-2 h-9 px-3 rounded-md bg-muted/50 border border-border min-w-[240px] flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, IP, OS, location..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-muted-foreground" />
            
            {/* Status Quick Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setFilter("statusFilter", e.target.value)}
              className="h-9 px-2 text-sm rounded-md border border-border bg-card outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="All">All statuses</option>
              {statusTypes.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            {/* Domain Quick Filter */}
            <select
              value={domainFilter}
              onChange={(e) => setFilter("domainFilter", e.target.value)}
              className="h-9 px-2 text-sm rounded-md border border-border bg-card outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="All">All domains</option>
              {availableFilters.domains.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Expanded Filters Trigger */}
            <button
              onClick={() => setExpandedFilters(!expandedFilters)}
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3 text-sm rounded-md border border-border transition-colors hover:bg-muted",
                expandedFilters && "bg-accent/10 border-accent/30 text-accent"
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>More Filters</span>
              {expandedFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-warning/10 text-warning border border-warning/30">
              {pendingCount} unsaved
            </span>
          )}
          {canWrite && (
            <>
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
            </>
          )}
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Expanded Multi-Filter Section */}
      {expandedFilters && (
        <div className="p-4 bg-muted/20 border-b border-border grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 animate-fade-in-up">
          {/* State */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">State</label>
            <select
              value={stateFilter}
              onChange={(e) => setFilter("stateFilter", e.target.value)}
              className="h-8 px-2 text-xs rounded border border-border bg-card w-full"
            >
              <option value="All">All States</option>
              {availableFilters.states.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Location</label>
            <select
              value={locationFilter}
              onChange={(e) => setFilter("locationFilter", e.target.value)}
              className="h-8 px-2 text-xs rounded border border-border bg-card w-full"
            >
              <option value="All">All Locations</option>
              {availableFilters.locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Operating System */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">OS Catalog</label>
            <select
              value={osFilter}
              onChange={(e) => setFilter("osFilter", e.target.value)}
              className="h-8 px-2 text-xs rounded border border-border bg-card w-full"
            >
              <option value="All">All OS versions</option>
              {availableFilters.oss.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* Owner */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Owner</label>
            <select
              value={ownerFilter}
              onChange={(e) => setFilter("ownerFilter", e.target.value)}
              className="h-8 px-2 text-xs rounded border border-border bg-card w-full"
            >
              <option value="All">All Owners</option>
              {availableFilters.owners.map((ow) => (
                <option key={ow} value={ow}>{ow}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setFilter("priorityFilter", e.target.value)}
              className="h-8 px-2 text-xs rounded border border-border bg-card w-full"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Virtual Guest */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Virtualization</label>
            <select
              value={virtualGuestFilter}
              onChange={(e) => setFilter("virtualGuestFilter", e.target.value)}
              className="h-8 px-2 text-xs rounded border border-border bg-card w-full"
            >
              <option value="All">Virtual vs Physical</option>
              <option value="Yes">Virtual Guest</option>
              <option value="No">Physical Host</option>
            </select>
          </div>

          {/* Internet Facing */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Internet Exposure</label>
            <select
              value={internetFacingFilter}
              onChange={(e) => setFilter("internetFacingFilter", e.target.value)}
              className="h-8 px-2 text-xs rounded border border-border bg-card w-full"
            >
              <option value="All">Exposure (All)</option>
              <option value="Yes">Internet Facing</option>
              <option value="No">Internal Only</option>
            </select>
          </div>

          {/* PCI Asset */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">PCI Boundary</label>
            <select
              value={pciAssetFilter}
              onChange={(e) => setFilter("pciAssetFilter", e.target.value)}
              className="h-8 px-2 text-xs rounded border border-border bg-card w-full"
            >
              <option value="All">PCI Compliance (All)</option>
              <option value="Yes">PCI Asset</option>
              <option value="No">Non-PCI</option>
            </select>
          </div>

          {/* SOCI Asset */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">SOCI Scope</label>
            <select
              value={sociAssetFilter}
              onChange={(e) => setFilter("sociAssetFilter", e.target.value)}
              className="h-8 px-2 text-xs rounded border border-border bg-card w-full"
            >
              <option value="All">SOCI Boundary (All)</option>
              <option value="Yes">SOCI Asset</option>
              <option value="No">Non-SOCI</option>
            </select>
          </div>

          {/* Patch Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Compliance Status</label>
            <select
              value={isPatchedFilter}
              onChange={(e) => setFilter("isPatchedFilter", e.target.value)}
              className="h-8 px-2 text-xs rounded border border-border bg-card w-full"
            >
              <option value="All">Compliance (All)</option>
              <option value="Yes">Patched</option>
              <option value="No">Unpatched</option>
            </select>
          </div>

          {/* Business Group */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Business Group</label>
            <select
              value={businessGroupFilter}
              onChange={(e) => setFilter("businessGroupFilter", e.target.value)}
              className="h-8 px-2 text-xs rounded border border-border bg-card w-full"
            >
              <option value="All">All Groups</option>
              {availableFilters.businessGroups.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="h-8 px-3 text-xs w-full font-semibold rounded border border-dashed border-destructive text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 text-left select-none">
              <th className="px-3 py-3 w-10"></th>
              {[
                { label: "Server", field: "Servername" },
                { label: "IP Address", field: "DNSIP" },
                { label: "OS", field: "OSName" },
                { label: "Status", field: "Status" },
                { label: "Patched", field: "IsPatched" },
                { label: "Location", field: "LOCATIONNAME" },
                { label: "Domain", field: "domain" },
                { label: "Priority", field: "Priority" },
              ].map((h) => (
                <th 
                  key={h.field} 
                  onClick={() => toggleSort(h.field)}
                  className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>{h.label}</span>
                    {sortBy === h.field && (
                      <span className="text-[10px] text-accent">
                        {sortOrder === "ASC" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {servers.map((srv) => {
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
                      {canWrite ? (
                        <InlineSelect
                          value={s.status}
                          onSave={(v) => stageEdit(s.sno, { status: v as Server["status"] })}
                          options={statusTypes.map((st) => ({ value: st, label: st }))}
                          className="text-xs font-semibold"
                        />
                      ) : (
                        <StatusBadge status={s.status} />
                      )}
                    </td>
                    <td className="px-3 py-3"><PatchedBadge patched={s.isPatched} /></td>
                    <td className="px-3 py-3 text-xs text-muted-foreground max-w-[180px] truncate">{s.location}</td>
                    <td className="px-3 py-3 text-xs font-mono text-muted-foreground">
                      {customSearchActive ? highlightMatch(s.sdomain, searchTerm) : s.sdomain}
                    </td>
                    <td className="px-3 py-3"><PriorityBadge priority={s.priority} /></td>
                    <td className="px-3 py-3">
                      {canWrite ? (
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
                      ) : (
                        <span className="text-xs text-muted-foreground italic select-none">View only</span>
                      )}
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
            {servers.length === 0 && (
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
                            ? <>No servers match <span className="font-mono">"{searchTerm}"</span> in the selected scope.</>
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
          Showing <span className="font-mono text-foreground">{servers.length}</span> of{" "}
          <span className="font-mono text-foreground">{total}</span> servers
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
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
            onClick={() => setPage(Math.min(totalPages, page + 1))}
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
