#!/usr/bin/env node
// One-time scaffolding script: extracts each prototype section from
// src/App.jsx into its own module file under src/modules/ or src/components/.
// Auto-detects imports needed by scanning for usage of known symbols.
//
// Run once: `node tools/extract-modules.mjs`
// Then verify with `npx vite build`.

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src", "App.jsx");

const LUCIDE_ICONS = [
  "Sun","Moon","Bell","Package","Receipt","Calendar","FileSpreadsheet",
  "Plus","Check","X","AlertTriangle","Download","Clock","Users","IndianRupee",
  "TrendingDown","Sparkles","Printer","Trash2","ClipboardList","ArrowRight",
  "RotateCcw","Inbox","ShoppingCart","Truck","Star","Phone","Building2",
  "FileText","Upload","Loader","Award","Scan","FileCheck",
];

const SEED_CONSTS = [
  "VAZHIPADU_CATALOG","INITIAL_INVENTORY","CAPITAL_ITEMS","INITIAL_RETAIL_ITEMS",
  "POOJA_SCHEDULE","AREAS","VERIFIERS","NAKSHATRAMS",
];

// Symbols defined in src/components/ui.jsx (after this script runs).
const UI_HELPERS = ["Card","Field","NakshatramField","NakshatramSelect","QtyInput","formatQty"];

// Symbols defined in modules and re-imported across modules.
const CROSS_MODULE = {
  BillSlip: "../modules/PrintableBill.jsx",
  numberToWords: "../modules/PrintableBill.jsx",
  RetailCounter: "../modules/RetailCounter.jsx",
  CounterStockView: "../modules/RetailCounter.jsx",
  CounterRefill: "../modules/RetailCounter.jsx",
  RetailReceipt: "../modules/RetailCounter.jsx",
  KioskMode: "../modules/KioskMode.jsx",
  DispatchQueueBanner: "../modules/KioskMode.jsx",
  KioskSlip: "../modules/KioskMode.jsx",
};

// Section definitions: name → { exports[], outFile }
// Line ranges discovered from grep — re-derive after every edit by running the
// grep once and filling these in. End line is exclusive.
const SECTIONS = [
  { name: "Counter",        exports: ["Counter"],
    out: "src/modules/Counter.jsx",
    rangeMarker: "// =================== COUNTER (BILLING) ===================",
    endMarker:   "// =================== KIOSK MODE (Devotee self-service) ===================" },
  { name: "KioskMode",      exports: ["KioskMode","DispatchQueueBanner","KioskSlip"],
    out: "src/modules/KioskMode.jsx",
    rangeMarker: "// =================== KIOSK MODE (Devotee self-service) ===================",
    endMarker:   "// =================== RETAIL COUNTER ===================" },
  { name: "RetailCounter",  exports: ["RetailCounter","CounterStockView","CounterRefill","RetailReceipt"],
    out: "src/modules/RetailCounter.jsx",
    rangeMarker: "// =================== RETAIL COUNTER ===================",
    endMarker:   "// =================== PRINTABLE BILL SLIP ===================" },
  { name: "PrintableBill",  exports: ["BillSlip","numberToWords"],
    out: "src/modules/PrintableBill.jsx",
    rangeMarker: "// =================== PRINTABLE BILL SLIP ===================",
    endMarker:   "// =================== STORE / REQUISITION ===================" },
  { name: "Store",          exports: ["Store"],
    out: "src/modules/Store.jsx",
    rangeMarker: "// =================== STORE / REQUISITION ===================",
    endMarker:   "// =================== PURCHASE MODULE ===================" },
  { name: "Purchase",       exports: ["Purchase"],
    out: "src/modules/Purchase.jsx",
    rangeMarker: "// =================== PURCHASE MODULE ===================",
    endMarker:   "// =================== DATA ENTRY (Excel templates) ===================" },
  { name: "DataEntry",      exports: ["DataEntry"],
    out: "src/modules/DataEntry.jsx",
    rangeMarker: "// =================== DATA ENTRY (Excel templates) ===================",
    endMarker:   "// =================== BACKUP REMINDER BANNER ===================" },
  { name: "BackupReminder", exports: ["BackupReminder"],
    out: "src/components/BackupReminder.jsx",
    rangeMarker: "// =================== BACKUP REMINDER BANNER ===================",
    endMarker:   "// =================== UI HELPERS ===================" },
  { name: "ui",             exports: UI_HELPERS,
    out: "src/components/ui.jsx",
    rangeMarker: "// =================== UI HELPERS ===================",
    endMarker:   null /* through end of file */ },
];

