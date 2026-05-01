// Seed data — currently the source of truth at runtime.
// In Phase 1 these JSON files become Supabase migrations / `supabase/seed.sql`,
// and the modules will load from Supabase via `src/data/` hooks instead.
// Until then, importing from here gives every module a single, namespaced source.

import vazhipaduCatalog from "./vazhipadu_catalog.json";
import inventoryItems from "./inventory_items.json";
import capitalItems from "./capital_items.json";
import retailItems from "./retail_items.json";
import poojaSchedule from "./pooja_schedule.json";
import areas from "./areas.json";
import verifiers from "./verifiers.json";
import nakshatrams from "./nakshatrams.json";

// Original const names from App.jsx — re-exported so legacy code keeps working
// during the Phase 0 split. Once `src/data/` exists in Phase 3, switch consumers
// to the hooks and these aliases can go.
export const VAZHIPADU_CATALOG = vazhipaduCatalog;
export const INITIAL_INVENTORY = inventoryItems;
export const CAPITAL_ITEMS = capitalItems;
export const INITIAL_RETAIL_ITEMS = retailItems;
export const POOJA_SCHEDULE = poojaSchedule;
export const AREAS = areas;
export const VERIFIERS = verifiers;
export const NAKSHATRAMS = nakshatrams;
