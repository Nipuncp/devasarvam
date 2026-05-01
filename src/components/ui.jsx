import { useState } from "react";
import { NAKSHATRAMS } from "../seed/index.js";

// =================== UI HELPERS ===================

// Compact stat card used across Store, Purchase, RetailCounter dashboards.
export function StoreStat({ label, value, sub, accent }) {
  return (
    <div className={`p-4 border ${accent ? "bg-amber-900 text-amber-50 border-amber-900" : "bg-amber-50/40 border-amber-900/20"}`}>
      <div className={`text-xs uppercase tracking-wider ${accent ? "opacity-80" : "text-amber-800/70"}`}>{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${accent ? "" : "text-amber-950"}`}>{value}</div>
      {sub && <div className={`text-xs mt-0.5 ${accent ? "opacity-80" : "text-amber-800/60"}`}>{sub}</div>}
    </div>
  );
}

export function Card({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="bg-amber-50/40 border border-amber-900/20 p-5">
      <div className="flex items-start gap-3 mb-4 pb-3 border-b border-amber-900/15">
        {Icon && <div className="bg-amber-900 text-amber-50 p-2"><Icon className="w-4 h-4" /></div>}
        <div>
          <h3 className="text-lg font-bold text-amber-950" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{title}</h3>
          {subtitle && <div className="text-xs text-amber-800/70 italic" style={{ fontFamily: "'Noto Sans Malayalam', serif" }}>{subtitle}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

export function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/60 border border-amber-900/30 focus:border-amber-900 focus:outline-none px-3 py-2 text-sm"
      />
    </div>
  );
}

// Labeled nakshatram dropdown — used in the primary devotee form
export function NakshatramField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/60 border border-amber-900/30 focus:border-amber-900 focus:outline-none px-3 py-2 text-sm"
        style={{ fontFamily: "inherit" }}
      >
        <option value="">— Select Nakshatram —</option>
        {NAKSHATRAMS.map((n) => (
          <option key={n.name} value={n.name}>
            {n.name} · {n.malayalam}
          </option>
        ))}
      </select>
    </div>
  );
}

// Compact nakshatram dropdown — used per cart line
export function NakshatramSelect({ value, onChange, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white border border-amber-900/20 px-2 py-1 text-xs focus:border-amber-900 focus:outline-none"
      style={{ fontFamily: "inherit" }}
    >
      <option value="">{placeholder || "— Nakshatram —"}</option>
      {NAKSHATRAMS.map((n) => (
        <option key={n.name} value={n.name}>
          {n.name} · {n.malayalam}
        </option>
      ))}
    </select>
  );
}

// Quantity input that lets the user enter weight in either kg or grams.
// Internally always stores in baseUnit (e.g. "kg") so inventory math is unchanged.
// For non-weight items (nos, sticks, l), shows the unit as-is with no toggle.
export function QtyInput({ qty, baseUnit, onChange }) {
  // Only items measured in kg get the g/kg toggle
  const isWeight = baseUnit === "kg";
  const [displayUnit, setDisplayUnit] = useState(() => {
    // Default to grams if the quantity is small (< 1 kg) and weight-based
    if (!isWeight) return baseUnit;
    const n = parseFloat(qty);
    return !isNaN(n) && n > 0 && n < 1 ? "g" : "kg";
  });

  // What the user sees in the input — converted from base
  const baseQty = parseFloat(qty) || 0;
  const displayValue =
    displayUnit === "g" && isWeight
      ? baseQty === 0 ? "" : (baseQty * 1000).toString()
      : baseQty === 0 ? "" : baseQty.toString();

  const handleChange = (raw) => {
    const n = parseFloat(raw);
    if (isNaN(n) || raw === "") {
      onChange("");
      return;
    }
    // Convert input to base unit before saving
    const inBase = displayUnit === "g" && isWeight ? n / 1000 : n;
    onChange(inBase);
  };

  if (!isWeight) {
    // Plain unit display for nos / sticks / l etc.
    return (
      <div className="flex items-center gap-1">
        <input
          type="number" step="any" min="0"
          value={displayValue}
          onChange={(e) => onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
          className="w-20 px-2 py-1 border border-amber-900/30 text-sm text-right tabular-nums"
        />
        <span className="text-xs text-amber-800/70 w-12">{baseUnit}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number" step="any" min="0"
        value={displayValue}
        onChange={(e) => handleChange(e.target.value)}
        className="w-20 px-2 py-1 border border-amber-900/30 text-sm text-right tabular-nums"
      />
      <select
        value={displayUnit}
        onChange={(e) => setDisplayUnit(e.target.value)}
        className="bg-amber-50 border border-amber-900/30 px-1.5 py-1 text-xs font-semibold text-amber-900 focus:outline-none"
        style={{ fontFamily: "inherit" }}
      >
        <option value="g">g</option>
        <option value="kg">kg</option>
      </select>
    </div>
  );
}

// Format a quantity stored in baseUnit (kg) into a friendly display string.
// 0.05 kg → "50 g", 1.5 kg → "1.5 kg", 0 → "0".
export function formatQty(qty, baseUnit) {
  if (qty == null || isNaN(qty)) return "—";
  if (baseUnit !== "kg") return `${qty} ${baseUnit}`;
  if (qty === 0) return `0 kg`;
  if (qty < 1) {
    const g = qty * 1000;
    // Show whole grams when clean, else 1 decimal
    return Number.isInteger(g) ? `${g} g` : `${g.toFixed(1)} g`;
  }
  return `${qty} kg`;
}

