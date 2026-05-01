import { useState, useRef } from "react";
import { FileSpreadsheet, Download, Upload } from "lucide-react";
import initSqlJs from "sql.js";
import sqlWasmUrl from "sql.js/dist/sql-wasm.wasm?url";

// =================== DATA ENTRY (Excel templates) ===================
export function DataEntry({ allState = {}, loadAllState = () => {}, lastBackupAt = null, setLastBackupAt = () => {} }) {
  // ===== SQLite Export / Import (Step 2) =====
  // Uses sql.js — a SQLite engine that runs in the browser. Loaded from CDN on first use.
  // Output is a real .db file that can be opened in DB Browser for SQLite.
  const [dbBusy, setDbBusy] = useState(false);
  const [dbMsg, setDbMsg] = useState(null);

  // sql.js is imported at the top of this file. The wasm file URL comes from Vite's
  // asset pipeline (sqlWasmUrl import). No internet needed at runtime.

  // Convert a JavaScript array of objects into an SQLite table.
  // Each object becomes a row; the keys become column names.
  // Values that are objects/arrays get JSON-stringified (SQLite doesn't have a native object type).
  // Returns silently for empty/missing data so the caller doesn't have to pre-check.
  const writeTable = (db, tableName, rows) => {
    // Guard: only proceed if it's an actual array with content
    if (!Array.isArray(rows)) return;
    if (rows.length === 0) return;

    // Collect all unique keys across all rows so the table has every column
    const allKeys = new Set();
    rows.forEach((r) => {
      if (r && typeof r === "object") {
        Object.keys(r).forEach((k) => allKeys.add(k));
      }
    });
    const cols = Array.from(allKeys);
    if (cols.length === 0) return;

    // Create the table — every column is TEXT for simplicity. We can refine types later.
    const colDefs = cols.map((c) => `"${c}" TEXT`).join(", ");
    db.run(`CREATE TABLE IF NOT EXISTS "${tableName}" (${colDefs});`);

    // Insert rows one at a time using a prepared statement (safer + faster than concatenating)
    const placeholders = cols.map(() => "?").join(", ");
    const stmt = db.prepare(`INSERT INTO "${tableName}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${placeholders});`);
    rows.forEach((r) => {
      const vals = cols.map((c) => {
        const v = r?.[c];
        if (v === null || v === undefined) return null;
        if (typeof v === "object") return JSON.stringify(v); // objects/arrays → JSON string
        return String(v);
      });
      stmt.run(vals);
    });
    stmt.free();
  };

  // Save a non-tabular state slice (a single object or dictionary) as a JSON blob in the meta table.
  // Used for things like openLog (one object) and poojaLog (dictionary keyed by pooja time).
  const saveAsMeta = (db, key, value) => {
    if (value === null || value === undefined) return;
    const stmt = db.prepare(`INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?);`);
    stmt.run([key, JSON.stringify(value)]);
    stmt.free();
  };

  const exportToSqlite = async () => {
    setDbBusy(true);
    setDbMsg({ kind: "info", text: "Preparing database file…" });
    try {
      // initSqlJs is imported at the top. locateFile tells it where to find the .wasm binary —
      // we point it at the Vite-managed URL so it loads from our local node_modules.
      const SQL = await initSqlJs({ locateFile: () => sqlWasmUrl });
      const db = new SQL.Database();

      // A small metadata table so we can verify version when importing later
      db.run(`CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT);`);
      const metaStmt = db.prepare(`INSERT INTO meta (key, value) VALUES (?, ?);`);
      metaStmt.run(["app", "Devasarvam"]);
      metaStmt.run(["exportedAt", new Date().toISOString()]);
      metaStmt.run(["schemaVersion", "1"]);
      metaStmt.free();

      // Write each top-level state slice as its own table
      writeTable(db, "inventory", allState.inventory);
      writeTable(db, "bookings", allState.bookings);
      writeTable(db, "issuances", allState.issuances);
      writeTable(db, "housekeeping", allState.housekeeping);
      writeTable(db, "events", allState.events);
      writeTable(db, "requisitions", allState.requisitions);
      writeTable(db, "purchaseIndents", allState.purchaseIndents);
      writeTable(db, "vendors", allState.vendors);
      writeTable(db, "quotations", allState.quotations);
      writeTable(db, "purchaseOrders", allState.purchaseOrders);
      writeTable(db, "grns", allState.grns);
      writeTable(db, "bills", allState.bills);
      writeTable(db, "retailItems", allState.retailItems);
      writeTable(db, "retailSales", allState.retailSales);
      writeTable(db, "kioskOrders", allState.kioskOrders);

      // Non-tabular state — save as JSON blobs inside the meta table.
      // openLog is a single object; poojaLog is a dictionary keyed by pooja time.
      saveAsMeta(db, "openLog", allState.openLog);
      saveAsMeta(db, "poojaLog", allState.poojaLog);

      // Export the in-memory database to a binary file
      const data = db.export();
      db.close();

      // Trigger browser download
      const blob = new Blob([data], { type: "application/x-sqlite3" });
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const filename = `devasarvam-${dateStr}.db`;
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);

      setDbMsg({ kind: "ok", text: `Saved ${filename}. Move it to D:\\Devasarvam\\database\\` });
      // Record the successful backup timestamp — this drives the BackupReminder banner
      setLastBackupAt(new Date().toISOString());
    } catch (err) {
      setDbMsg({ kind: "err", text: `Export failed: ${err.message}` });
    } finally {
      setDbBusy(false);
    }
  };

  // ===== IMPORT =====
  // Read a .db file the user picks, parse all tables, and call loadAllState() to replace the
  // prototype's current data with the file's contents. WARNING: this overwrites everything.
  const importFileRef = useRef();

  const importFromSqlite = async (file) => {
    if (!file) return;

    // Confirmation prompt — this overwrites everything currently in the prototype
    const ok = window.confirm(
      "Importing a database will REPLACE all current data in the prototype.\n\n" +
      "Make sure you've exported the current data first if you want to keep it.\n\n" +
      "Continue with import?"
    );
    if (!ok) {
      // Reset the file input so the same file can be picked again later
      if (importFileRef.current) importFileRef.current.value = "";
      return;
    }

    setDbBusy(true);
    setDbMsg({ kind: "info", text: `Reading ${file.name}…` });

    try {
      const SQL = await initSqlJs({ locateFile: () => sqlWasmUrl });

      // Read the file as binary data
      const buffer = await file.arrayBuffer();
      const db = new SQL.Database(new Uint8Array(buffer));

      // Helper to read a table back into an array of objects
      const readTable = (tableName) => {
        try {
          const result = db.exec(`SELECT * FROM "${tableName}";`);
          if (result.length === 0) return [];
          const { columns, values } = result[0];
          return values.map((row) => {
            const obj = {};
            columns.forEach((col, i) => {
              const val = row[i];
              // Try to JSON-parse if it looks like a JSON object/array (we stored objects this way on export)
              if (typeof val === "string" && (val.startsWith("{") || val.startsWith("["))) {
                try { obj[col] = JSON.parse(val); }
                catch { obj[col] = val; }
              } else if (typeof val === "string" && /^-?\d+(\.\d+)?$/.test(val)) {
                // Looks like a number that got stored as text — convert back
                obj[col] = parseFloat(val);
              } else if (val === "true" || val === "false") {
                obj[col] = val === "true";
              } else {
                obj[col] = val;
              }
            });
            return obj;
          });
        } catch {
          return []; // table doesn't exist in this file
        }
      };

      // Read meta first to see what we're dealing with
      const metaRows = readTable("meta");
      const meta = {};
      metaRows.forEach((r) => { meta[r.key] = r.value; });

      if (meta.app !== "Devasarvam") {
        throw new Error(`This doesn't look like a Devasarvam backup file. Found app="${meta.app || "(none)"}"`);
      }

      // Reconstruct each piece of state
      const newState = {
        inventory: readTable("inventory"),
        bookings: readTable("bookings"),
        issuances: readTable("issuances"),
        housekeeping: readTable("housekeeping"),
        events: readTable("events"),
        requisitions: readTable("requisitions"),
        purchaseIndents: readTable("purchaseIndents"),
        vendors: readTable("vendors"),
        quotations: readTable("quotations"),
        purchaseOrders: readTable("purchaseOrders"),
        grns: readTable("grns"),
        bills: readTable("bills"),
        retailItems: readTable("retailItems"),
        retailSales: readTable("retailSales"),
        kioskOrders: readTable("kioskOrders"),
      };

      // openLog and poojaLog were saved as JSON strings inside meta
      if (meta.openLog) {
        try { newState.openLog = JSON.parse(meta.openLog); } catch { /* ignore */ }
      }
      if (meta.poojaLog) {
        try { newState.poojaLog = JSON.parse(meta.poojaLog); } catch { /* ignore */ }
      }

      db.close();

      // Apply
      loadAllState(newState);

      const exportedAt = meta.exportedAt ? new Date(meta.exportedAt).toLocaleString("en-IN") : "unknown";
      setDbMsg({
        kind: "ok",
        text: `Imported successfully. File was exported on: ${exportedAt}. ` +
              `Loaded ${newState.bookings.length} bookings, ${newState.inventory.length} inventory items, ` +
              `${newState.vendors.length} vendors, ${newState.retailSales.length} retail sales.`,
      });
    } catch (err) {
      setDbMsg({ kind: "err", text: `Import failed: ${err.message}` });
    } finally {
      setDbBusy(false);
      // Reset the file input so picking the same file again still triggers
      if (importFileRef.current) importFileRef.current.value = "";
    }
  };

  const downloadCsv = (filename, headers, rows) => {
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const templates = [
    {
      name: "Vazhipadu Master List",
      desc: "All vazhipadus offered, their prices, and required items.",
      headers: ["vazhipadu_id", "name_english", "name_malayalam", "price_inr", "issuance_area", "items_required"],
      sample: [
        ["v1", "Ganapathi Homam", "ഗണപതി ഹോമം", 501, "Homakundam", "Coconut:5;Ghee:0.5;Camphor:0.05"],
        ["v2", "Archana", "അർച്ചന", 21, "Sreekovil", "Flowers:0.05;Camphor:0.005"],
      ],
    },
    {
      name: "Inventory Master",
      desc: "Consumables with quantity, unit cost, and value. Cost × qty = total value on hand.",
      headers: ["item_id", "name_english", "name_malayalam", "unit", "opening_stock", "unit_cost_inr", "reorder_level"],
      sample: [
        ["i1", "Coconut", "നാളികേരം", "nos", 240, 35, 50],
        ["i2", "Ghee", "നെയ്യ്", "kg", 18.5, 620, 5],
      ],
    },
    {
      name: "Capital Items Register",
      desc: "Thiruvabharanam, vessels, etc. — with weight, book value (acquisition cost), and current value.",
      headers: ["item_id", "name", "name_malayalam", "material", "weight_grams", "acquired_year", "book_value_inr", "current_value_inr", "custodian", "last_verified", "condition", "notes"],
      sample: [
        ["c1", "Thiruvabharanam — Crown", "തിരുവാഭരണം", "Gold", 1850, 1987, 450000, 18500000, "Melsanthi", "2026-04-20", "Excellent", ""],
      ],
    },
    {
      name: "Daily Bookings",
      desc: "Vazhipadu bookings — useful for migrating historical data.",
      headers: ["bill_no", "date", "time", "devotee_name", "nakshatram", "vazhipadu_id", "amount_inr"],
      sample: [["B000001", "2026-04-25", "07:30", "Ramachandran", "Rohini", "v2", 21]],
    },
    {
      name: "Pooja Schedule",
      desc: "Daily pooja timings (can vary by season/festival).",
      headers: ["sequence", "pooja_name", "name_malayalam", "scheduled_time", "performed_by"],
      sample: [["1", "Palli Unarthal", "പള്ളിയുണർത്തൽ", "04:30", "Melsanthi"]],
    },
    {
      name: "Event / Uthsavam Plan",
      desc: "For multi-day festivals — programs, budgets, contributors.",
      headers: ["event_name", "date", "program", "budget_inr", "raised_inr", "in_charge", "status"],
      sample: [["Pratishta Dinam", "2026-05-22", "Kodiyettam", 50000, 25000, "Trust Secretary", "Active"]],
    },
  ];

  return (
    <div>
      {/* Database export/import section */}
      <div className="mb-6 border-2 border-amber-900/30 bg-amber-100/30 p-5">
        <div className="flex items-start gap-3 mb-3">
          <FileSpreadsheet className="w-6 h-6 text-amber-900 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-amber-950" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Database — Backup & Restore
            </h2>
            <p className="text-xs text-amber-800/80 mt-0.5">
              Export saves all current data as a SQLite <strong>.db</strong> file. Import restores from a previously-exported file.
            </p>
          </div>
        </div>

        {/* Last-backup status strip */}
        <div className={`mb-4 px-3 py-2 text-sm border-l-4 ${
          !lastBackupAt ? "border-red-700 bg-red-50 text-red-900" :
          (Date.now() - new Date(lastBackupAt).getTime()) > 24 * 60 * 60 * 1000
            ? "border-orange-600 bg-orange-50 text-orange-900"
            : "border-green-700 bg-green-50 text-green-900"
        }`}>
          <strong>Last backup:</strong>{" "}
          {!lastBackupAt
            ? "Never — please back up now"
            : `${new Date(lastBackupAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`
          }
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Export button */}
          <button
            onClick={exportToSqlite}
            disabled={dbBusy}
            className="bg-amber-900 hover:bg-amber-950 disabled:bg-stone-300 text-amber-50 px-4 py-2 text-sm font-semibold flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {dbBusy ? "Working…" : "Backup Now (Export .db)"}
          </button>

          {/* Import button — uses a hidden file input that the button triggers */}
          <input
            ref={importFileRef}
            type="file"
            accept=".db,.sqlite,.sqlite3"
            style={{ display: "none" }}
            onChange={(e) => importFromSqlite(e.target.files?.[0])}
          />
          <button
            onClick={() => importFileRef.current?.click()}
            disabled={dbBusy}
            className="border-2 border-amber-900 text-amber-900 hover:bg-amber-100 disabled:opacity-50 px-4 py-2 text-sm font-semibold flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Restore from .db
          </button>

          <span className="text-xs text-amber-800/70 italic">
            (.db files save to Downloads; move to <code>D:\Devasarvam\database\</code>)
          </span>
        </div>

        {dbMsg && (
          <div className={`mt-3 px-3 py-2 text-xs border-l-4 ${
            dbMsg.kind === "ok" ? "border-green-700 bg-green-50 text-green-900" :
            dbMsg.kind === "err" ? "border-red-700 bg-red-50 text-red-900" :
            "border-blue-700 bg-blue-50 text-blue-900"
          }`}>
            {dbMsg.text}
          </div>
        )}

        <details className="mt-3 text-xs text-amber-800/80">
          <summary className="cursor-pointer font-semibold">Backup workflow & how to verify</summary>
          <div className="mt-2 space-y-2">
            <div>
              <strong>To back up:</strong>
              <ol className="list-decimal ml-5">
                <li>Click <strong>Backup Now</strong>. A file named <code>devasarvam-YYYY-MM-DD.db</code> downloads.</li>
                <li>Move it from your Downloads folder to <code>D:\Devasarvam\database\</code></li>
                <li>For safety, also copy it to <code>D:\Devasarvam\backup\</code> with the date in the filename.</li>
              </ol>
            </div>
            <div>
              <strong>To verify a .db file is good:</strong>
              <ol className="list-decimal ml-5">
                <li>Open <strong>DB Browser for SQLite</strong> → File → Open Database → select the file</li>
                <li>Click <strong>Browse Data</strong> tab and inspect tables from the dropdown</li>
              </ol>
            </div>
            <div>
              <strong>To restore from a .db file:</strong>
              <ol className="list-decimal ml-5">
                <li>Click <strong>Restore from .db</strong> above</li>
                <li>Pick the .db file from <code>D:\Devasarvam\database\</code></li>
                <li>Confirm — this REPLACES current data with the file's contents</li>
              </ol>
              <p className="italic mt-1">⚠️ Always export a fresh backup before restoring, in case you change your mind.</p>
            </div>
          </div>
        </details>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-amber-950" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Excel Data Entry Templates
        </h2>
        <p className="text-sm text-amber-800/80 mt-1">
          Download these CSV templates, fill them in Excel/LibreOffice, and they'll be ready to import once the database is built.
          The column structure here is also the schema your developer should use for the real database.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {templates.map((t) => (
          <div key={t.name} className="border border-amber-900/20 bg-amber-50/40 p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-bold text-amber-950">{t.name}</h3>
                <p className="text-xs text-amber-800/80 mt-0.5">{t.desc}</p>
              </div>
              <button
                onClick={() => downloadCsv(`${t.name.replace(/\s+/g, "_")}.csv`, t.headers, t.sample)}
                className="flex-shrink-0 bg-amber-900 text-amber-50 text-xs px-3 py-1.5 flex items-center gap-1 hover:bg-amber-950"
              >
                <Download className="w-3 h-3" /> CSV
              </button>
            </div>
            <div className="bg-amber-100/40 border border-amber-900/10 p-2 mt-2 overflow-x-auto">
              <code className="text-[11px] text-amber-900 whitespace-nowrap">{t.headers.join(" · ")}</code>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-amber-100/40 border-l-4 border-amber-900 p-4 text-sm text-amber-900">
        <strong>Tip:</strong> Start with the <em>Vazhipadu Master List</em> and <em>Inventory Master</em> — once those two are accurate,
        the booking → auto-issuance flow will work with real numbers from your temple.
      </div>
    </div>
  );
}

