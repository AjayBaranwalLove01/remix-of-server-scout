import { create } from "zustand";
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
    try {
      const [locRes, osRes] = await Promise.all([
        fetch("/api/locations").then((r) => {
          if (!r.ok) throw new Error("Failed to load locations");
          return r.json();
        }),
        fetch("/api/os").then((r) => {
          if (!r.ok) throw new Error("Failed to load OS catalog");
          return r.json();
        })
      ]);

      // Map SQL Server returned columns back to the camelCase naming used in the stores/types
      const mappedLocations = locRes.map((l: any) => ({
        id: String(l.ID),
        location_name: l.Description,
        status: l.Status,
        created_at: l.created_at,
        updated_at: l.updated_at
      }));

      const mappedOs = osRes.map((o: any) => ({
        id: String(o.ID),
        os_name: o.OSName,
        os_support_end_date: o.OSSupportEnds,
        status: o.Status,
        created_at: o.created_at,
        updated_at: o.updated_at
      }));

      set({
        locations: mappedLocations,
        os: mappedOs,
        loaded: true,
        loading: false,
        error: null,
      });
    } catch (e: any) {
      set({ loading: false, loaded: true, error: e.message || "Load failed" });
    }
  },

  createLocation: async (input) => {
    const res = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to create location");
    }
    const raw = await res.json();
    const data: LocationMaster = {
      id: String(raw.ID),
      location_name: raw.Description,
      status: raw.Status
    };
    set((s) => ({ locations: [...s.locations, data].sort((a, b) => a.location_name.localeCompare(b.location_name)) }));
  },
  updateLocation: async (id, patch) => {
    const res = await fetch(`/api/locations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to update location");
    }
    const raw = await res.json();
    const data: LocationMaster = {
      id: String(raw.ID),
      location_name: raw.Description,
      status: raw.Status
    };
    set((s) => ({ locations: s.locations.map((l) => (l.id === id ? data : l)) }));
  },
  deleteLocation: async (id) => {
    const res = await fetch(`/api/locations/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to delete location");
    }
    set((s) => ({ locations: s.locations.filter((l) => l.id !== id) }));
  },

  createOs: async (input) => {
    const res = await fetch("/api/os", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to create OS catalog entry");
    }
    const raw = await res.json();
    const data: OsMaster = {
      id: String(raw.ID),
      os_name: raw.OSName,
      os_support_end_date: raw.OSSupportEnds,
      status: raw.Status
    };
    set((s) => ({ os: [...s.os, data].sort((a, b) => a.os_name.localeCompare(b.os_name)) }));
  },
  updateOs: async (id, patch) => {
    const res = await fetch(`/api/os/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to update OS catalog entry");
    }
    const raw = await res.json();
    const data: OsMaster = {
      id: String(raw.ID),
      os_name: raw.OSName,
      os_support_end_date: raw.OSSupportEnds,
      status: raw.Status
    };
    set((s) => ({ os: s.os.map((o) => (o.id === id ? data : o)) }));
  },
  deleteOs: async (id) => {
    const res = await fetch(`/api/os/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to delete OS catalog entry");
    }
    set((s) => ({ os: s.os.filter((o) => o.id !== id) }));
  },
}));
