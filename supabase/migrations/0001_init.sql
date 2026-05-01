-- Devasarvam — initial schema (Phase 1)
--
-- Tables are modeled directly on the prototype's localStorage shape (per the
-- handoff README): every top-level state key becomes a table; non-tabular
-- entries (`openLog`, `poojaLog`) live in `app_meta` as JSONB.
--
-- Phase 4 will refactor `inventory_items.qty` to a view over
-- `inventory_movements` for clean offline merges. Until then `qty` is a stored
-- column and movements are append-only alongside.
--
-- Phase 2 introduces RLS; this migration only stubs `user_profiles` and leaves
-- RLS disabled. A later migration enables RLS + adds policies.

set search_path = public;

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Reference / catalog tables (admin-editable; small)
-- ---------------------------------------------------------------------------

create table areas (
  name text primary key
);

create table verifiers (
  role text primary key,
  malayalam text,
  sort_order int not null default 0
);

create table nakshatrams (
  name text primary key,
  malayalam text,
  sort_order int not null default 0
);

create table pooja_schedule (
  time text primary key check (time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  name text not null,
  malayalam text
);

create table vazhipadu_catalog (
  id text primary key,
  name text not null,
  malayalam text,
  price numeric(10,2) not null check (price >= 0),
  area text references areas(name) on update cascade,
  -- items: array of [ingredientName, qtyInBaseUnit] pairs.
  -- Ingredient names match `inventory_items.name`. Validated at app layer; not
  -- a FK so admin imports don't have to be ordered.
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_vazhipadu_updated before update on vazhipadu_catalog
  for each row execute function set_updated_at();

create table inventory_items (
  id text primary key,
  name text not null unique,
  malayalam text,
  unit text not null,                    -- kg, nos, sticks, l
  qty numeric(12,3) not null default 0,  -- stored for Phase 1; becomes a view in Phase 4
  opening numeric(12,3) not null default 0,
  total_received numeric(12,3) not null default 0,
  total_issued numeric(12,3) not null default 0,
  reorder numeric(12,3) not null default 0,
  unit_cost numeric(12,4) not null default 0,
  type text not null default 'consumable',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_inventory_updated before update on inventory_items
  for each row execute function set_updated_at();

create table capital_items (
  id text primary key,
  name text not null,
  malayalam text,
  custodian text,
  last_verified date,
  condition text,
  material text,
  weight_grams numeric(12,2),
  acquired_year int,
  book_value numeric(14,2),
  current_value numeric(14,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_capital_updated before update on capital_items
  for each row execute function set_updated_at();

create table retail_items (
  id text primary key,
  name text not null,
  malayalam text,
  brand text,
  category text,
  pack_size text,
  barcode text,
  mrp numeric(10,2) not null check (mrp >= 0),
  cost_price numeric(10,2) not null default 0,
  counter_qty numeric(12,3) not null default 0,
  counter_reorder numeric(12,3) not null default 0,
  hsn text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Barcode unique only when present (empty string allowed for unbranded items)
create unique index retail_items_barcode_unique on retail_items (barcode)
  where barcode is not null and barcode <> '';
create trigger trg_retail_updated before update on retail_items
  for each row execute function set_updated_at();

create table vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  phone text,
  address text,
  gstin text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_vendors_updated before update on vendors
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- User profiles (stub for Phase 2 RLS; real role checks added later)
-- ---------------------------------------------------------------------------
create type user_role as enum ('admin', 'melsanthi', 'cashier', 'store_keeper', 'viewer');

create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role user_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_user_profiles_updated before update on user_profiles
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Billing — Vazhipadu Counter, Retail Counter, Kiosk
-- Bills are append-only from a sync perspective. Each row carries a
-- client-generated UUID (`id`) so offline retries are idempotent.
-- ---------------------------------------------------------------------------
create type bill_type as enum ('vazhipadu', 'retail', 'kiosk');

create table bills (
  id uuid primary key,                     -- client-generated for offline idempotency
  bill_no text unique,                     -- human-readable, assigned server-side on first commit
  bill_type bill_type not null,
  devotee_name text,
  devotee_phone text,
  devotee_nakshatram text references nakshatrams(name) on update cascade,
  total_amount numeric(12,2) not null,
  paid boolean not null default true,
  cashier_id uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default now()
);
create index bills_created_at on bills (created_at desc);
create index bills_cashier_id on bills (cashier_id);

create table bill_items (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills(id) on delete cascade,
  line_no int not null,
  item_kind text not null check (item_kind in ('vazhipadu', 'retail')),
  -- soft FK: item_id matches vazhipadu_catalog.id or retail_items.id at write
  -- time, but the row is preserved if the catalog item is later deleted.
  item_id text not null,
  item_name text not null,                 -- denormalized for receipt history
  qty numeric(12,3) not null,
  unit_price numeric(10,2) not null,
  line_total numeric(12,2) not null,
  -- Per-line vazhipadu metadata
  devotee_name text,
  nakshatram text,
  created_at timestamptz not null default now(),
  unique (bill_id, line_no)
);
create index bill_items_bill on bill_items (bill_id);

-- ---------------------------------------------------------------------------
-- Store / Requisition — area requests stock from the central store
-- ---------------------------------------------------------------------------
create type req_status as enum ('pending', 'issued', 'rejected', 'returned', 'partially_returned');

create table requisitions (
  id uuid primary key default gen_random_uuid(),
  req_no text unique,
  requester_area text references areas(name) on update cascade,
  reason text,                             -- pooja name or freeform
  status req_status not null default 'pending',
  required_by timestamptz,
  raised_at timestamptz not null default now(),
  raised_by uuid references auth.users(id),
  issued_at timestamptz,
  issued_by uuid references auth.users(id),
  rejected_at timestamptz,
  rejected_by uuid references auth.users(id),
  rejection_reason text,
  returned_at timestamptz,
  returned_by uuid references auth.users(id)
);
create index requisitions_status on requisitions (status);
create index requisitions_raised_at on requisitions (raised_at desc);

create table requisition_items (
  id uuid primary key default gen_random_uuid(),
  requisition_id uuid not null references requisitions(id) on delete cascade,
  item_id text not null references inventory_items(id) on update cascade,
  item_name text not null,
  qty_requested numeric(12,3) not null,
  qty_issued numeric(12,3) not null default 0,
  qty_returned numeric(12,3) not null default 0
);
create index requisition_items_req on requisition_items (requisition_id);

-- ---------------------------------------------------------------------------
-- Purchase — indents, vendor quotations, POs, GRNs, vendor bills
-- ---------------------------------------------------------------------------
create type indent_status as enum ('open', 'ordered', 'received', 'cancelled');

-- Lightweight purchase indent raised from Inventory module on low stock
create table purchase_indents (
  id uuid primary key default gen_random_uuid(),
  indent_no text unique,
  status indent_status not null default 'open',
  vendor_id uuid references vendors(id),
  ordered_po_no text,
  raised_at timestamptz not null default now(),
  raised_by uuid references auth.users(id),
  ordered_at timestamptz,
  received_at timestamptz,
  cancelled_at timestamptz,
  notes text
);
create index purchase_indents_status on purchase_indents (status);

create table purchase_indent_items (
  id uuid primary key default gen_random_uuid(),
  indent_id uuid not null references purchase_indents(id) on delete cascade,
  item_id text not null references inventory_items(id) on update cascade,
  item_name text not null,
  qty_requested numeric(12,3) not null,
  qty_received numeric(12,3) not null default 0,
  unit_cost numeric(12,4) not null default 0
);

-- Formal quotations + POs from the Purchase module
create table quotations (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id),
  valid_until date,
  status text not null default 'received',
  notes text,
  created_at timestamptz not null default now()
);

create table quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references quotations(id) on delete cascade,
  item_id text references inventory_items(id) on update cascade,
  item_name text not null,
  qty numeric(12,3) not null,
  unit_cost numeric(12,4) not null
);

create type po_status as enum ('draft', 'sent', 'partially_received', 'received', 'closed', 'cancelled');

create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_no text unique,
  vendor_id uuid not null references vendors(id),
  status po_status not null default 'draft',
  total numeric(14,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  closed_at timestamptz,
  created_by uuid references auth.users(id)
);

create table purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references purchase_orders(id) on delete cascade,
  item_id text references inventory_items(id) on update cascade,
  item_name text not null,
  qty numeric(12,3) not null,
  unit_cost numeric(12,4) not null,
  line_total numeric(14,2) not null
);

create table grns (
  id uuid primary key default gen_random_uuid(),
  grn_no text unique,
  po_id uuid references purchase_orders(id),
  received_at timestamptz not null default now(),
  received_by uuid references auth.users(id),
  notes text
);

create table grn_items (
  id uuid primary key default gen_random_uuid(),
  grn_id uuid not null references grns(id) on delete cascade,
  po_item_id uuid references purchase_order_items(id),
  item_id text references inventory_items(id) on update cascade,
  item_name text not null,
  qty_received numeric(12,3) not null,
  unit_cost numeric(12,4) not null
);

-- Vendor bills (invoices we owe vendors). Distinct from billing-module `bills`.
create table vendor_bills (
  id uuid primary key default gen_random_uuid(),
  bill_no text,
  vendor_id uuid not null references vendors(id),
  po_id uuid references purchase_orders(id),
  amount numeric(14,2) not null,
  due_date date,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Inventory movement ledger
-- Append-only. In Phase 4 `inventory_items.qty` becomes a view over this.
-- ---------------------------------------------------------------------------
create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  item_id text not null references inventory_items(id) on update cascade,
  delta numeric(12,3) not null,            -- positive: in; negative: out
  reason text not null,                    -- 'opening', 'purchase', 'requisition', 'adjustment'
  source_type text,                        -- 'requisition', 'purchase_indent', 'grn', 'manual'
  source_id uuid,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  notes text
);
create index inventory_movements_item on inventory_movements (item_id, created_at desc);
create index inventory_movements_source on inventory_movements (source_type, source_id);

-- ---------------------------------------------------------------------------
-- Daily log + Uthsavam
-- ---------------------------------------------------------------------------
create table daily_log_entries (
  id uuid primary key default gen_random_uuid(),
  log_date date not null,
  kind text not null check (kind in ('open', 'pooja', 'housekeeping', 'note')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
create index daily_log_date on daily_log_entries (log_date desc, kind);

create table uthsavam_events (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  name text not null,
  malayalam text,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
create index uthsavam_date on uthsavam_events (event_date);

-- ---------------------------------------------------------------------------
-- App-level meta blobs (mirrors the prototype's `openLog` / `poojaLog` etc.)
-- ---------------------------------------------------------------------------
create table app_meta (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
create trigger trg_app_meta_updated before update on app_meta
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- New-user trigger: auto-create a `user_profiles` row on signup (default role
-- `viewer`; admin promotes manually). Phase 2 fleshes this out.
-- ---------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into user_profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
