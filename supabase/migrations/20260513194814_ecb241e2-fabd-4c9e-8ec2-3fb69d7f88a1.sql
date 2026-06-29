
CREATE TABLE IF NOT EXISTS public.locations_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_name text NOT NULL,
  status text NOT NULL DEFAULT 'Active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS locations_master_name_uq ON public.locations_master (lower(location_name));

CREATE TABLE IF NOT EXISTS public.os_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_name text NOT NULL,
  os_support_end_date text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS os_master_name_uq ON public.os_master (lower(os_name));

ALTER TABLE public.locations_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can view locations" ON public.locations_master FOR SELECT USING (true);
CREATE POLICY "anyone can insert locations" ON public.locations_master FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone can update locations" ON public.locations_master FOR UPDATE USING (true);
CREATE POLICY "anyone can delete locations" ON public.locations_master FOR DELETE USING (true);
CREATE POLICY "anyone can view os" ON public.os_master FOR SELECT USING (true);
CREATE POLICY "anyone can insert os" ON public.os_master FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone can update os" ON public.os_master FOR UPDATE USING (true);
CREATE POLICY "anyone can delete os" ON public.os_master FOR DELETE USING (true);

CREATE TRIGGER trg_locations_master_updated_at BEFORE UPDATE ON public.locations_master
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_os_master_updated_at BEFORE UPDATE ON public.os_master
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.locations_master (location_name)
SELECT DISTINCT NULLIF(trim(location), '') FROM public.servers
WHERE NULLIF(trim(location), '') IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.os_master (os_name, os_support_end_date)
SELECT NULLIF(trim(os), ''), COALESCE(MAX(os_support_ends), '')
FROM public.servers
WHERE NULLIF(trim(os), '') IS NOT NULL
GROUP BY NULLIF(trim(os), '')
ON CONFLICT DO NOTHING;

CREATE TABLE public.server_general_details (
  id text PRIMARY KEY,
  servername text NOT NULL,
  serial_number text NOT NULL DEFAULT '',
  ilo text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  soci_asset text NOT NULL DEFAULT 'No',
  pci_asset text NOT NULL DEFAULT 'No',
  model text NOT NULL DEFAULT '',
  ip_address text NOT NULL DEFAULT '',
  os text NOT NULL DEFAULT '',
  os_support_end_date text NOT NULL DEFAULT '',
  internet_facing text NOT NULL DEFAULT 'No',
  status text NOT NULL DEFAULT 'Active',
  network text NOT NULL DEFAULT '',
  domain text NOT NULL DEFAULT '',
  is_patched text NOT NULL DEFAULT 'No',
  build_date text NOT NULL DEFAULT '',
  business_function text NOT NULL DEFAULT '',
  build_engineer text NOT NULL DEFAULT '',
  server_description text NOT NULL DEFAULT '',
  alive text NOT NULL DEFAULT 'Yes',
  notes text NOT NULL DEFAULT '',
  software_installed_url text NOT NULL DEFAULT '',
  backup_details_url text NOT NULL DEFAULT '',
  patch_contact text NOT NULL DEFAULT '',
  design_engineer text NOT NULL DEFAULT '',
  primary_group_id text,
  affected_groups jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (pci_asset IN ('Yes','No')),
  CHECK (soci_asset IN ('Yes','No')),
  CHECK (internet_facing IN ('Yes','No')),
  CHECK (is_patched IN ('Yes','No')),
  CHECK (alive IN ('Yes','No'))
);
CREATE UNIQUE INDEX server_general_servername_uq ON public.server_general_details (lower(servername));

