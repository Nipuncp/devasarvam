---
name: "source-command-add-vazhipadu"
description: "Add a new vazhipadu (pooja/offering) to the catalog"
---

# source-command-add-vazhipadu

Use this skill when the user asks to run the migrated source command `add-vazhipadu`.

## Command Template

You are adding a new vazhipadu to `src/seed/vazhipadu_catalog.json`.

Steps:
1. Read `src/seed/vazhipadu_catalog.json` to see the existing rows and pick the next free `id` (`v8`, `v9`, ...).
2. Ask the user for the missing fields if not given:
   - **name** (English), **malayalam** (Malayalam script — paste literal, do not transliterate)
   - **price** (integer rupees)
   - **area** — must match one of the strings in `src/seed/areas.json`. If they need a new area, edit that file first.
   - **items** — list of `[ingredientName, quantityInBaseUnit]` pairs. Ingredient names must match `name` in `src/seed/inventory_items.json`; the unit is whatever that inventory row's `unit` is (kg, nos, sticks, l). For weights, use kg (e.g. `0.05` for 50g).
3. Append the new object as the last entry. Match formatting and field order of existing rows.
4. After Phase 1: also run the migration to upsert into Supabase. For now, just edit the JSON.
5. Verify by running `npm run dev` and confirming the new vazhipadu appears in the Counter / Vazhipadu tab.

Do not invent Malayalam translations. If the user only gave English, ask them for the Malayalam.
