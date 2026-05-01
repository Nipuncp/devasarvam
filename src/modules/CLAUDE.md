# src/modules/

One file per top-level tab in the temple management UI.

## Wiring status

Each module is in one of two states:

**Fully Supabase-backed** — reads/writes via `src/data/use*` hooks; renders no props from a parent.

- `Uthsavam.jsx` — fundraising tracker
- `DailyRoutine.jsx` — open/close/pooja log + housekeeping
- `Inventory.jsx` — stock register, valuation, capital items

**Extracted but still localStorage-backed via props** — the file is its own module (good for browser editing), but the data still flows from `TempleManagement`'s `useState` calls in `src/App.jsx`. Wiring to Supabase is per-module follow-up work.

- `Counter.jsx` — vazhipadu billing (with kiosk dispatch banner + retail add-on)
- `KioskMode.jsx` — devotee self-service
- `RetailCounter.jsx` — retail-only sales
- `Store.jsx` — requisitions
- `Purchase.jsx` — vendors, quotations, POs, GRNs, vendor bills
- `DataEntry.jsx` — `sql.js` export
- `PrintableBill.jsx` — pure rendering; no DB needed

The hooks each module needs already exist in `src/data/`. Wiring is mechanical (see root `CLAUDE.md` for the recipe). The blockers are minor schema gaps:

- **Counter, RetailCounter** want a `bills.payment_mode` column (not yet in schema). Add via a new migration before wiring.
- **RetailCounter**'s margin calculation needs cost-price snapshotting on `bill_items` for historical accuracy.
- **Counter, KioskMode** share the kiosk dispatch queue, which currently lives in localStorage — needs a `kiosk_orders` table before wiring.
- **DataEntry** should be downscoped to "export from Supabase" — drop sql.js entirely.

## Module template (Supabase-backed)

```jsx
import { useFooBar } from "../data/useFooBar.js";
import { useRole } from "../lib/auth.jsx";

export function FooBar() {
  const { rows, loading, error, addRow } = useFooBar();
  const role = useRole();
  const canEdit = role === "admin"; // adjust per module

  if (loading) return <div className="text-sm text-amber-700">Loading…</div>;
  if (error) return <div className="text-red-700">{error.message}</div>;

  // ... markup using rows ...
}
```

## Conventions

- Tailwind utility classes only — match the existing amber-toned theme (`bg-amber-50`, `text-amber-950`, `border-amber-900/20`, etc.).
- Cormorant Garamond for headings, Noto Sans Malayalam for Malayalam.
- Print receipts continue to use `@media print` CSS isolation (Phase 4.5 adds ESC/POS as a layer in front).
- For role-gated buttons, render the button conditionally (don't disable) — clearer for non-technical staff.
- DB column names are snake_case (`counter_qty`, `unit_cost`, `last_verified`). Don't alias — rename in the module to match.
