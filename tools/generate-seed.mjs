#!/usr/bin/env node
// Regenerate supabase/seed.sql from src/seed/*.json.
//
// Why: JSON in src/seed/ is the single source of truth for catalog data.
// The Phase 1.5 admin import UI does upserts at runtime; this script handles
// the from-scratch `supabase db reset` path for local dev and CI.
//
// Run: `node tools/generate-seed.mjs` (no args) — overwrites supabase/seed.sql.

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const SEED_DIR = path.join(ROOT, "src", "seed");
const OUT = path.join(ROOT, "supabase", "seed.sql");

const read = (f) => JSON.parse(fs.readFileSync(path.join(SEED_DIR, f), "utf8"));

// SQL literal helpers
const sqlStr = (s) => {
  if (s === null || s === undefined) return "null";
  return `'${String(s).replace(/'/g, "''")}'`;
};
const sqlNum = (n) => (n === null || n === undefined ? "null" : String(n));
const sqlJson = (v) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;

const sections = [];

// ---- areas ----
const areas = read("areas.json");
sections.push(`-- areas
insert into areas (name) values
  ${areas.map((a) => `(${sqlStr(a)})`).join(",\n  ")}
on conflict (name) do nothing;
`);

// ---- verifiers (preserve hierarchical order via sort_order) ----
const verifiers = read("verifiers.json");
sections.push(`-- verifiers
insert into verifiers (role, malayalam, sort_order) values
  ${verifiers
    .map((v, i) => `(${sqlStr(v.role)}, ${sqlStr(v.malayalam)}, ${i})`)
    .join(",\n  ")}
on conflict (role) do update set
  malayalam = excluded.malayalam,
  sort_order = excluded.sort_order;
`);

// ---- nakshatrams ----
const nakshatrams = read("nakshatrams.json");
sections.push(`-- nakshatrams
insert into nakshatrams (name, malayalam, sort_order) values
  ${nakshatrams
    .map((n, i) => `(${sqlStr(n.name)}, ${sqlStr(n.malayalam)}, ${i})`)
    .join(",\n  ")}
on conflict (name) do update set
  malayalam = excluded.malayalam,
  sort_order = excluded.sort_order;
`);

// ---- pooja_schedule ----
const poojaSchedule = read("pooja_schedule.json");
sections.push(`-- pooja_schedule
insert into pooja_schedule (time, name, malayalam) values
  ${poojaSchedule
    .map((p) => `(${sqlStr(p.time)}, ${sqlStr(p.name)}, ${sqlStr(p.malayalam)})`)
    .join(",\n  ")}
on conflict (time) do update set
  name = excluded.name,
  malayalam = excluded.malayalam;
`);

// ---- vazhipadu_catalog ----
const vazhipadu = read("vazhipadu_catalog.json");
sections.push(`-- vazhipadu_catalog
insert into vazhipadu_catalog (id, name, malayalam, price, area, items) values
${vazhipadu
  .map(
    (v) =>
      `  (${sqlStr(v.id)}, ${sqlStr(v.name)}, ${sqlStr(v.malayalam)}, ${sqlNum(v.price)}, ${sqlStr(v.area)}, ${sqlJson(v.items)})`,
  )
  .join(",\n")}
on conflict (id) do update set
  name = excluded.name, malayalam = excluded.malayalam,
  price = excluded.price, area = excluded.area, items = excluded.items;
`);

