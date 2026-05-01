-- Phase 3: extend uthsavam_events with the prototype's fundraising fields
-- (budget / raised / status). The prototype tracked these inline in localStorage;
-- they belong on the row.

set search_path = public;

alter table uthsavam_events
  add column if not exists budget numeric(14,2),
  add column if not exists raised numeric(14,2) not null default 0,
  add column if not exists status text not null default 'Active'
    check (status in ('Active', 'Completed', 'Cancelled'));
