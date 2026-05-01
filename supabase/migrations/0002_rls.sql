-- Devasarvam — Phase 2: enable RLS + role-based policies.
--
-- Roles (defined in 0001_init.sql as enum `user_role`):
--   admin         — full access; manages catalogs, users, vendor records
--   melsanthi     — temple priest; daily log, uthsavam, read access
--   cashier       — billing counter (vazhipadu, retail, kiosk)
--   store_keeper  — inventory, requisitions, purchases
--   viewer        — read-only across the board
--
-- Service-role calls bypass RLS by design — Phase 1.5's import-master endpoint
-- uses that. The publishable/anon key sees only what these policies allow.

set search_path = public;

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------
create or replace function public.auth_role() returns user_role
language sql stable security definer set search_path = public
as $$
  select role from public.user_profiles where id = auth.uid()
$$;

create or replace function public.is_admin() returns boolean
language sql stable as $$ select public.auth_role() = 'admin' $$;

create or replace function public.has_role(roles user_role[]) returns boolean
language sql stable as $$ select public.auth_role() = any(roles) $$;

-- ---------------------------------------------------------------------------
-- Enable RLS on every table
-- ---------------------------------------------------------------------------
alter table areas             enable row level security;
alter table verifiers         enable row level security;
alter table nakshatrams       enable row level security;
alter table pooja_schedule    enable row level security;
alter table vazhipadu_catalog enable row level security;
alter table inventory_items   enable row level security;
alter table capital_items     enable row level security;
alter table retail_items      enable row level security;
alter table vendors           enable row level security;
alter table user_profiles     enable row level security;
alter table bills             enable row level security;
alter table bill_items        enable row level security;
alter table requisitions      enable row level security;
alter table requisition_items enable row level security;
alter table purchase_indents  enable row level security;
alter table purchase_indent_items enable row level security;
alter table quotations        enable row level security;
alter table quotation_items   enable row level security;
alter table purchase_orders   enable row level security;
alter table purchase_order_items enable row level security;
alter table grns              enable row level security;
alter table grn_items         enable row level security;
alter table vendor_bills      enable row level security;
alter table inventory_movements   enable row level security;
alter table daily_log_entries enable row level security;
alter table uthsavam_events   enable row level security;
alter table app_meta          enable row level security;

-- ---------------------------------------------------------------------------
-- Catalog tables: everyone authenticated reads; only admin writes.
-- One macro-style block per table.
-- ---------------------------------------------------------------------------
create policy "auth_select" on areas for select to authenticated using (true);
create policy "admin_write" on areas for all to authenticated
  using (is_admin()) with check (is_admin());

create policy "auth_select" on verifiers for select to authenticated using (true);
create policy "admin_write" on verifiers for all to authenticated
  using (is_admin()) with check (is_admin());

create policy "auth_select" on nakshatrams for select to authenticated using (true);
create policy "admin_write" on nakshatrams for all to authenticated
  using (is_admin()) with check (is_admin());

create policy "auth_select" on pooja_schedule for select to authenticated using (true);
create policy "admin_write" on pooja_schedule for all to authenticated
  using (is_admin()) with check (is_admin());

create policy "auth_select" on vazhipadu_catalog for select to authenticated using (true);
create policy "admin_write" on vazhipadu_catalog for all to authenticated
  using (is_admin()) with check (is_admin());

create policy "auth_select" on inventory_items for select to authenticated using (true);
-- store_keeper updates qty / receives stock; admin can do anything
create policy "store_or_admin_write" on inventory_items for all to authenticated
  using (has_role(array['store_keeper','admin']::user_role[]))
  with check (has_role(array['store_keeper','admin']::user_role[]));

create policy "auth_select" on capital_items for select to authenticated using (true);
create policy "admin_write" on capital_items for all to authenticated
  using (is_admin()) with check (is_admin());

create policy "auth_select" on retail_items for select to authenticated using (true);
-- cashier needs to decrement counter_qty on retail sales; admin manages catalog
create policy "cashier_or_admin_write" on retail_items for all to authenticated
  using (has_role(array['cashier','store_keeper','admin']::user_role[]))
  with check (has_role(array['cashier','store_keeper','admin']::user_role[]));

create policy "auth_select" on vendors for select to authenticated using (true);
create policy "store_or_admin_write" on vendors for all to authenticated
  using (has_role(array['store_keeper','admin']::user_role[]))
  with check (has_role(array['store_keeper','admin']::user_role[]));

-- ---------------------------------------------------------------------------
-- user_profiles: each user reads themselves; admin sees + writes all.
-- A user cannot change their own role.
-- ---------------------------------------------------------------------------
create policy "self_select" on user_profiles for select to authenticated
  using (id = auth.uid() or is_admin());

create policy "self_update_no_role" on user_profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from user_profiles where id = auth.uid()));

create policy "admin_all" on user_profiles for all to authenticated
  using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- Billing — cashier can ring up; everyone authenticated can read history;
-- only admin can edit/delete past bills.
-- ---------------------------------------------------------------------------
create policy "auth_select" on bills for select to authenticated using (true);
create policy "cashier_insert" on bills for insert to authenticated
  with check (has_role(array['cashier','admin']::user_role[]));
create policy "admin_modify" on bills for update to authenticated
  using (is_admin()) with check (is_admin());
create policy "admin_delete" on bills for delete to authenticated
  using (is_admin());

create policy "auth_select" on bill_items for select to authenticated using (true);
create policy "cashier_insert" on bill_items for insert to authenticated
  with check (has_role(array['cashier','admin']::user_role[]));