// ---- inventory_items ----
const inventory = read("inventory_items.json");
sections.push(`-- inventory_items
insert into inventory_items
  (id, name, malayalam, unit, qty, opening, total_received, total_issued, reorder, unit_cost, type)
values
${inventory
  .map(
    (i) =>
      `  (${sqlStr(i.id)}, ${sqlStr(i.name)}, ${sqlStr(i.malayalam)}, ${sqlStr(i.unit)}, ${sqlNum(i.qty)}, ${sqlNum(i.opening)}, ${sqlNum(i.totalReceived)}, ${sqlNum(i.totalIssued)}, ${sqlNum(i.reorder)}, ${sqlNum(i.unitCost)}, ${sqlStr(i.type)})`,
  )
  .join(",\n")}
on conflict (id) do update set
  name = excluded.name, malayalam = excluded.malayalam, unit = excluded.unit,
  qty = excluded.qty, opening = excluded.opening,
  total_received = excluded.total_received, total_issued = excluded.total_issued,
  reorder = excluded.reorder, unit_cost = excluded.unit_cost, type = excluded.type;
`);

// ---- capital_items ----
const capital = read("capital_items.json");
sections.push(`-- capital_items
insert into capital_items
  (id, name, malayalam, custodian, last_verified, condition, material,
   weight_grams, acquired_year, book_value, current_value)
values
${capital
  .map(
    (c) =>
      `  (${sqlStr(c.id)}, ${sqlStr(c.name)}, ${sqlStr(c.malayalam)}, ${sqlStr(c.custodian)}, ${sqlStr(c.lastVerified)}, ${sqlStr(c.condition)}, ${sqlStr(c.material)}, ${sqlNum(c.weightGrams)}, ${sqlNum(c.acquiredYear)}, ${sqlNum(c.bookValue)}, ${sqlNum(c.currentValue)})`,
  )
  .join(",\n")}
on conflict (id) do update set
  name = excluded.name, malayalam = excluded.malayalam, custodian = excluded.custodian,
  last_verified = excluded.last_verified, condition = excluded.condition,
  material = excluded.material, weight_grams = excluded.weight_grams,
  acquired_year = excluded.acquired_year, book_value = excluded.book_value,
  current_value = excluded.current_value;
`);

// ---- retail_items ----
const retail = read("retail_items.json");
sections.push(`-- retail_items
insert into retail_items
  (id, name, malayalam, brand, category, pack_size, barcode, mrp, cost_price,
   counter_qty, counter_reorder, hsn)
values
${retail
  .map(
    (r) =>
      `  (${sqlStr(r.id)}, ${sqlStr(r.name)}, ${sqlStr(r.malayalam)}, ${sqlStr(r.brand)}, ${sqlStr(r.category)}, ${sqlStr(r.packSize)}, ${sqlStr(r.barcode)}, ${sqlNum(r.mrp)}, ${sqlNum(r.costPrice)}, ${sqlNum(r.counterQty)}, ${sqlNum(r.counterReorder)}, ${sqlStr(r.hsn)})`,
  )
  .join(",\n")}
on conflict (id) do update set
  name = excluded.name, malayalam = excluded.malayalam, brand = excluded.brand,
  category = excluded.category, pack_size = excluded.pack_size,
  barcode = excluded.barcode, mrp = excluded.mrp, cost_price = excluded.cost_price,
  counter_qty = excluded.counter_qty, counter_reorder = excluded.counter_reorder,
  hsn = excluded.hsn;
`);

// ---- inventory_movements (opening balances, so qty derivation lines up in Phase 4) ----
sections.push(`-- inventory_movements: synthetic 'opening' rows so a future qty-as-view works.
insert into inventory_movements (item_id, delta, reason, source_type, notes)
select id, opening, 'opening', 'manual', 'Seeded opening balance'
from inventory_items
on conflict do nothing;
`);

const header = `-- AUTO-GENERATED by tools/generate-seed.mjs from src/seed/*.json
-- Do not edit by hand. To change master data:
--   1. edit the corresponding src/seed/*.json
--   2. run \`node tools/generate-seed.mjs\`
--   3. commit both the JSON and this regenerated file.
--
-- Applied after migrations on \`supabase db reset\`.

set search_path = public;

`;

fs.writeFileSync(OUT, header + sections.join("\n"));
console.log(`Wrote ${path.relative(ROOT, OUT)} (${sections.length} sections)`);
