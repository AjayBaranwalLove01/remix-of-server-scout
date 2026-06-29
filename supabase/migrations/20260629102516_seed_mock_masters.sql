INSERT INTO public.support_groups (id, name, manager, members, created_at, updated_at) VALUES
('sg-infra', 'Infrastructure Operations', 'Sarah Whitman', ARRAY['Liam Chen', 'Priya Kapoor', 'Marcus Reed', 'Hana Suzuki', 'Diego Alvarez'], '2026-06-29T10:28:19.082Z'::timestamptz, '2026-06-29T10:28:19.082Z'::timestamptz),
('sg-security', 'Security & Compliance', 'Jonas Becker', ARRAY['Amira Khan', 'Ravi Subramanian', 'Elena Petrov', 'Tom Whitley'], '2026-06-29T10:28:19.082Z'::timestamptz, '2026-06-29T10:28:19.082Z'::timestamptz),
('sg-database', 'Database Engineering', 'Olivia Martens', ARRAY['Wei Zhang', 'Noah Fitzgerald', 'Yara Haddad', 'Felix Bauer'], '2026-06-29T10:28:19.082Z'::timestamptz, '2026-06-29T10:28:19.082Z'::timestamptz),
('sg-network', 'Network & Connectivity', 'Daniel Okafor', ARRAY['Mei Lin', 'Carlos Vega', 'Anya Sokolov', 'Ben Hartman'], '2026-06-29T10:28:19.082Z'::timestamptz, '2026-06-29T10:28:19.082Z'::timestamptz),
('sg-app', 'Application Support', 'Rachel Goldberg', ARRAY['Theo Russo', 'Sana Iqbal', 'Kenji Watanabe', 'Lara Novak', 'Owen Briggs'], '2026-06-29T10:28:19.083Z'::timestamptz, '2026-06-29T10:28:19.083Z'::timestamptz)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.locations_master (location_name, status, created_at, updated_at) VALUES
('Sydney DC1 — Rack A14', 'Active', '2026-06-29T10:28:19.084Z'::timestamptz, '2026-06-29T10:28:19.084Z'::timestamptz),
('Sydney DC1 — Rack A15', 'Active', '2026-06-29T10:28:19.084Z'::timestamptz, '2026-06-29T10:28:19.084Z'::timestamptz),
('Sydney DC2 — Rack B07', 'Active', '2026-06-29T10:28:19.084Z'::timestamptz, '2026-06-29T10:28:19.084Z'::timestamptz),
('Sydney DC1 — Rack C03', 'Active', '2026-06-29T10:28:19.084Z'::timestamptz, '2026-06-29T10:28:19.084Z'::timestamptz),
('Sydney DC1 — Rack A16', 'Active', '2026-06-29T10:28:19.084Z'::timestamptz, '2026-06-29T10:28:19.084Z'::timestamptz),
('Sydney DC1 — Rack A02', 'Active', '2026-06-29T10:28:19.084Z'::timestamptz, '2026-06-29T10:28:19.084Z'::timestamptz),
('Sydney DC1 — DMZ Cage', 'Active', '2026-06-29T10:28:19.084Z'::timestamptz, '2026-06-29T10:28:19.084Z'::timestamptz),
('Sydney DC2 — Rack B11', 'Active', '2026-06-29T10:28:19.084Z'::timestamptz, '2026-06-29T10:28:19.084Z'::timestamptz),
('Sydney DC2 — Rack C09', 'Active', '2026-06-29T10:28:19.084Z'::timestamptz, '2026-06-29T10:28:19.084Z'::timestamptz),
('Sydney DC1 — Rack A19', 'Active', '2026-06-29T10:28:19.084Z'::timestamptz, '2026-06-29T10:28:19.084Z'::timestamptz)
ON CONFLICT (lower(location_name)) DO NOTHING;

INSERT INTO public.os_master (os_name, os_support_end_date, status, created_at, updated_at) VALUES
('Windows Server 2022', '2031-10-14', 'Active', '2026-06-29T10:28:19.084Z'::timestamptz, '2026-06-29T10:28:19.084Z'::timestamptz),
('Windows Server 2019', '2029-01-09', 'Active', '2026-06-29T10:28:19.084Z'::timestamptz, '2026-06-29T10:28:19.084Z'::timestamptz),
('Windows Server 2016', '2027-01-12', 'Active', '2026-06-29T10:28:19.084Z'::timestamptz, '2026-06-29T10:28:19.084Z'::timestamptz)
ON CONFLICT (lower(os_name)) DO NOTHING;