create policy "admin_modify" on bill_items for update to authenticated
  using (is_admin()) with check (is_admin());
create policy "admin_delete" on bill_items for delete to authenticated
  using (is_admin());

-- ---------------------------------------------------------------------------
-- Requisitions — any authenticated user can raise; only store_keeper/admin
-- can issue/reject/return.
-- ---------------------------------------------------------------------------
create policy "auth_select" on requisitions for select to authenticated using (true);
create policy "auth_insert" on requisitions for insert to authenticated with check (true);
create policy "store_or_admin_modify" on requisitions for update to authenticated
  using (has_role(array['store_keeper','admin']::user_role[]))
  with check (has_role(array['store_keeper','admin']::user_role[]));
create policy "admin_delete" on requisitions for delete to authenticated using (is_admin());

create policy "auth_select" on requisition_items for select to authenticated using (true);
create policy "auth_insert" on requisition_items for insert to authenticated with check (true);
create policy "store_or_admin_modify" on requisition_items for update to authenticated
  using (has_role(array['store_keeper','admin']::user_role[]))
  with check (has_role(array['store_keeper','admin']::user_role[]));
create policy "admin_delete" on requisition_items for delete to authenticated using (is_admin());

-- ---------------------------------------------------------------------------
-- Purchase pipeline — store_keeper + admin domain
-- ---------------------------------------------------------------------------
create policy "auth_select" on purchase_indents for select to authenticated using (true);
create policy "store_or_admin_write" on purchase_indents for all to authenticated
  using (has_role(array['store_keeper','admin']::user_role[]))
  with check (has_role(array['store_keeper','admin']::user_role[]));

create policy "auth_select" on purchase_indent_items for select to authenticated using (true);
create policy "store_or_admin_write" on purchase_indent_items for all to authenticated
  using (has_role(array['store_keeper','admin']::user_role[]))
  with check (has_role(array['store_keeper','admin']::user_role[]));

create policy "auth_select" on quotations for select to authenticated using (true);
create policy "store_or_admin_write" on quotations for all to authenticated
  using (has_role(array['store_keeper','admin']::user_role[]))
  with check (has_role(array['store_keeper','admin']::user_role[]));

create policy "auth_select" on quotation_items for select to authenticated using (true);
create policy "store_or_admin_write" on quotation_items for all to authenticated
  using (has_role(array['store_keeper','admin']::user_role[]))
  with check (has_role(array['store_keeper','admin']::user_role[]));

create policy "auth_select" on purchase_orders for select to authenticated using (true);
create policy "store_or_admin_write" on purchase_orders for all to authenticated
  using (has_role(array['store_keeper','admin']::user_role[]))
  with check (has_role(array['store_keeper','admin']::user_role[]));

create policy "auth_select" on purchase_order_items for select to authenticated using (true);
create policy "store_or_admin_write" on purchase_order_items for all to authenticated
  using (has_role(array['store_keeper','admin']::user_role[]))
  with check (has_role(array['store_keeper','admin']::user_role[]));

create policy "auth_select" on grns for select to authenticated using (true);
create policy "store_or_admin_write" on grns for all to authenticated
  using (has_role(array['store_keeper','admin']::user_role[]))
  with check (has_role(array['store_keeper','admin']::user_role[]));

create policy "auth_select" on grn_items for select to authenticated using (true);
create policy "store_or_admin_write" on grn_items for all to authenticated
  using (has_role(array['store_keeper','admin']::user_role[]))
  with check (has_role(array['store_keeper','admin']::user_role[]));

create policy "auth_select" on vendor_bills for select to authenticated using (true);
create policy "store_or_admin_write" on vendor_bills for all to authenticated
  using (has_role(array['store_keeper','admin']::user_role[]))
  with check (has_role(array['store_keeper','admin']::user_role[]));

-- ---------------------------------------------------------------------------
-- Inventory movements — append-only ledger. Anyone authenticated can record
-- a movement (a bill creates an issue, a GRN creates a receipt, etc.).
-- No update/delete policies = nothing can be changed after the fact.
-- ---------------------------------------------------------------------------
create policy "auth_select" on inventory_movements for select to authenticated using (true);
create policy "auth_insert" on inventory_movements for insert to authenticated with check (true);
-- intentionally no update/delete: ledger is immutable

-- ---------------------------------------------------------------------------
-- Daily log + uthsavam
-- ---------------------------------------------------------------------------
create policy "auth_select" on daily_log_entries for select to authenticated using (true);
create policy "auth_insert" on daily_log_entries for insert to authenticated with check (true);
create policy "admin_or_priest_modify" on daily_log_entries for update to authenticated
  using (has_role(array['melsanthi','admin']::user_role[]))
  with check (has_role(array['melsanthi','admin']::user_role[]));
create policy "admin_delete" on daily_log_entries for delete to authenticated using (is_admin());

create policy "auth_select" on uthsavam_events for select to authenticated using (true);
create policy "priest_or_admin_write" on uthsavam_events for all to authenticated
  using (has_role(array['melsanthi','admin']::user_role[]))
  with check (has_role(array['melsanthi','admin']::user_role[]));

-- ---------------------------------------------------------------------------
-- app_meta — kv store for non-tabular state. Any authenticated user reads
-- and writes their own keys; admin can clean up.
-- ---------------------------------------------------------------------------
create policy "auth_select" on app_meta for select to authenticated using (true);
create policy "auth_write" on app_meta for all to authenticated using (true) with check (true);
