## Goal
Refactor the schema and UI: introduce master tables for Locations and OS, split server data into general+summary tables joined by `servername`, enforce Yes/No on PCI/SOCI, enforce unique `servername`, and provide master-data admin pages plus dropdown-driven forms. Deliver SQL + Node code for your local MSSQL backend, and apply migrations + UI changes to this Lovable Cloud app.

## Supabase (this app) — migrations
1. `locations_master` — `id`, `location_name UNIQUE`, `status`, timestamps. RLS public. Trigger for `updated_at`.
2. `os_master` — `id`, `os_name UNIQUE`, `os_support_end_date`, `status`, timestamps. RLS public.
3. `server_general_details` — all "static" columns from current `servers` (servername, hostname, location, os, os_support_end_date, ip_address, soci_asset, pci_asset, network, domain, status, internet_facing, model, ilo, serial_number, build_date, build_engineer, business_function, owner/patch_contact/design_engineer, primary_group_id, affected_groups, server_description, notes, urls). UNIQUE on `servername` (case-insensitive index). Yes/No CHECK on `pci_asset`, `soci_asset`, `internet_facing`, `is_patched`, `alive`.
4. `server_summary` — servername UNIQUE, cpu_usage, memory_usage, disk_usage, monitoring_summary, last_scan_date, uptime, patch_summary, patch_sequence, patch_category, patch_notes, maintenance_comment, day, time, last_collated, priority, essential8.
5. View `servers` — `LEFT JOIN` general+summary on `servername`, exposes a flat row matching what the UI already reads. Frontend keeps reading `servers`.
6. Data migration: copy existing `servers` rows into both new tables; auto-seed `locations_master` from `DISTINCT location` and `os_master` from `DISTINCT (os, os_support_ends)`.
7. Drop the old `servers` table after view is created (renamed to `servers_legacy_backup` first for safety).

No FK constraints between server tables and master tables — enforced in app + via a `BEFORE INSERT/UPDATE` validation trigger that checks existence in masters (still no FK, satisfies "no foreign key constraints" while guaranteeing integrity).

## App-level changes (React)

### Store / API
- `serverStore`: read from view `servers`; writes split into `server_general_details` (general fields) and `server_summary` (summary fields) keyed by `servername`. Update logic: if `servername` changed, update child first then key change in parent in a single RPC `update_server_by_sname`.
- New stores: `locationsStore`, `osStore` with full CRUD against masters.
- Validation helper `validateServer(patch, {servers, locations, os})` returning `{ok, errors}`. Used by both detail panel save and master pages.

### UI
- New routes:
  - `/locations` — table + add/edit/delete dialog.
  - `/os` — table + add/edit/delete dialog (includes support end date).
- `Sidebar`/`TopBar`: nav links to Inventory, Locations, OS Catalog.
- `ServerDetailPanel` (and inline edit in table):
  - Location → `<select>` from `locationsStore`.
  - OS → `<select>` from `osStore`; on change auto-fills `osSupportEnds` from chosen OS row (read-only field after).
  - PCI/SOCI → Yes/No select.
  - Servername field shows inline error "Server name already exists" when duplicate detected (case-insensitive, ignoring own row).
- Save button disabled while validation errors present; toast on save errors.

### Validation rules
- `servername`: required, trimmed, max 100, unique among other rows.
- `pci_asset`/`soci_asset`: must be `"Yes"` or `"No"`.
- `location`: must be present in `locations_master` (active only).
- `os`: must be present in `os_master` (active only); `os_support_end_date` derived.

## Local MSSQL deliverables (files in /mnt/documents)
- `mssql_schema.sql` — `CREATE TABLE locationsMaster`, `osMaster`, `server_general_details`, `server_summary`, `CREATE VIEW servers`, unique indexes (incl. `UNIQUE` on `servername` via filtered/computed index for case-insensitive), Yes/No CHECK constraints, validation triggers for location/os existence (no FKs).
- `mssql_seed.sql` — sample rows for `locationsMaster` and `osMaster` (matching the seed used in Supabase) plus migration `INSERT … SELECT` from existing `servers` table to the two new tables.
- `serverController.js` updated reference — split create/update into both tables, validate location/os/PCI/SOCI/servername uniqueness, return combined view rows on read. Plus `locationsController.js` and `osController.js` with full CRUD. Plus `routes.js` snippet wiring `/api/locations`, `/api/os`, and updated `/api/servers`.

## Technical details

```text
            locationsMaster                osMaster
                  │                            │
        (validated in app + trigger)  (validated in app + trigger)
                  ▼                            ▼
         server_general_details ─── servername ─── server_summary
                              \         │         /
                               ▼        ▼        ▼
                              VIEW servers (LEFT JOIN on servername)
```

- View `servers` is read-only; writes target the underlying tables via store.
- Backward compatibility: the React app continues to `select * from servers`; only writes change.
- Existing data preserved via copy-then-drop pattern; backup table kept for one release.

## Out of scope
- Auth / roles for master pages (everyone can edit, matching current RLS).
- History/audit tables.
- Realtime subscriptions on the new view.

Approve and I'll run the Supabase migration, write the React master pages + store/UI changes, and drop the MSSQL + Node files into `/mnt/documents/`.