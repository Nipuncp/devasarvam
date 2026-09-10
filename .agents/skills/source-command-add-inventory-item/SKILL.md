---
name: "source-command-add-inventory-item"
description: "Add a new inventory item (consumable used in poojas)"
---

# source-command-add-inventory-item

Use this skill when the user asks to run the migrated source command `add-inventory-item`.

## Command Template

You are adding a row to `src/seed/inventory_items.json`.

Required fields:
- `id` — next free `iN`
- `name`, `malayalam`
- `unit` — one of `kg`, `nos`, `sticks`, `l`
- `qty` — current stock (number, in base unit)
- `opening` — same as qty for new items
- `totalReceived: 0`, `totalIssued: 0`
- `reorder` — reorder threshold
- `unitCost` — rupees per base unit
- `type` — `consumable` (default)

If this item is referenced in a vazhipadu recipe, the `name` here must match exactly the first element of the recipe's `items` pair. Cross-check `src/seed/vazhipadu_catalog.json`.

After editing, run `npm run dev` and verify the item shows up in the Inventory tab.