CREATE TABLE public.server_summary (
  servername text PRIMARY KEY,
  maintenance_comment text NOT NULL DEFAULT '',
  day text NOT NULL DEFAULT '',
  time text NOT NULL DEFAULT '',
  last_collated text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'Medium',
  patch_category text NOT NULL DEFAULT '',
  patch_sequence text NOT NULL DEFAULT '',
  patch_notes text NOT NULL DEFAULT '',
  essential8 text NOT NULL DEFAULT 'ML0',
  cpu_usage text NOT NULL DEFAULT '',
  memory_usage text NOT NULL DEFAULT '',
  disk_usage text NOT NULL DEFAULT '',
  monitoring_summary text NOT NULL DEFAULT '',
  last_scan_date text NOT NULL DEFAULT '',
  uptime text NOT NULL DEFAULT '',
  patch_summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.server_general_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone view sgd" ON public.server_general_details FOR SELECT USING (true);
CREATE POLICY "anyone insert sgd" ON public.server_general_details FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone update sgd" ON public.server_general_details FOR UPDATE USING (true);
CREATE POLICY "anyone delete sgd" ON public.server_general_details FOR DELETE USING (true);
CREATE POLICY "anyone view ss" ON public.server_summary FOR SELECT USING (true);
CREATE POLICY "anyone insert ss" ON public.server_summary FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone update ss" ON public.server_summary FOR UPDATE USING (true);
CREATE POLICY "anyone delete ss" ON public.server_summary FOR DELETE USING (true);

CREATE TRIGGER trg_sgd_updated_at BEFORE UPDATE ON public.server_general_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ss_updated_at BEFORE UPDATE ON public.server_summary
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.validate_server_master_refs()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.location IS NOT NULL AND NEW.location <> '' THEN
    IF NOT EXISTS (SELECT 1 FROM public.locations_master
       WHERE lower(location_name) = lower(NEW.location) AND status = 'Active') THEN
      RAISE EXCEPTION 'Invalid location "%": not found in locations_master', NEW.location;
    END IF;
  END IF;
  IF NEW.os IS NOT NULL AND NEW.os <> '' THEN
    IF NOT EXISTS (SELECT 1 FROM public.os_master
       WHERE lower(os_name) = lower(NEW.os) AND status = 'Active') THEN
      RAISE EXCEPTION 'Invalid OS "%": not found in os_master', NEW.os;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sgd_validate_masters
  BEFORE INSERT OR UPDATE ON public.server_general_details
  FOR EACH ROW EXECUTE FUNCTION public.validate_server_master_refs();

-- Dedupe by lower(server_name): keep most recently updated row
WITH ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY lower(server_name) ORDER BY updated_at DESC NULLS LAST, created_at DESC) AS rn
  FROM public.servers
)
INSERT INTO public.server_general_details (
  id, servername, serial_number, ilo, location, soci_asset, pci_asset, model,
  ip_address, os, os_support_end_date, internet_facing, status, network, domain,
  is_patched, build_date, business_function, build_engineer, server_description,
  alive, notes, software_installed_url, backup_details_url, patch_contact,
  design_engineer, primary_group_id, affected_groups, created_at, updated_at
)
SELECT
  id, server_name, serial_number, ilo, location,
  CASE WHEN lower(soci_asset) IN ('yes','y','true','1') THEN 'Yes' ELSE 'No' END,
  CASE WHEN lower(pci_asset)  IN ('yes','y','true','1') THEN 'Yes' ELSE 'No' END,
  model, ip_address, os, os_support_ends,
  CASE WHEN internet_facing = 'Yes' THEN 'Yes' ELSE 'No' END,
  COALESCE(status,'Active'), network, domain,
  CASE WHEN is_patched = 'Yes' THEN 'Yes' ELSE 'No' END,
  build_date, business_function, build_engineer, server_description,
  CASE WHEN alive = 'No' THEN 'No' ELSE 'Yes' END,
  notes, software_installed_url, backup_details_url, patch_contact,
  design_engineer, primary_group_id, COALESCE(affected_groups,'[]'::jsonb),
  created_at, updated_at
FROM ranked WHERE rn = 1;

WITH ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY server_name ORDER BY updated_at DESC NULLS LAST) AS rn
  FROM public.servers
)
INSERT INTO public.server_summary (
  servername, maintenance_comment, day, time, last_collated, priority,
  patch_category, patch_sequence, patch_notes, essential8
)
SELECT
  server_name, maintenance_comment, day, time, last_collated,
  COALESCE(priority,'Medium'), patch_category, patch_sequence, patch_notes,
  COALESCE(essential8,'ML0')
FROM ranked WHERE rn = 1
ON CONFLICT (servername) DO NOTHING;

ALTER TABLE public.servers RENAME TO servers_legacy_backup;

CREATE VIEW public.servers AS
SELECT
  g.id,
  g.servername AS server_name,
  g.servername AS servername,
  g.serial_number, g.ilo, g.location, g.soci_asset, g.pci_asset, g.model,
  g.ip_address, g.os,
  g.os_support_end_date AS os_support_ends,
  g.internet_facing, g.status, g.network, g.domain, g.is_patched,
  g.build_date, g.business_function, g.build_engineer, g.server_description,
  g.alive, g.notes, g.software_installed_url, g.backup_details_url,
  g.patch_contact, g.design_engineer, g.primary_group_id, g.affected_groups,
  s.maintenance_comment, s.day, s.time, s.last_collated, s.priority,
  s.patch_category, s.patch_sequence, s.patch_notes, s.essential8,
  s.cpu_usage, s.memory_usage, s.disk_usage, s.monitoring_summary,
  s.last_scan_date, s.uptime, s.patch_summary,
  GREATEST(g.updated_at, COALESCE(s.updated_at, g.updated_at)) AS updated_at,
  g.created_at
FROM public.server_general_details g
LEFT JOIN public.server_summary s ON s.servername = g.servername;
