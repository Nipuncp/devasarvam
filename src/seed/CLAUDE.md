# src/seed/

Master data for the temple, currently the runtime source of truth. One JSON file per importable table:

- `vazhipadu_catalog.json` — pooja/offering catalog with prices, areas, and per-pooja consumable recipes (the `items` field is `[[itemName, qtyInBaseUnit], ...]`)
- `inventory_items.json` — store inventory: name, unit, qty, opening, reorder level, unit cost, type
- `capital_items.json` — non-consumable assets (jewelry, lamps, deity carriers) with custodian + valuation
- `retail_items.json` — counter-sale items: barcode, brand, MRP, cost, counter qty/reorder
- `pooja_schedule.json` — daily pooja times in 24h `HH:MM`
- `areas.json` — temple operational areas (used as requester/destination labels)
- `verifiers.json` — authorized roles for capital-item verification, ordered by hierarchy
- `nakshatrams.json` — 27 nakshatrams in traditional order

`index.js` re-exports them under the original const names from the prototype (`VAZHIPADU_CATALOG`, `INITIAL_INVENTORY`, etc.) so the rest of the app keeps working unchanged.

## Editing rules

- **Add a row:** append to the right JSON file, keep the `id` unique (next free `v8`, `i12`, `r13`, etc.).
- **Edit prices/quantities:** change in place, no other file touch needed.
- **Don't add new top-level fields without coordinating** — every field here is referenced by name in `src/App.jsx`. A new field only takes effect when consumer code is updated.
- **Malayalam strings**: paste from a trusted source; do not transliterate by hand.

## Phase 1 (planned)

These JSONs become the source for `supabase/seed.sql`. After that, the app reads from Supabase via `src/data/` hooks and these files become the seed/template the migration loads from. The natural keys used in DB upsert are:
- `vazhipadu_catalog.id`
- `inventory_items.name`
- `capital_items.id`
- `retail_items.barcode` (fallback to `id` if blank)
- `pooja_schedule.time`
- `areas` (the string itself)
- `verifiers.role`
- `nakshatrams.name`
