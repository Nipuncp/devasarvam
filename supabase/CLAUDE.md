# supabase/

Database, auth, and Realtime backend for Devasarvam. Managed via the [Supabase CLI](https://supabase.com/docs/reference/cli).

## Layout

- `config.toml` — local-dev settings (ports, auth flags). Phase 2 will flip on auth invitation flows.
- `migrations/` — versioned SQL migrations. Append new files; never edit a migration that's been applied to the live project.
  - `0001_init.sql` — full Phase 1 schema. Bills, requisitions, purchase orders, GRNs, inventory movements, daily log, uthsavam, app_meta, user_profiles. RLS is **disabled** here; Phase 2 adds a separate migration that enables it with policies.
- `seed.sql` — auto-generated from `src/seed/*.json` via `tools/generate-seed.mjs`. **Do not hand-edit.** Edit the JSONs and re-run the generator.

## Schema invariants worth knowing

- **Catalog `id`s are text, not UUIDs** (`v1`, `i3`, `r12`, etc.). They come from the prototype and are referenced from everywhere; keep them stable.
- **`bills.id` is client-generated**, not server-generated. This is so offline-mode Phase 4 can submit a bill that's already been printed without risking a duplicate on retry.
- **`bill_items.item_id` is a soft FK** (text, no FK constraint) — preserves bill history if a catalog item is later deleted.
- **`inventory_movements` is append-only** and is the planned source of truth for `inventory_items.qty` in Phase 4. Today `qty` is a stored column; Phase 4 will replace it with a view summing movements.
- **`app_meta` is the JSONB blob table** for non-tabular state (`openLog`, `poojaLog`, last-backup-timestamp). Mirrors the prototype's localStorage shape.

## Local dev

```
# one-time
supabase init        # if needed (config.toml already exists)
supabase start       # spins up Postgres + Studio + Auth on local ports

# rebuild from scratch using migrations + seed
supabase db reset

# create a new migration after schema changes
supabase migration new <description>
# edit the new file, then:
supabase db reset
```

## Live project (Phase 5)

Production is the hosted Supabase project. Apply migrations with:

```
supabase db push
```

The `service-role` key is never committed; it lives in Vercel env vars.

## Common tasks

- **Add a new master-data row** — edit the relevant JSON in `src/seed/`, run `node tools/generate-seed.mjs`, commit both. Live data is updated by the admin import UI (Phase 1.5), not by re-running seed against prod.
- **Add a new column** — `supabase migration new add_foo_to_bar`, write `alter table` in the new migration, regenerate types: `supabase gen types typescript --local > src/lib/db-types.ts`.
- **Reset local data** — `supabase db reset` (destroys local data; never run against prod).
