import { create } from "zustand";
import { rowToServer, rowToGroup, emptyServer } from "@/lib/serverMapper";
import type { Server, SupportGroup } from "@/types/server";

export type SearchFilter = "status" | "custom";

export interface DashboardCounts {
  total: number;
  active: number;
  down: number;
  maintenance: number;
  decommissioned: number;
  patched: number;
  critical: number;
  internetFacing: number;
  pciAssets: number;
  sociAssets: number;
  virtualServers: number;
  physicalServers: number;
}

interface ServerStore {
  servers: Server[];
  groups: SupportGroup[];
  loading: boolean;
  loaded: boolean;
  error: string | null;

  // Search & Filter state
  searchTerm: string;
  searchFilters: SearchFilter[];
  statusFilter: string;
  domainFilter: string;
  stateFilter: string;
  locationFilter: string;
  siteTypeFilter: string;
  ownerFilter: string;
  osFilter: string;
  priorityFilter: string;
  businessGroupFilter: string;
  virtualGuestFilter: string;
  internetFacingFilter: string;
  pciAssetFilter: string;
  sociAssetFilter: string;
  isPatchedFilter: string;
  patchCategoryFilter: string;

  // Pagination & Sorting state
  page: number;
  pageSize: number;
  total: number;
  sortBy: string;
  sortOrder: "ASC" | "DESC";

  // Dynamic filter lists fetched from server
  availableFilters: {
    states: string[];
    locations: string[];
    owners: string[];
    oss: string[];
    domains: string[];
    businessGroups: string[];
  };

  statusTypes: string[];

  patchCategories: string[];
  patchSequences: string[];
  serverDomains: string[];
  engineers: string[];
  dropdownsLoaded: boolean;

  // Dashboard Stats
  dashboardStats: DashboardCounts | null;
  loadingStats: boolean;

  // Actions
  setSearchTerm: (term: string) => void;
  toggleSearchFilter: (filter: SearchFilter) => void;
  setSearchFilters: (filters: SearchFilter[]) => void;
  resetSearch: () => void;

  setFilter: (key: string, value: string) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSorting: (sortBy: string, sortOrder: "ASC" | "DESC") => void;
  resetFilters: () => void;

