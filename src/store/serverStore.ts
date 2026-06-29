import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { rowToServer, rowToGroup, splitPatch, emptyServer } from "@/lib/serverMapper";
import type { Server, SupportGroup } from "@/types/server";

const SERVERS_VIEW = "servers";
const GENERAL_TABLE = "server_general_details";
const SUMMARY_TABLE = "server_summary";

export type SearchFilter = "status" | "custom";

interface ServerStore {
  servers: Server[];
  groups: SupportGroup[];
  loading: boolean;
  loaded: boolean;
  error: string | null;

  searchTerm: string;
  searchFilters: SearchFilter[];

  setSearchTerm: (term: string) => void;
  toggleSearchFilter: (filter: SearchFilter) => void;
  setSearchFilters: (filters: SearchFilter[]) => void;
  resetSearch: () => void;

  fetchAll: () => Promise<void>;
  refreshOne: (id: string) => Promise<void>;
  updateServer: (sno: number, patch: Partial<Server>) => Promise<void>;
  bulkUpdate: (updates: Record<number, Partial<Server>>) => Promise<void>;
  createServer: () => Promise<Server | null>;
  deleteServer: (sno: number) => Promise<void>;
}

export const useServerStore = create<ServerStore>((set, get) => ({
  servers: [],
  groups: [],
  loading: false,
  loaded: false,
  error: null,

  searchTerm: "",
  searchFilters: ["status", "custom"],
  setSearchTerm: (term) => set({ searchTerm: term }),
  setSearchFilters: (filters) => set({ searchFilters: filters }),
  toggleSearchFilter: (filter) =>
    set((s) => {
      const has = s.searchFilters.includes(filter);
      const next = has
        ? s.searchFilters.filter((f) => f !== filter)
        : [...s.searchFilters, filter];
      return { searchFilters: next.length ? next : s.searchFilters };
    }),
  resetSearch: () => set({ searchTerm: "" }),

  fetchAll: async () => {
    set({ loading: true, error: null });
    const [serversRes, groupsRes] = await Promise.all([
      (supabase.from as any)(SERVERS_VIEW).select("*").order("server_name", { ascending: true }),
      supabase.from("support_groups").select("*").order("name", { ascending: true }),
    ]);
    if (serversRes.error || groupsRes.error) {
      set({
        loading: false,
        loaded: true,
        error: serversRes.error?.message || groupsRes.error?.message || "Load failed",
      });
      return;
    }
    set({
      servers: (serversRes.data ?? []).map(rowToServer),
      groups: (groupsRes.data ?? []).map(rowToGroup),
      loading: false,
      loaded: true,
      error: null,
    });
  },

  refreshOne: async (id) => {
    const { data } = await (supabase.from as any)(SERVERS_VIEW).select("*").eq("id", id).maybeSingle();
    if (!data) return;
    const updated = rowToServer(data);
    set((s) => ({ servers: s.servers.map((srv) => (srv.id === id ? updated : srv)) }));
  },

  updateServer: async (sno, patch) => {
    const existing = get().servers.find((srv) => srv.sno === sno);
    if (!existing || !existing.id) throw new Error("Server not found");

    const { general, summary } = splitPatch(patch);
    const oldName = existing.servername;
    const newName = (general.servername as string | undefined) ?? oldName;

    // 1) Update summary first (keyed by old servername) if there are summary fields
    if (Object.keys(summary).length) {
      // upsert in case row was missing
      const { error: sumErr } = await (supabase.from as any)(SUMMARY_TABLE)
        .upsert({ servername: oldName, ...summary }, { onConflict: "servername" });
      if (sumErr) { set({ error: sumErr.message }); throw sumErr; }
    }

    // 2) If servername is changing, propagate to summary
    if (general.servername && newName !== oldName) {
      const { error: renameErr } = await (supabase.from as any)(SUMMARY_TABLE)
        .update({ servername: newName }).eq("servername", oldName);
      if (renameErr) { set({ error: renameErr.message }); throw renameErr; }
    }

    // 3) Update general details
    if (Object.keys(general).length) {
      const { error: genErr } = await (supabase.from as any)(GENERAL_TABLE)
        .update(general).eq("id", existing.id);
      if (genErr) { set({ error: genErr.message }); throw genErr; }
    }

    await get().refreshOne(existing.id);
  },

  bulkUpdate: async (updates) => {
    const ids = Object.keys(updates).map(Number);
    await Promise.all(ids.map((sno) => get().updateServer(sno, updates[sno])));
  },

  createServer: async () => {
    const draft = emptyServer(Date.now());
    // Pick a unique placeholder servername
    let candidate = "NEW-SERVER";
    const lower = new Set(get().servers.map((s) => s.servername.toLowerCase()));
    let i = 1;
    while (lower.has(candidate.toLowerCase())) {
      candidate = `NEW-SERVER-${i++}`;
    }
    draft.servername = candidate;

    const { general, summary } = splitPatch(draft);
    general.id = draft.id;
    general.servername = candidate;

    const { error: gErr } = await (supabase.from as any)(GENERAL_TABLE).insert(general);
    if (gErr) { set({ error: gErr.message }); throw gErr; }

    const { error: sErr } = await (supabase.from as any)(SUMMARY_TABLE)
      .insert({ servername: candidate, ...summary });
    if (sErr) { set({ error: sErr.message }); throw sErr; }

    const { data: viewRow } = await (supabase.from as any)(SERVERS_VIEW)
      .select("*").eq("id", draft.id).maybeSingle();
    const created = viewRow ? rowToServer(viewRow) : draft;
    set((s) => ({ servers: [created, ...s.servers] }));
    return created;
  },

  deleteServer: async (sno) => {
    const existing = get().servers.find((srv) => srv.sno === sno);
    if (!existing || !existing.id) throw new Error("Server not found");
    const { error: gErr } = await (supabase.from as any)(GENERAL_TABLE).delete().eq("id", existing.id);
    if (gErr) { set({ error: gErr.message }); throw gErr; }
    await (supabase.from as any)(SUMMARY_TABLE).delete().eq("servername", existing.servername);
    set((s) => ({ servers: s.servers.filter((srv) => srv.sno !== sno) }));
  },
}));
