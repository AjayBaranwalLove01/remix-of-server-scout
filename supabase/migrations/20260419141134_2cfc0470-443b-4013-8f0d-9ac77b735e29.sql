
-- Support groups table
CREATE TABLE public.support_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  manager TEXT NOT NULL,
  members TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view support groups" ON public.support_groups FOR SELECT USING (true);
CREATE POLICY "Anyone can insert support groups" ON public.support_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update support groups" ON public.support_groups FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete support groups" ON public.support_groups FOR DELETE USING (true);

-- Servers table
CREATE TABLE public.servers (
  id TEXT PRIMARY KEY,
  -- General
  server_name TEXT NOT NULL,
  serial_number TEXT NOT NULL DEFAULT '',
  ilo TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  soci_asset TEXT NOT NULL DEFAULT '',
  pci_asset TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  ip_address TEXT NOT NULL DEFAULT '',
  os TEXT NOT NULL DEFAULT '',
  os_support_ends TEXT NOT NULL DEFAULT '',
  internet_facing TEXT NOT NULL DEFAULT 'No',
  status TEXT NOT NULL DEFAULT 'Active',
  network TEXT NOT NULL DEFAULT '',
  domain TEXT NOT NULL DEFAULT '',
  is_patched TEXT NOT NULL DEFAULT 'No',
  essential8 TEXT NOT NULL DEFAULT 'ML0',
  -- Summary
  build_date TEXT NOT NULL DEFAULT '',
  business_function TEXT NOT NULL DEFAULT '',
  patch_sequence TEXT NOT NULL DEFAULT '',
  maintenance_comment TEXT NOT NULL DEFAULT '',
  day TEXT NOT NULL DEFAULT '',
  time TEXT NOT NULL DEFAULT '',
  build_engineer TEXT NOT NULL DEFAULT '',
  server_description TEXT NOT NULL DEFAULT '',
  alive TEXT NOT NULL DEFAULT 'Yes',
  last_collated TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'Medium',
  patch_category TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  software_installed_url TEXT NOT NULL DEFAULT '',
  backup_details_url TEXT NOT NULL DEFAULT '',
  -- Patching
  patch_contact TEXT NOT NULL DEFAULT '',
  patch_notes TEXT NOT NULL DEFAULT '',
  design_engineer TEXT NOT NULL DEFAULT '',
  -- Support
  primary_group_id TEXT,
  affected_groups JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view servers" ON public.servers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert servers" ON public.servers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update servers" ON public.servers FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete servers" ON public.servers FOR DELETE USING (true);

-- Indexes for fast search
CREATE INDEX idx_servers_server_name ON public.servers (server_name);
CREATE INDEX idx_servers_ip_address ON public.servers (ip_address);
CREATE INDEX idx_servers_status ON public.servers (status);
CREATE INDEX idx_servers_domain ON public.servers (domain);
CREATE INDEX idx_servers_serial_number ON public.servers (serial_number);
CREATE INDEX idx_servers_priority ON public.servers (priority);

-- Auto update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_servers_updated_at
BEFORE UPDATE ON public.servers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_groups_updated_at
BEFORE UPDATE ON public.support_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