  fetchStatusTypes: () => Promise<void>;
  fetchDropdownMasters: () => Promise<void>;
  fetchAll: () => Promise<void>;
  fetchFiltersMetadata: () => Promise<void>;
  fetchDashboardStats: () => Promise<void>;
  refreshOne: (id: string) => Promise<void>;
  updateServer: (sdbID: number, patch: Partial<Server>) => Promise<void>;
  bulkUpdate: (updates: Record<number, Partial<Server>>) => Promise<void>;
  createServer: () => Promise<Server | null>;
  deleteServer: (sdbID: number) => Promise<void>;
}
const getHeaders = (extra: Record<string, string> = {}) => {
  const token = localStorage.getItem("scout_token");
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const useServerStore = create<ServerStore>((set, get) => ({
  servers: [],
  groups: [],
  loading: false,
  loaded: false,
  error: null,

  // Search & Filter defaults
  searchTerm: "",
  searchFilters: ["status", "custom"],
  statusFilter: "All",
  domainFilter: "All",
  stateFilter: "All",
  locationFilter: "All",
  siteTypeFilter: "All",
  ownerFilter: "All",
  osFilter: "All",
  priorityFilter: "All",
  businessGroupFilter: "All",
  virtualGuestFilter: "All",
  internetFacingFilter: "All",
  pciAssetFilter: "All",
  sociAssetFilter: "All",
  isPatchedFilter: "All",
  patchCategoryFilter: "All",

  // Pagination & Sorting defaults
  page: 1,
  pageSize: 6,
  total: 0,
  sortBy: "Servername",
  sortOrder: "ASC",

  statusTypes: [],

  patchCategories: [],
  patchSequences: [],
  serverDomains: [],
  engineers: [],
  dropdownsLoaded: false,

  availableFilters: {
    states: [],
    locations: [],
    owners: [],
    oss: [],
    domains: [],
    businessGroups: []
  },

  dashboardStats: null,
  loadingStats: false,

  setSearchTerm: (term) => {
    set({ searchTerm: term, page: 1 });
    get().fetchAll();
  },
  
  setSearchFilters: (filters) => {
    set({ searchFilters: filters, page: 1 });
    get().fetchAll();
  },

  toggleSearchFilter: (filter) =>
    set((s) => {
      const has = s.searchFilters.includes(filter);
      const next = has
        ? s.searchFilters.filter((f) => f !== filter)
        : [...s.searchFilters, filter];
      const result = next.length ? next : s.searchFilters;
      setTimeout(() => get().fetchAll(), 0);
      return { searchFilters: result, page: 1 };
    }),

  resetSearch: () => {
    set({ searchTerm: "", page: 1 });
    get().fetchAll();
  },

  setFilter: (key, value) => {
    set({ [key]: value, page: 1 });
    get().fetchAll();
  },

  setPage: (page) => {
    set({ page });
    get().fetchAll();
  },

  setPageSize: (size) => {
    set({ pageSize: size, page: 1 });
    get().fetchAll();
  },

  setSorting: (sortBy, sortOrder) => {
    set({ sortBy, sortOrder, page: 1 });
    get().fetchAll();
  },

  resetFilters: () => {
    set({
      statusFilter: "All",
      domainFilter: "All",
      stateFilter: "All",
      locationFilter: "All",
      siteTypeFilter: "All",
      ownerFilter: "All",
      osFilter: "All",
      priorityFilter: "All",
      businessGroupFilter: "All",
      virtualGuestFilter: "All",
      internetFacingFilter: "All",
      pciAssetFilter: "All",
      sociAssetFilter: "All",
      isPatchedFilter: "All",
      patchCategoryFilter: "All",
      searchTerm: "",
      page: 1
    });
    get().fetchAll();
  },

  fetchAll: async () => {
    set({ loading: true, error: null });
    const s = get();
    
    // Construct query parameters for pagination, sorting, search, and all filters
    const queryParams = new URLSearchParams({
      page: String(s.page),
      pageSize: String(s.pageSize),
      search: s.searchTerm,
      sortBy: s.sortBy,
      sortOrder: s.sortOrder,
      status: s.statusFilter,
      domain: s.domainFilter,
      state: s.stateFilter,
      location: s.locationFilter,
      siteType: s.siteTypeFilter,
      owner: s.ownerFilter,
      os: s.osFilter,
      priority: s.priorityFilter,
      businessGroup: s.businessGroupFilter,
      virtualGuest: s.virtualGuestFilter,
      internetFacing: s.internetFacingFilter,
      pciAsset: s.pciAssetFilter,
      sociAsset: s.sociAssetFilter,
      isPatched: s.isPatchedFilter,
      patchCategory: s.patchCategoryFilter
    });

    try {
      const [srvRes, grpRes] = await Promise.all([
        fetch(`/api/servers?${queryParams}`, { headers: getHeaders() }).then((r) => {
          if (!r.ok) throw new Error("Failed to load servers list");
          return r.json();
        }),
        fetch("/api/groups", { headers: getHeaders() }).then((r) => {
          if (!r.ok) throw new Error("Failed to load support groups");
          return r.json();
        })
      ]);

      set({
        servers: (srvRes.servers ?? []).map(rowToServer),
        total: srvRes.total ?? 0,
        groups: (grpRes ?? []).map(rowToGroup),
        loading: false,
        loaded: true,
        error: null
      });
    } catch (e: any) {
      set({
        loading: false,
        loaded: true,
        error: e.message || "Failed to sync inventory database."
      });
    }
  },

  fetchFiltersMetadata: async () => {
    try {
      const r = await fetch("/api/servers/filters", { headers: getHeaders() });
      if (!r.ok) throw new Error("Failed to load filter headers metadata");
      const data = await r.json();
      set({
        availableFilters: {
          states: data.states || [],
          locations: data.locations || [],
          owners: data.owners || [],
          oss: data.oss || [],
          domains: data.domains || [],
          businessGroups: data.businessGroups || []
        }
      });
    } catch (e) {
      console.error("Failed to load filter metadata:", e);
    }
  },

  fetchDashboardStats: async () => {
    set({ loadingStats: true });
    try {
      const r = await fetch("/api/dashboard/stats", { headers: getHeaders() });
      if (!r.ok) throw new Error("Failed to load dashboard metrics");
      const data = await r.json();
      set({
        dashboardStats: data,
        loadingStats: false
      });
    } catch (e) {
      console.error("Dashboard stats failed to fetch:", e);
      set({ loadingStats: false });
    }
  },

  fetchStatusTypes: async () => {
    try {
      const r = await fetch("/api/status-types", { headers: getHeaders() });
      if (!r.ok) throw new Error("Failed to load status types");
      const data = await r.json();
      set({ statusTypes: data });
    } catch (e) {
      console.error("Failed to load status types:", e);
    }
  },

  fetchDropdownMasters: async () => {
    if (get().dropdownsLoaded) return;
    try {
      const r = await fetch("/api/masters/dropdowns", { headers: getHeaders() });
      if (!r.ok) throw new Error("Failed to load master dropdowns");
      const data = await r.json();
      set({
        patchCategories: data.patchCategories || [],
        patchSequences: data.patchSequences || [],
        serverDomains: data.serverDomains || [],
        engineers: data.engineers || [],
        dropdownsLoaded: true
      });
    } catch (e) {
      console.error("Failed to load master dropdowns:", e);
    }
  },

  refreshOne: async (id) => {
    try {
      const r = await fetch(`/api/servers/${id}`, { headers: getHeaders() });
      if (!r.ok) return;
      const data = await r.json();
      const updated = rowToServer(data);
      set((s) => ({
        servers: s.servers.map((srv) => (String(srv.id) === String(id) ? updated : srv))
      }));
    } catch (e) {
      console.error(`Failed to refresh server ${id}:`, e);
    }
  },

  updateServer: async (sdbID, patch) => {
    // Optimistically update
    const existing = get().servers.find((srv) => srv.sno === sdbID);
    if (!existing || !existing.id) throw new Error("Server not found");

    const res = await fetch(`/api/servers/${existing.id}`, {
      method: "PUT",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(patch)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Update failed on server");
    }

    const data = await res.json();
    const updated = rowToServer(data);
    
    set((s) => ({
      servers: s.servers.map((srv) => (srv.sno === sdbID ? updated : srv))
    }));
    
    // Refresh dashboard stats after database changes
    get().fetchDashboardStats();
  },

  bulkUpdate: async (updates) => {
    const ids = Object.keys(updates).map(Number);
    await Promise.all(ids.map((sno) => get().updateServer(sno, updates[sno])));
  },

  createServer: async () => {
    const draft = emptyServer(0);
    const res = await fetch("/api/servers", {
      method: "POST",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(draft)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Creation failed");
    }

    const data = await res.json();
    const created = rowToServer(data);

    set((s) => ({
      servers: [created, ...s.servers],
      total: s.total + 1
    }));
    
    // Refresh dashboard stats and inventory
    get().fetchDashboardStats();
    get().fetchAll();
    
    return created;
  },

  deleteServer: async (sdbID) => {
    const existing = get().servers.find((srv) => srv.sno === sdbID);
    if (!existing || !existing.id) throw new Error("Server not found");

    const res = await fetch(`/api/servers/${existing.id}`, {
      method: "DELETE",
      headers: getHeaders()
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Deletion failed");
    }

    set((s) => ({
      servers: s.servers.filter((srv) => srv.sno !== sdbID),
      total: Math.max(0, s.total - 1)
    }));

    get().fetchDashboardStats();
    get().fetchAll();
  }
}));