const src = fs.readFileSync(SRC, "utf8");
const lines = src.split("\n");

function findMarker(arr, marker) {
  const i = arr.findIndex((l) => l.trim() === marker);
  if (i < 0) throw new Error("marker not found: " + marker);
  return i;
}

function buildImports(sectionName, body) {
  const lines = [];

  // React hooks
  const hooks = ["useState","useEffect","useRef","useCallback","useMemo"]
    .filter((h) => new RegExp(`\\b${h}\\b`).test(body));
  if (hooks.length) lines.push(`import { ${hooks.join(", ")} } from "react";`);

  // lucide icons
  const icons = LUCIDE_ICONS.filter((i) => new RegExp(`\\b${i}\\b`).test(body));
  if (icons.length) lines.push(`import { ${icons.join(", ")} } from "lucide-react";`);

  // seed
  const seed = SEED_CONSTS.filter((s) => new RegExp(`\\b${s}\\b`).test(body));
  if (seed.length) lines.push(`import { ${seed.join(", ")} } from "../seed/index.js";`);

  // ui helpers (skip when extracting ui.jsx itself)
  if (sectionName !== "ui") {
    const ui = UI_HELPERS.filter((u) => new RegExp(`\\b${u}\\b`).test(body));
    if (ui.length) lines.push(`import { ${ui.join(", ")} } from "../components/ui.jsx";`);
  }

  // sql.js — DataEntry only
  if (sectionName === "DataEntry") {
    if (/initSqlJs/.test(body)) {
      lines.push(`import initSqlJs from "sql.js";`);
      lines.push(`import sqlWasmUrl from "sql.js/dist/sql-wasm.wasm?url";`);
    }
  }

  // cross-module symbols (skip self-references)
  const ownExports = SECTIONS.find((s) => s.name === sectionName)?.exports ?? [];
  const grouped = {};
  for (const [sym, file] of Object.entries(CROSS_MODULE)) {
    if (ownExports.includes(sym)) continue;
    if (new RegExp(`\\b${sym}\\b`).test(body)) {
      grouped[file] = grouped[file] ?? [];
      grouped[file].push(sym);
    }
  }
  for (const [file, syms] of Object.entries(grouped)) {
    lines.push(`import { ${syms.join(", ")} } from "${file}";`);
  }

  return lines.join("\n");
}

function applyExports(body, exportSet) {
  // Replace `function Foo(` → `export function Foo(` for each export.
  let out = body;
  for (const name of exportSet) {
    const re = new RegExp(`(^|\\n)function ${name}\\b`, "g");
    out = out.replace(re, `$1export function ${name}`);
  }
  return out;
}

// Process sections in order, but always recompute the start each iteration
// because the file shrinks each pass. End-of-section is the *next* section's
// start marker (which is still in mutLines until we get to it).
let mutLines = [...lines];

for (let i = 0; i < SECTIONS.length; i++) {
  const sec = SECTIONS[i];
  const start = findMarker(mutLines, sec.rangeMarker);
  const nextMarker = SECTIONS[i + 1]?.rangeMarker ?? null;
  const end = nextMarker
    ? mutLines.findIndex((l, j) => j > start && l.trim() === nextMarker)
    : mutLines.length;
  if (end < 0) throw new Error(`couldn't find end marker for ${sec.name}`);
  const body = mutLines.slice(start, end).join("\n");
  const withExports = applyExports(body, sec.exports);
  const imports = buildImports(sec.name, body);
  const file = `${imports}\n\n${withExports}\n`;
  fs.mkdirSync(path.dirname(path.join(ROOT, sec.out)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, sec.out), file);
  mutLines.splice(start, end - start);
}

fs.writeFileSync(SRC, mutLines.join("\n"));
console.log(`Extracted ${SECTIONS.length} sections; App.jsx now ${mutLines.length} lines.`);

