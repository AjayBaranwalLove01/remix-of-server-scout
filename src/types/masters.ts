export interface LocationMaster {
  id: string;
  location_name: string;
  status: "Active" | "Inactive";
  created_at?: string;
  updated_at?: string;
}

export interface OsMaster {
  id: string;
  os_name: string;
  os_support_end_date: string;
  status: "Active" | "Inactive";
  created_at?: string;
  updated_at?: string;
}
