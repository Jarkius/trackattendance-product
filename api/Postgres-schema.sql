-- one-time setup

-- ============================================
-- Multi-tenant foundation (Sprint 1 Week 1)
-- ============================================

-- System default tenant for master-key / legacy data
-- All tenant_id columns are NOT NULL; master-key operations use this sentinel.
INSERT INTO tenants (id, name, contact_email)
VALUES ('00000000-0000-0000-0000-000000000000', 'System Default', NULL)
ON CONFLICT (id) DO NOTHING;

-- Tenants: each agency/client is a tenant
create table if not exists tenants (
  id            uuid        primary key default gen_random_uuid(),
  name          varchar(255) not null,
  contact_email varchar(255),
  created_at    timestamptz not null default now()
);

-- Licenses: API keys scoped to a tenant + event
create table if not exists licenses (
  id            uuid        primary key default gen_random_uuid(),
  tenant_id     uuid        not null references tenants(id) on delete restrict,
  license_key   varchar(64) unique not null,   -- Bearer token for kiosk auth
  event_name    varchar(255) not null,
  max_stations  integer     not null default 3,
  status        varchar(50) not null default 'active',  -- active, expired, revoked
  valid_from    timestamptz not null,
  valid_until   timestamptz not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_licenses_tenant    on licenses (tenant_id);
create index if not exists idx_licenses_key       on licenses (license_key);

-- ============================================
-- Core tables
-- ============================================

create table if not exists scans (
  id                bigserial primary key,
  idempotency_key   text        not null unique,     -- client-computed hash
  station_name      text        not null,            -- scanning station location
  badge_id          text        not null,            -- employee badge ID
  scanned_at        timestamptz not null,            -- UTC timestamp
  meta              jsonb,                           -- additional context (NO PII)
  business_unit     text,                            -- organizational unit (e.g. "Engineering")
  scan_source       text        not null default 'manual',  -- 'badge' or 'manual'
  tenant_id         uuid        not null default '00000000-0000-0000-0000-000000000000' references tenants(id),
  created_at        timestamptz not null default now()
);

-- indexes for performance
create index if not exists idx_scans_badge_id             on scans (badge_id);
create index if not exists idx_scans_station_name         on scans (station_name);
create index if not exists idx_scans_scanned_at           on scans (scanned_at desc);
create index if not exists idx_scans_business_unit        on scans (business_unit);
create index if not exists idx_scans_badge_station_time   on scans (badge_id, station_name, scanned_at desc);
create index if not exists idx_scans_station_scanned_at   on scans (station_name, scanned_at desc);
create index if not exists idx_scans_tenant               on scans (tenant_id);

-- roster summary: registered headcount per business unit per tenant (full-replace on each upload)
create table if not exists roster_summary (
  tenant_id     uuid        not null default '00000000-0000-0000-0000-000000000000' references tenants(id),
  business_unit text        not null,
  registered    integer     not null,
  updated_at    timestamptz not null default now(),
  primary key (tenant_id, business_unit)
);

-- roster metadata (hash, clear_epoch, etc.) scoped per tenant
create table if not exists roster_meta (
  tenant_id uuid not null default '00000000-0000-0000-0000-000000000000' references tenants(id),
  key       text not null,
  value     text not null,
  primary key (tenant_id, key)
);

-- station heartbeat: tracks station liveness and clear status per tenant
create table if not exists station_heartbeat (
  tenant_id         uuid        not null default '00000000-0000-0000-0000-000000000000' references tenants(id),
  station_name      text        not null,
  last_clear_epoch  text,
  local_scan_count  integer     not null default 0,
  last_seen_at      timestamptz not null default now(),
  primary key (tenant_id, station_name)
);

-- ============================================
-- Row-Level Security (tenant isolation)
-- ============================================
-- RLS enabled but NOT forced on table owner.
-- Owner (used by master API_KEY) bypasses RLS.
-- Future: create an 'app_tenant' role with restricted access.

alter table scans enable row level security;
alter table roster_summary enable row level security;
alter table roster_meta enable row level security;
alter table station_heartbeat enable row level security;

-- Isolation policies using session variable set per-request
-- WITH CHECK ensures INSERTs are also constrained to the current tenant
create policy tenant_isolation_scans on scans
  for all
  using (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid);

create policy tenant_isolation_roster_summary on roster_summary
  for all
  using (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid);

create policy tenant_isolation_roster_meta on roster_meta
  for all
  using (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid);

create policy tenant_isolation_station_heartbeat on station_heartbeat
  for all
  using (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid);
