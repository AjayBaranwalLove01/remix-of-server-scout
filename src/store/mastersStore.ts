import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { LocationMaster, OsMaster } from "@/types/masters";

interface MastersStore {
  locations: LocationMaster[];
  os: OsMaster[];
  loaded: boolean;
  loading: boolean;
  error: string | null;

  fetchAll: () => Promise<void>;

  // Locations
  createLocation: (input: Pick<LocationMaster, "location_name" | "status">) => Promise<void>;
  updateLocation: (id: string, patch: Partial<LocationMaster>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;

  // OS
  createOs: (input: Pick<OsMaster, "os_name" | "os_support_end_date" | "status">) => Promise<void>;
  updateOs: (id: string, patch: Partial<OsMaster>) => Promise<void>;
  deleteOs: (id: string) => Promise<void>;
}

export const useMastersStore = create<MastersStore>((set, get) => ({
  locations: [],
  os: [],
  loaded: false,
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    const [locRes, osRes] = await Promise.all([
      (supabase.from as any)("locations_master").select("*").order("location_name"),
      (supabase.from as any)("os_master").select("*").order("os_name"),
    ]);
    if (locRes.error || osRes.error) {
      set({ loading: false, loaded: true, error: locRes.error?.message || osRes.error?.message || "Load failed" });
      return;
    }
    set({
      locations: (locRes.data ?? []) as LocationMaster[],
      os: (osRes.data ?? []) as OsMaster[],
      loaded: true,
      loading: false,
      error: null,
    });
  },

  createLocation: async (input) => {
    const { data, error } = await (supabase.from as any)("locations_master")
      .insert({ location_name: input.location_name.trim(), status: input.status })
      .select().single();
    if (error) throw error;
    set((s) => ({ locations: [...s.locations, data].sort((a, b) => a.location_name.localeCompare(b.location_name)) }));
  },
  updateLocation: async (id, patch) => {
    const update: any = {};
    if (patch.location_name !== undefined) update.location_name = patch.location_name.trim();
    if (patch.status !== undefined) update.status = patch.status;
    const { data, error } = await (supabase.from as any)("locations_master").update(update).eq("id", id).select().single();
    if (error) throw error;
    set((s) => ({ locations: s.locations.map((l) => (l.id === id ? data : l)) }));
  },
  deleteLocation: async (id) => {
    const { error } = await (supabase.from as any)("locations_master").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ locations: s.locations.filter((l) => l.id !== id) }));
  },

  createOs: async (input) => {
    const { data, error } = await (supabase.from as any)("os_master")
      .insert({ os_name: input.os_name.trim(), os_support_end_date: input.os_support_end_date, status: input.status })
      .select().single();
    if (error) throw error;
    set((s) => ({ os: [...s.os, data].sort((a, b) => a.os_name.localeCompare(b.os_name)) }));
  },
  updateOs: async (id, patch) => {
    const update: any = {};
    if (patch.os_name !== undefined) update.os_name = patch.os_name.trim();
    if (patch.os_support_end_date !== undefined) update.os_support_end_date = patch.os_support_end_date;
    if (patch.status !== undefined) update.status = patch.status;
    const { data, error } = await (supabase.from as any)("os_master").update(update).eq("id", id).select().single();
    if (error) throw error;
    set((s) => ({ os: s.os.map((o) => (o.id === id ? data : o)) }));
  },
  deleteOs: async (id) => {
    const { error } = await (supabase.from as any)("os_master").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ os: s.os.filter((o) => o.id !== id) }));
  },
}));
