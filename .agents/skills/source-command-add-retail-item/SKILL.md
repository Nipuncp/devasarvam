---
name: "source-command-add-retail-item"
description: "Add a new retail item sold at the counter"
---

# source-command-add-retail-item

Use this skill when the user asks to run the migrated source command `add-retail-item`.

## Command Template

You are adding a row to `src/seed/retail_items.json`.

Required fields:
- `id` — next free `rN`
- `name`, `malayalam`, `brand` (use `"—"` for no brand)
- `category` — `Pooja Items`, `Charadu`, `Souvenirs`, or a new category if needed
- `packSize` — human label like `"50 g"`, `"1 nos"`, `"108 beads"`
- `barcode` — full EAN-13 if available, else `""`
- `mrp` — sale price in rupees
- `costPrice` — what the temple paid
- `counterQty` — current stock at the counter
- `counterReorder` — refill threshold
- `hsn` — GST HSN code if known, else `""`

After editing, run `npm run dev` and verify the item appears in the Retail Counter tab.
