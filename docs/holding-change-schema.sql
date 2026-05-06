create table investors (
  id text primary key,
  display_name text not null,
  aliases jsonb not null default '[]'::jsonb,
  investor_type text not null default 'person',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table vehicles (
  id text primary key,
  investor_id text not null references investors(id),
  name text not null,
  kind text not null,
  cik text,
  source_region text,
  disclosure_frequency text not null,
  primary_source_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table source_adapters (
  id text primary key,
  vehicle_id text references vehicles(id),
  adapter_kind text not null,
  source_tier text not null,
  url text not null,
  parser_version text not null,
  schedule_key text not null,
  is_primary boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table securities (
  id text primary key,
  ticker text,
  name text not null,
  cusip text,
  isin text,
  exchange text,
  currency text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index securities_cusip_unique
  on securities(cusip)
  where cusip is not null;

create table raw_source_observations (
  id uuid primary key default gen_random_uuid(),
  adapter_id text not null references source_adapters(id),
  vehicle_id text references vehicles(id),
  observed_at timestamptz not null default now(),
  as_of_date date,
  disclosed_at timestamptz,
  source_url text not null,
  content_hash text not null,
  raw_storage_uri text,
  parser_version text not null,
  parse_status text not null default 'pending',
  parse_error text,
  metadata jsonb not null default '{}'::jsonb
);

create unique index raw_source_observations_adapter_hash_unique
  on raw_source_observations(adapter_id, content_hash);

create table position_snapshots (
  id uuid primary key default gen_random_uuid(),
  vehicle_id text not null references vehicles(id),
  security_id text not null references securities(id),
  as_of_date date not null,
  disclosed_at timestamptz,
  shares numeric,
  market_value numeric,
  weight_pct numeric,
  source_observation_id uuid not null references raw_source_observations(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index position_snapshots_vehicle_security_date_unique
  on position_snapshots(vehicle_id, security_id, as_of_date, source_observation_id);

create table holding_change_events (
  id uuid primary key default gen_random_uuid(),
  investor_id text not null references investors(id),
  vehicle_id text not null references vehicles(id),
  security_id text not null references securities(id),
  event_type text not null,
  direction text not null,
  as_of_date date not null,
  previous_as_of_date date,
  disclosed_at timestamptz,
  shares_before numeric,
  shares_after numeric,
  shares_delta numeric,
  market_value_before numeric,
  market_value_after numeric,
  market_value_delta numeric,
  weight_pct_before numeric,
  weight_pct_after numeric,
  weight_pct_delta numeric,
  position_change_pct numeric,
  source_tier text not null,
  confidence text not null,
  significance_score numeric not null default 0,
  evidence_url text not null,
  source_observation_id uuid not null references raw_source_observations(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index holding_change_events_idempotency_unique
  on holding_change_events(vehicle_id, security_id, as_of_date, previous_as_of_date, event_type, source_observation_id);
