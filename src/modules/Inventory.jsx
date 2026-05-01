import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useInventoryItems } from "../data/useInventoryItems.js";
import { useCapitalItems } from "../data/useCapitalItems.js";
import { usePurchaseIndents } from "../data/usePurchaseIndents.js";
import { useRole } from "../lib/auth.jsx";

// Store keeper view: stock register + valuation + capital items.
// Restock dialog uses weighted-average cost, same as the prototype.
//
// DB column names: unit_cost / total_received / total_issued (snake_case),
// unlike the prototype's camelCase. Rendered directly here — no aliasing.

export function Inventory() {
  const { rows: inventory, loading: invLoading, updateItem } = useInventoryItems();
  const { rows: capitalItems } = useCapitalItems();
  const { rows: indents, raise: raiseIndent } = usePurchaseIndents();
  const role = useRole();
  const canEdit = role === "store_keeper" || role === "admin";

  const [section, setSection] = useState("register");
  const [restocking, setRestocking] = useState(null);
  const [restockQty, setRestockQty] = useState("");
  const [restockCost, setRestockCost] = useState("");
  const [reorderFeedback, setReorderFeedback] = useState(null);

  // Find an open / ordered indent for an item (used in the register column).
  const indentStatusFor = (itemId) => {
    const open = indents.find(
      (p) => p.purchase_indent_items?.some((it) => it.item_id === itemId) && p.status === "open",
    );
    if (open) return { status: "Open", indentNo: open.indent_no, source: "auto" };
    const ordered = indents.find(
      (p) => p.purchase_indent_items?.some((it) => it.item_id === itemId) && p.status === "ordered",
    );
    if (ordered)
      return {
        status: "Ordered",
        indentNo: ordered.indent_no,
        source: "auto",
      };
    return null;
  };

  const handleGenerateReorder = async () => {
    if (!canEdit) return;
    const lowItems = inventory.filter(
      (i) =>
        Number(i.qty) <= Number(i.reorder) &&
        !indents.some(
          (ind) =>
            ["open", "ordered"].includes(ind.status) &&
            ind.purchase_indent_items?.some((it) => it.item_id === i.id),
        ),
    );
    if (lowItems.length === 0) {
      setReorderFeedback({ ok: true, msg: "No new indents needed — every below-reorder item already has an Open indent." });
      setTimeout(() => setReorderFeedback(null), 5000);
      return;
    }
    const indentNo = `IND-${Date.now().toString().slice(-6)}`;
    try {
      await raiseIndent({
        indent_no: indentNo,
        status: "open",
        items: lowItems.map((i) => ({
          item_id: i.id,
          item_name: i.name,
          qty_requested: Math.max(Number(i.reorder) * 2 - Number(i.qty), Number(i.reorder)),
          unit_cost: Number(i.unit_cost ?? 0),
        })),
      });
      setReorderFeedback({ ok: true, msg: `Created indent ${indentNo} for ${lowItems.length} item${lowItems.length > 1 ? "s" : ""}.` });
    } catch (e) {
      setReorderFeedback({ ok: false, msg: `Failed: ${e.message}` });
    }
    setTimeout(() => setReorderFeedback(null), 5000);
  };

  const submitRestock = async (item) => {
    const q = parseFloat(restockQty);
    const c = parseFloat(restockCost);
    if (isNaN(q) || q <= 0 || isNaN(c) || c < 0) return;
    const oldQty = Number(item.qty);
    const oldUnitCost = Number(item.unit_cost);
    const oldValue = oldQty * oldUnitCost;
    const newValue = q * c;
    const newQty = +(oldQty + q).toFixed(3);
    const newAvgCost = newQty > 0 ? +((oldValue + newValue) / newQty).toFixed(2) : c;
    try {
      await updateItem(item.id, {
        qty: newQty,
        unit_cost: newAvgCost,
        total_received: +(Number(item.total_received || 0) + q).toFixed(3),
      });
    } catch (e) {
      alert(`Restock failed: ${e.message}`);
    }
    setRestocking(null);
    setRestockQty("");
    setRestockCost("");
  };

  const consumableValue = inventory.reduce(
    (s, i) => s + Number(i.qty) * Number(i.unit_cost),
    0,
  );
  const lowStockCount = inventory.filter((i) => Number(i.qty) <= Number(i.reorder)).length;
  const capitalBookValue = capitalItems.reduce((s, c) => s + Number(c.book_value || 0), 0);
  const capitalCurrentValue = capitalItems.reduce((s, c) => s + Number(c.current_value || 0), 0);

  const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  if (invLoading) return <div className="text-sm text-amber-700">Loading…</div>;

  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-amber-900 text-amber-50 p-4">
          <div className="text-xs uppercase tracking-wider opacity-80">Consumables Value</div>
          <div className="text-2xl font-bold tabular-nums mt-1">{fmt(consumableValue)}</div>
          <div className="text-xs opacity-80 mt-0.5">{inventory.length} items · {lowStockCount} low</div>
        </div>
        <div className="bg-amber-50 border-2 border-amber-900/30 p-4">
          <div className="text-xs uppercase tracking-wider text-amber-900">Capital — Book Value</div>
          <div className="text-2xl font-bold tabular-nums mt-1 text-amber-950">{fmt(capitalBookValue)}</div>
          <div className="text-xs text-amber-800/70 mt-0.5">Original acquisition cost</div>
        </div>
        <div className="bg-gradient-to-br from-amber-200 to-amber-300 border-2 border-amber-900/50 p-4">
          <div className="text-xs uppercase tracking-wider text-amber-900">Capital — Current Value</div>
          <div className="text-2xl font-bold tabular-nums mt-1 text-amber-950">{fmt(capitalCurrentValue)}</div>
          <div className="text-xs text-amber-900/80 mt-0.5">At today's metal rates</div>
        </div>
      </div>

      <div className="flex gap-2 mb-5 border-b border-amber-900/20 overflow-x-auto">
        {[
          { id: "register", label: "Stock Register" },
          { id: "consumable", label: "Consumables — Valuation" },
          { id: "capital", label: "Capital Items" },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`px-4 py-2 text-sm whitespace-nowrap border-b-2 ${
              section === s.id ? "border-amber-900 text-amber-950 font-semibold" : "border-transparent text-amber-800/70"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === "register" && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-bold text-amber-950" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Stock Register</h3>
              <p className="text-xs text-amber-800/70 italic">Opening + Received − Issued = Closing.</p>
            </div>
            {canEdit && (
              <button
                onClick={handleGenerateReorder}
                className="bg-amber-900 hover:bg-amber-950 text-amber-50 px-4 py-2 text-sm flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" /> Generate Indents for Below-Reorder
              </button>
            )}
          </div>

          {reorderFeedback && (
            <div className={`mb-3 px-3 py-2 text-sm border-l-4 ${reorderFeedback.ok ? "border-amber-700 bg-amber-50 text-amber-900" : "border-red-600 bg-red-50 text-red-800"}`}>
              {reorderFeedback.msg}
            </div>
          )}

          <h4 className="text-xs uppercase tracking-wider text-amber-900 font-semibold mb-2 mt-4">Consumables</h4>
          <div className="bg-amber-50/40 border border-amber-900/15 overflow-x-auto mb-6">
            <table className="w-full text-sm min-w-[1000px]">
              <thead className="bg-amber-100/60 text-amber-900 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-3 py-3">Item</th>
                  <th className="text-right px-3 py-3">Opening</th>
                  <th className="text-right px-3 py-3 text-green-800">+ Received</th>
                  <th className="text-right px-3 py-3 text-red-800">− Issued</th>
                  <th className="text-right px-3 py-3 font-bold">Closing</th>
                  <th className="text-right px-3 py-3">Reorder Level</th>
                  <th className="text-center px-3 py-3">Status</th>
                  <th className="text-left px-3 py-3">Indent</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((i) => {
                  const opening = Number(i.opening ?? i.qty);
                  const received = Number(i.total_received || 0);
                  const issued = Number(i.total_issued || 0);
                  const closing = Number(i.qty);
                  const isLow = closing <= Number(i.reorder);
                  const isCritical = closing <= Number(i.reorder) * 0.5;
                  const indent = indentStatusFor(i.id);
                  return (
                    <tr key={i.id} className={`border-t border-amber-900/10 ${isCritical ? "bg-red-50" : isLow ? "bg-orange-50" : ""}`}>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-amber-950">{i.name}</div>
                        <div className="text-xs text-amber-800/70" style={{ fontFamily: "'Noto Sans Malayalam', serif" }}>{i.malayalam}</div>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-amber-800/80">{formatQty(opening, i.unit)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-green-800">{received > 0 ? `+ ${formatQty(received, i.unit)}` : "—"}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-red-800">{issued > 0 ? `− ${formatQty(issued, i.unit)}` : "—"}</td>
                      <td className={`px-3 py-3 text-right tabular-nums font-bold ${isCritical ? "text-red-800" : isLow ? "text-orange-800" : "text-amber-950"}`}>
                        {formatQty(closing, i.unit)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-amber-800/80">{formatQty(Number(i.reorder), i.unit)}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-1 font-bold ${
                          isCritical ? "bg-red-200 text-red-900" : isLow ? "bg-orange-200 text-orange-900" : "bg-green-100 text-green-800"
                        }`}>
                          {isCritical ? "Critical" : isLow ? "Reorder" : "OK"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {indent ? (
                          <div>
                            <span className={`inline-block text-[10px] uppercase tracking-wider px-1.5 py-0.5 font-semibold ${
                              indent.status === "Ordered" ? "bg-amber-200 text-amber-900" : "bg-blue-100 text-blue-900"
                            }`}>{indent.status}</span>
                            <div className="text-[10px] text-amber-700 mt-0.5">{indent.indentNo}</div>
                          </div>
                        ) : (
                          <span className="text-amber-700/40 italic text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h4 className="text-xs uppercase tracking-wider text-amber-900 font-semibold mb-2 mt-4">Capital Items</h4>
          <CapitalTable items={capitalItems} fmt={fmt} />
        </div>
      )}

      {section === "consumable" && (
        <div className="bg-amber-50/40 border border-amber-900/15 overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-amber-100/60 text-amber-900 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Item</th>
                <th className="text-right px-4 py-3">Qty</th>
                <th className="text-right px-4 py-3">Unit Cost</th>
                <th className="text-right px-4 py-3">Total Value</th>
                <th className="text-right px-4 py-3">Reorder</th>
                <th className="text-center px-4 py-3">Status</th>
                {canEdit && <th className="text-right px-4 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {inventory.map((i) => {
                const value = Number(i.qty) * Number(i.unit_cost);
                const low = Number(i.qty) <= Number(i.reorder);
                return (
                  <tr key={i.id} className="border-t border-amber-900/10">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-amber-950">{i.name}</div>
                      <div className="text-xs text-amber-800/70" style={{ fontFamily: "'Noto Sans Malayalam', serif" }}>{i.malayalam}</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-amber-950">{formatQty(Number(i.qty), i.unit)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-900">₹{i.unit_cost}<span className="text-xs text-amber-800/60">/{i.unit}</span></td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-amber-950">{fmt(value)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-800/70">{i.reorder}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 ${low ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                        {low ? "Low" : "OK"}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => { setRestocking(i); setRestockQty(""); setRestockCost(String(i.unit_cost)); }} className="text-xs px-2 py-1 border border-amber-900/40 hover:bg-amber-100">+ Restock</button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-amber-100/40 border-t-2 border-amber-900/30">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right text-xs uppercase tracking-wider text-amber-900 font-semibold">Total Inventory Value</td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-amber-950 text-base">{fmt(consumableValue)}</td>
                <td colSpan={canEdit ? 3 : 2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {section === "capital" && (
        <CapitalTable items={capitalItems} fmt={fmt} expanded />
      )}

      {restocking && (
        <div className="fixed inset-0 bg-stone-900/40 flex items-center justify-center z-50 p-4" onClick={() => setRestocking(null)}>
          <div className="bg-amber-50 border-2 border-amber-900/40 max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-amber-950 mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Restock: {restocking.name}
            </h3>
            <p className="text-xs text-amber-800/70 mb-4">
              Current: {restocking.qty} {restocking.unit} at ₹{restocking.unit_cost}/{restocking.unit}.
              New cost will be a weighted average of old and new stock.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Quantity Added ({restocking.unit})</label>
                <input autoFocus type="number" step="0.001" value={restockQty} onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm focus:border-amber-900 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Cost per {restocking.unit} (₹)</label>
                <input type="number" step="0.01" value={restockCost} onChange={(e) => setRestockCost(e.target.value)}
                  className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm focus:border-amber-900 focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => submitRestock(restocking)} className="flex-1 bg-amber-900 text-amber-50 py-2 text-sm font-semibold">Confirm Restock</button>
              <button onClick={() => setRestocking(null)} className="px-4 py-2 border border-amber-900/40 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CapitalTable({ items, fmt, expanded = false }) {
  return (
    <div className="bg-amber-50/40 border border-amber-900/15 overflow-x-auto">
      <table className="w-full text-sm min-w-[900px]">
        <thead className="bg-amber-100/60 text-amber-900 text-xs uppercase tracking-wider">
          <tr>
            <th className="text-left px-3 py-3">Item</th>
            <th className="text-left px-3 py-3">Material</th>
            <th className="text-right px-3 py-3">Weight</th>
            <th className="text-right px-3 py-3">Book Value</th>
            <th className="text-right px-3 py-3">Current Value</th>
            <th className="text-left px-3 py-3">Custodian</th>
            <th className="text-left px-3 py-3">Last Verified</th>
            {expanded && <th className="text-center px-3 py-3">Condition</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((c) => {
            const daysSinceVerify = c.last_verified
              ? Math.round((Date.now() - new Date(c.last_verified).getTime()) / 86400000)
              : null;
            const auditStale = daysSinceVerify !== null && daysSinceVerify > 90;
            const appreciation = c.book_value
              ? ((Number(c.current_value) - Number(c.book_value)) / Number(c.book_value)) * 100
              : 0;
            return (
              <tr key={c.id} className={`border-t border-amber-900/10 ${auditStale ? "bg-orange-50" : ""}`}>
                <td className="px-3 py-3">
                  <div className="font-semibold text-amber-950">{c.name}</div>
                  <div className="text-xs text-amber-800/70" style={{ fontFamily: "'Noto Sans Malayalam', serif" }}>{c.malayalam}</div>
                  <div className="text-[10px] text-amber-700/70">Acq. {c.acquired_year}</div>
                </td>
                <td className="px-3 py-3 text-amber-900">{c.material}</td>
                <td className="px-3 py-3 text-right tabular-nums text-amber-900">{Number(c.weight_grams).toLocaleString("en-IN")} g</td>
                <td className="px-3 py-3 text-right tabular-nums text-amber-900">{fmt(c.book_value)}</td>
                <td className="px-3 py-3 text-right">
                  <div className="tabular-nums font-bold text-amber-950">{fmt(c.current_value)}</div>
                  {expanded && (
                    <div className={`text-[10px] tabular-nums ${appreciation >= 0 ? "text-green-700" : "text-red-700"}`}>
                      {appreciation >= 0 ? "↑" : "↓"} {Math.abs(appreciation).toFixed(0)}%
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 text-amber-900">{c.custodian}</td>
                <td className="px-3 py-3 text-xs text-amber-800/80 tabular-nums">
                  {c.last_verified}
                  {daysSinceVerify !== null && (
                    <div className={`text-[10px] ${auditStale ? "text-orange-700 font-semibold" : "text-amber-700/70"}`}>
                      {daysSinceVerify} days ago{auditStale ? " · audit due" : ""}
                    </div>
                  )}
                </td>
                {expanded && (
                  <td className="px-3 py-3 text-center">
                    <span className="text-xs px-2 py-1 bg-amber-100 text-amber-900">{c.condition}</span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-amber-800/70 italic px-3 py-2 bg-amber-100/30 border-t border-amber-900/10">
        Capital items are flagged for re-verification if last audit is over 90 days old.
      </p>
    </div>
  );
}

// Format a quantity stored in baseUnit (kg) into a friendly display string.
function formatQty(qty, baseUnit) {
  if (qty == null || isNaN(qty)) return "—";
  if (baseUnit !== "kg") return `${qty} ${baseUnit}`;
  if (qty === 0) return "0 kg";
  if (qty < 1) {
    const g = qty * 1000;
    return Number.isInteger(g) ? `${g} g` : `${g.toFixed(1)} g`;
  }
  return `${qty} kg`;
}
