-- one-time setup

-- ============================================
-- Multi-tenant foundation (Sprint 1 Week 1)
-- ============================================

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
  tenant_id         uuid        references tenants(id),     -- multi-tenant isolation
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

-- roster summary: registered headcount per business unit (full-replace on each upload)
create table if not exists roster_summary (
  business_unit text        primary key,
  registered    integer     not null,
  tenant_id     uuid        references tenants(id),
  updated_at    timestamptz not null default now()
);

-- roster metadata (hash, clear_epoch, etc.)
create table if not exists roster_meta (
  key       text primary key,
  value     text not null,
  tenant_id uuid references tenants(id)
);

-- station heartbeat: tracks station liveness and clear status
create table if not exists station_heartbeat (
  station_name      text        primary key,
  last_clear_epoch  text,
  local_scan_count  integer     not null default 0,
  tenant_id         uuid        references tenants(id),
  last_seen_at      timestamptz not null default now()
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
create policy tenant_isolation_scans on scans
  for all using (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid);

create policy tenant_isolation_roster_summary on roster_summary
  for all using (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid);

create policy tenant_isolation_roster_meta on roster_meta
  for all using (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid);

create policy tenant_isolation_station_heartbeat on station_heartbeat
  for all using (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid);
