-- Phase 3: opt every table into the supabase_realtime publication so the
-- frontend's `postgres_changes` subscriptions actually fire.
--
-- Without this, INSERT/UPDATE/DELETE happen successfully in the DB but the
-- subscribed clients never get notified — which is what we hit when adding
-- a new uthsavam event required a manual refresh.

alter publication supabase_realtime add table
  areas,
  verifiers,
  nakshatrams,
  pooja_schedule,
  vazhipadu_catalog,
  inventory_items,
  capital_items,
  retail_items,
  vendors,
  user_profiles,
  bills,
  bill_items,
  requisitions,
  requisition_items,
  purchase_indents,
  purchase_indent_items,
  quotations,
  quotation_items,
  purchase_orders,
  purchase_order_items,
  grns,
  grn_items,
  vendor_bills,
  inventory_movements,
  daily_log_entries,
  uthsavam_events,
  app_meta;
