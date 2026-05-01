import { useState, useRef } from "react";
import { Receipt, Plus, Check, X, AlertTriangle, IndianRupee, TrendingDown, Printer, ShoppingCart, Star, Phone, Building2, FileText, Upload, Loader, Award, Scan, FileCheck } from "lucide-react";
import { Card, Field, formatQty, StoreStat } from "../components/ui.jsx";

// =================== PURCHASE MODULE ===================
export function Purchase({ inventory, vendors, quotations, purchaseOrders, grns, bills, purchaseIndents,
                    saveVendor, deleteVendor, createQuotation, updateQuote, createPurchaseOrder,
                    createGRN, createBill, verifyBill, markBillPaid }) {
  const [view, setView] = useState("dashboard");

  const openPOs = purchaseOrders.filter((p) => p.status === "Issued" || p.status === "PartiallyReceived");
  const openQuotations = quotations.filter((q) => q.status === "Open");
  const pendingBills = bills.filter((b) => b.status === "Pending");
  const openIndents = purchaseIndents.filter((p) => p.status === "Open");

  const totalSpend = bills.filter((b) => b.status === "Paid").reduce((s, b) => s + (b.totalAmount || 0), 0);

  const fmt = (n) => "₹" + (n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  return (
    <div>
      {/* Stats strip */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StoreStat label="Vendors" value={vendors.length} sub="In master list" />
        <StoreStat label="Open Quotes" value={openQuotations.length} sub="Awaiting selection" />
        <StoreStat label="Active POs" value={openPOs.length} sub={`₹${openPOs.reduce((s, p) => s + p.totalAmount, 0).toLocaleString("en-IN", {maximumFractionDigits: 0})}`} accent />
        <StoreStat label="Pending Bills" value={pendingBills.length} sub="To verify" />
        <StoreStat label="Total Paid" value={fmt(totalSpend)} sub={`${bills.filter((b) => b.status === "Paid").length} bills`} />
      </div>

      <div className="flex gap-1 mb-5 border-b border-amber-900/20 overflow-x-auto">
        {[
          { id: "dashboard", label: "Overview", icon: TrendingDown },
          { id: "vendors", label: `Vendors (${vendors.length})`, icon: Building2 },
          { id: "quotes", label: `Quotations (${openQuotations.length})`, icon: FileText },
          { id: "pos", label: `Purchase Orders (${openPOs.length})`, icon: ShoppingCart },
          { id: "grn", label: `Goods Receipt (${grns.length})`, icon: FileCheck },
          { id: "bills", label: `Bills (${pendingBills.length})`, icon: Receipt },
        ].map((s) => {
          const Ic = s.icon;
          return (
            <button key={s.id} onClick={() => setView(s.id)}
              className={`flex items-center gap-2 px-3 py-2 text-sm whitespace-nowrap border-b-2 ${
                view === s.id ? "border-amber-900 text-amber-950 font-semibold" : "border-transparent text-amber-800/70"
              }`}>
              <Ic className="w-4 h-4" />{s.label}
            </button>
          );
        })}
      </div>

      {view === "dashboard" && <PurchaseDashboard vendors={vendors} purchaseOrders={purchaseOrders} bills={bills} openIndents={openIndents} />}
      {view === "vendors" && <VendorMaster vendors={vendors} inventory={inventory} onSave={saveVendor} onDelete={deleteVendor} />}
      {view === "quotes" && <QuotationView quotations={quotations} vendors={vendors} purchaseIndents={purchaseIndents} onCreate={createQuotation} onUpdate={updateQuote} onAward={createPurchaseOrder} />}
      {view === "pos" && <PurchaseOrderView purchaseOrders={purchaseOrders} vendors={vendors} grns={grns} />}
      {view === "grn" && <GRNView purchaseOrders={purchaseOrders} grns={grns} onCreate={createGRN} />}
      {view === "bills" && <BillView bills={bills} purchaseOrders={purchaseOrders} grns={grns} vendors={vendors} onCreate={createBill} onVerify={verifyBill} onPaid={markBillPaid} />}
    </div>
  );
}

// ----- Dashboard -----
function PurchaseDashboard({ vendors, purchaseOrders, bills, openIndents }) {
  const fmt = (n) => "₹" + (n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
  // Top vendors by overall rating
  const topVendors = [...vendors]
    .map((v) => ({ ...v, score: ((v.ratings?.quality || 0) + (v.ratings?.timeliness || 0) + (v.ratings?.accuracy || 0)) / 3 }))
    .sort((a, b) => b.score - a.score).slice(0, 5);
  // Spend by vendor
  const spendByVendor = vendors.map((v) => {
    const total = bills.filter((b) => b.vendorId === v.id && b.status === "Paid").reduce((s, b) => s + (b.totalAmount || 0), 0);
    return { name: v.name, total };
  }).filter((x) => x.total > 0).sort((a, b) => b.total - a.total);
  const maxSpend = spendByVendor[0]?.total || 1;

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <Card title="Top Vendors by Score" subtitle="Quality · Timeliness · Accuracy" icon={Award}>
        {topVendors.length === 0 ? <p className="text-sm text-amber-800/60 italic">No vendors rated yet.</p> : (
          <div className="space-y-3">
            {topVendors.map((v, idx) => (
              <div key={v.id} className="flex items-center gap-3 border-b border-amber-900/10 pb-2 last:border-0">
                <div className="text-xl font-bold text-amber-700/40 w-6">{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-amber-950 truncate">{v.name}</div>
                  <div className="text-xs text-amber-800/70">{v.totalOrders} orders · {Math.round((v.ordersOnTime / Math.max(1, v.totalOrders)) * 100)}% on time</div>
                </div>
                <StarRating value={v.score} small />
                <div className="text-sm tabular-nums font-semibold text-amber-900 w-10 text-right">{v.score.toFixed(1)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Spend by Vendor" subtitle="Across paid bills" icon={IndianRupee}>
        {spendByVendor.length === 0 ? <p className="text-sm text-amber-800/60 italic">No paid bills yet.</p> : (
          <div className="space-y-2">
            {spendByVendor.slice(0, 6).map((x) => (
              <div key={x.name}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-amber-900 font-semibold truncate">{x.name}</span>
                  <span className="tabular-nums text-amber-900">{fmt(x.total)}</span>
                </div>
                <div className="h-2 bg-amber-100">
                  <div className="h-full bg-amber-900" style={{ width: `${(x.total / maxSpend) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="PO Status" icon={ShoppingCart}>
        <div className="grid grid-cols-2 gap-3 text-center">
          {[
            { label: "Issued", value: purchaseOrders.filter((p) => p.status === "Issued").length, color: "blue" },
            { label: "Partial", value: purchaseOrders.filter((p) => p.status === "PartiallyReceived").length, color: "orange" },
            { label: "Received", value: purchaseOrders.filter((p) => p.status === "Received").length, color: "green" },
            { label: "Cancelled", value: purchaseOrders.filter((p) => p.status === "Cancelled").length, color: "stone" },
          ].map((s) => (
            <div key={s.label} className={`p-3 border-l-4 ${s.color === "blue" ? "border-blue-700 bg-blue-50" : s.color === "orange" ? "border-orange-700 bg-orange-50" : s.color === "green" ? "border-green-700 bg-green-50" : "border-stone-500 bg-stone-50"}`}>
              <div className="text-xs uppercase tracking-wider text-amber-800">{s.label}</div>
              <div className="text-2xl font-bold tabular-nums text-amber-950">{s.value}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Open Indents Awaiting Quote" icon={AlertTriangle}>
        {openIndents.length === 0 ? <p className="text-sm text-amber-800/60 italic">No open indents — all caught up.</p> : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {openIndents.map((i) => (
              <div key={i.id} className="flex justify-between text-sm border-b border-amber-900/10 py-1.5 last:border-0">
                <div>
                  <span className="font-semibold text-amber-950">{i.itemName}</span>
                  <span className="text-xs text-amber-700 ml-2">{i.indentNo}</span>
                </div>
                <span className="tabular-nums text-amber-900 font-semibold">{formatQty(i.qtyNeeded, i.unit)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ----- Star rating display + interactive -----
function StarRating({ value, small, onChange }) {
  const interactive = !!onChange;
  const size = small ? "w-3 h-3" : "w-4 h-4";
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-0.5">
      {stars.map((n) => {
        const filled = (value || 0) >= n - 0.25;
        const half = !filled && (value || 0) >= n - 0.75;
        return (
          <button
            key={n}
            onClick={interactive ? () => onChange(n) : undefined}
            disabled={!interactive}
            className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
            aria-label={`${n} stars`}
          >
            <Star className={`${size} ${filled ? "fill-amber-500 text-amber-500" : half ? "fill-amber-300 text-amber-500" : "text-amber-300"}`} />
          </button>
        );
      })}
    </div>
  );
}

// ----- Vendor Master -----
function VendorMaster({ vendors, inventory, onSave, onDelete }) {
  const [editing, setEditing] = useState(null); // null | "new" | vendor object

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-amber-950" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Vendor Master</h3>
        <button onClick={() => setEditing("new")} className="bg-amber-900 text-amber-50 px-4 py-2 text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </div>

      <div className="bg-amber-50/40 border border-amber-900/15 overflow-x-auto">
        <table className="w-full text-sm min-w-[1000px]">
          <thead className="bg-amber-100/60 text-amber-900 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-3 py-3">Code</th>
              <th className="text-left px-3 py-3">Vendor</th>
              <th className="text-left px-3 py-3">Items Supplied</th>
              <th className="text-center px-3 py-3">Quality</th>
              <th className="text-center px-3 py-3">Timeliness</th>
              <th className="text-center px-3 py-3">Accuracy</th>
              <th className="text-right px-3 py-3">Orders</th>
              <th className="text-right px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => {
              const itemNames = (v.itemIds || []).map((id) => inventory.find((i) => i.id === id)?.name).filter(Boolean).slice(0, 3);
              const moreCount = (v.itemIds || []).length - itemNames.length;
              const overallScore = ((v.ratings?.quality || 0) + (v.ratings?.timeliness || 0) + (v.ratings?.accuracy || 0)) / 3;
              return (
                <tr key={v.id} className="border-t border-amber-900/10">
                  <td className="px-3 py-3 font-mono text-xs text-amber-700">{v.code}</td>
                  <td className="px-3 py-3">
                    <div className="font-semibold text-amber-950">{v.name}</div>
                    <div className="text-xs text-amber-800/70">{v.contact}{v.phone && ` · ${v.phone}`}</div>
                    {v.gst && <div className="text-[10px] text-amber-700/60 font-mono">GST: {v.gst}</div>}
                  </td>
                  <td className="px-3 py-3 text-xs text-amber-800">
                    {itemNames.join(", ")}{moreCount > 0 && ` +${moreCount}`}
                  </td>
                  <td className="px-3 py-3 text-center"><StarRating value={v.ratings?.quality} small /></td>
                  <td className="px-3 py-3 text-center"><StarRating value={v.ratings?.timeliness} small /></td>
                  <td className="px-3 py-3 text-center"><StarRating value={v.ratings?.accuracy} small /></td>
                  <td className="px-3 py-3 text-right">
                    <div className="tabular-nums text-amber-900 font-semibold">{v.totalOrders || 0}</div>
                    <div className="text-[10px] text-amber-700/70">Score {overallScore.toFixed(1)}</div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button onClick={() => setEditing(v)} className="text-xs px-2 py-1 border border-amber-900/40 hover:bg-amber-100 mr-1">Edit</button>
                    <button onClick={() => { if (confirm(`Delete ${v.name}?`)) onDelete(v.id); }} className="text-xs px-2 py-1 text-red-700 hover:bg-red-50">×</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <VendorEditor
          vendor={editing === "new" ? null : editing}
          inventory={inventory}
          onSave={(data) => { onSave(data); setEditing(null); }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function VendorEditor({ vendor, inventory, onSave, onClose }) {
  const [form, setForm] = useState({
    id: vendor?.id || null,
    name: vendor?.name || "",
    contact: vendor?.contact || "",
    phone: vendor?.phone || "",
    address: vendor?.address || "",
    gst: vendor?.gst || "",
    paymentTerms: vendor?.paymentTerms || "Net 30",
    itemIds: vendor?.itemIds || [],
    defaultRates: vendor?.defaultRates || {},
  });

  const toggleItem = (id) => {
    setForm((f) => {
      const has = f.itemIds.includes(id);
      const itemIds = has ? f.itemIds.filter((x) => x !== id) : [...f.itemIds, id];
      const defaultRates = { ...f.defaultRates };
      if (has) delete defaultRates[id];
      return { ...f, itemIds, defaultRates };
    });
  };

  const setRate = (id, val) => {
    setForm((f) => ({ ...f, defaultRates: { ...f.defaultRates, [id]: parseFloat(val) || 0 } }));
  };

  return (
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-amber-50 border-2 border-amber-900/40 max-w-2xl w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-amber-950 mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          {vendor ? `Edit ${vendor.name}` : "Add Vendor"}
        </h3>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Vendor Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Sree Krishna Stores" />
          <Field label="Contact Person" value={form.contact} onChange={(v) => setForm({ ...form, contact: v })} placeholder="Ramesh" />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+91 ..." />
          <Field label="GST Number" value={form.gst} onChange={(v) => setForm({ ...form, gst: v })} placeholder="32ABCDE1234F1Z5" />
          <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="Town, district" />
          <div>
            <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Payment Terms</label>
            <select value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
              className="w-full bg-white/60 border border-amber-900/30 px-3 py-2 text-sm">
              <option>Cash</option><option>Advance</option><option>Net 7</option><option>Net 15</option><option>Net 30</option>
            </select>
          </div>
        </div>

        <div className="mt-5">
          <label className="block text-xs uppercase tracking-wider text-amber-900 mb-2">Items Supplied + Default Rate</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto bg-white/60 border border-amber-900/20 p-2">
            {inventory.map((i) => {
              const checked = form.itemIds.includes(i.id);
              return (
                <div key={i.id} className={`flex items-center gap-2 px-2 py-1.5 ${checked ? "bg-amber-100/60" : ""}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleItem(i.id)} />
                  <span className="flex-1 text-sm">{i.name}</span>
                  {checked && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-amber-700">₹</span>
                      <input
                        type="number" step="0.01"
                        value={form.defaultRates[i.id] ?? ""}
                        onChange={(e) => setRate(i.id, e.target.value)}
                        placeholder="rate"
                        className="w-16 px-1.5 py-0.5 border border-amber-900/30 text-xs text-right"
                      />
                      <span className="text-[10px] text-amber-700">/{i.unit}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 mt-5 pt-4 border-t border-amber-900/15">
          <button onClick={() => onSave(form)} className="flex-1 bg-amber-900 text-amber-50 py-2.5 text-sm font-semibold">
            {vendor ? "Save Changes" : "Add Vendor"}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-amber-900/40 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ----- Quotation / RFQ -----
function QuotationView({ quotations, vendors, purchaseIndents, onCreate, onUpdate, onAward }) {
  const [showRFQ, setShowRFQ] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const open = quotations.filter((q) => q.status === "Open");
  const closed = quotations.filter((q) => q.status === "Closed");

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-amber-950" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Quotations & Price Comparison</h3>
        <button onClick={() => setShowRFQ(true)} className="bg-amber-900 text-amber-50 px-4 py-2 text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Quotation Request
        </button>
      </div>

      {open.length === 0 && closed.length === 0 && (
        <div className="text-center py-12 text-amber-800/60">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm italic">No quotations yet. Start by requesting quotes for an open indent.</p>
        </div>
      )}

      {open.length > 0 && (
        <>
          <h4 className="text-xs uppercase tracking-wider text-amber-900 font-semibold mb-2">Open</h4>
          <div className="space-y-3 mb-6">
            {open.map((q) => (
              <QuotationCard key={q.id} q={q} vendors={vendors} expanded={expanded === q.id}
                onToggle={() => setExpanded(expanded === q.id ? null : q.id)}
                onUpdate={onUpdate} onAward={onAward} />
            ))}
          </div>
        </>
      )}

      {closed.length > 0 && (
        <>
          <h4 className="text-xs uppercase tracking-wider text-amber-800/70 font-semibold mb-2 mt-6">Closed</h4>
          <div className="space-y-2">
            {closed.map((q) => {
              const awardedVendor = vendors.find((v) => v.id === q.awardedTo);
              return (
                <div key={q.id} className="bg-amber-50/40 border border-amber-900/15 px-4 py-2 text-sm flex justify-between">
                  <div>
                    <span className="font-mono text-amber-700 text-xs">{q.quoteNo}</span>
                    <span className="ml-2 font-semibold text-amber-950">{q.itemName}</span>
                    <span className="ml-2 text-xs text-amber-800/70">{formatQty(q.qtyNeeded, q.unit)}</span>
                  </div>
                  <div className="text-xs text-amber-900">→ Awarded to <strong>{awardedVendor?.name || "—"}</strong></div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {showRFQ && <RFQDialog purchaseIndents={purchaseIndents} vendors={vendors} onCreate={(indentId, vendorIds) => { const r = onCreate(indentId, vendorIds); if (r.ok) setShowRFQ(false); }} onClose={() => setShowRFQ(false)} />}
    </div>
  );
}

function QuotationCard({ q, vendors, expanded, onToggle, onUpdate, onAward }) {
  const [awarding, setAwarding] = useState(null); // vendorId being awarded

  const quotedQuotes = q.quotes.filter((qu) => qu.ratePerUnit != null);
  // Score: lower price is better (50%), vendor quality (25%) + timeliness (25%)
  const scored = q.quotes.map((qu) => {
    const v = vendors.find((x) => x.id === qu.vendorId);
    const overallRating = v ? ((v.ratings?.quality || 0) + (v.ratings?.timeliness || 0) + (v.ratings?.accuracy || 0)) / 3 : 0;
    let score = 0;
    if (qu.ratePerUnit && quotedQuotes.length > 0) {
      const lowest = Math.min(...quotedQuotes.map((x) => x.ratePerUnit));
      const priceScore = (lowest / qu.ratePerUnit) * 5; // 5 if cheapest
      score = priceScore * 0.5 + overallRating * 0.5;
    }
    return { ...qu, vendor: v, overallRating, score: +score.toFixed(2) };
  });
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const best = sorted.find((s) => s.ratePerUnit != null);

  return (
    <div className="bg-amber-50/40 border border-amber-900/20">
      <button onClick={onToggle} className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-amber-50">
        <div>
          <span className="font-mono text-xs text-amber-700">{q.quoteNo}</span>
          <span className="ml-2 font-semibold text-amber-950">{q.itemName}</span>
          <span className="ml-2 text-xs text-amber-800/70">{formatQty(q.qtyNeeded, q.unit)}</span>
        </div>
        <div className="text-xs text-amber-800">
          {quotedQuotes.length}/{q.quotes.length} quotes received
          {best && <span className="ml-3 text-green-700 font-semibold">Best: {best.vendor?.name} @ ₹{best.ratePerUnit}</span>}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-amber-900/15 px-4 py-3">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-amber-900">
              <tr>
                <th className="text-left py-2">Vendor</th>
                <th className="text-center py-2">Rating</th>
                <th className="text-right py-2">Rate / {q.unit}</th>
                <th className="text-right py-2">Total</th>
                <th className="text-center py-2">Delivery</th>
                <th className="text-center py-2">Score</th>
                <th className="text-right py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((qu) => {
                const total = qu.ratePerUnit ? qu.ratePerUnit * q.qtyNeeded : null;
                const isLowest = qu.ratePerUnit && best && qu.ratePerUnit === best.ratePerUnit;
                return (
                  <tr key={qu.vendorId} className={`border-t border-amber-900/10 ${isLowest ? "bg-green-50" : ""}`}>
                    <td className="py-2">
                      <div className="font-semibold text-amber-950">{qu.vendor?.name || "?"}</div>
                      <div className="text-[10px] text-amber-700">{qu.vendor?.phone || ""}</div>
                    </td>
                    <td className="text-center"><StarRating value={qu.overallRating} small /></td>
                    <td className="py-2 text-right">
                      <input
                        type="number" step="0.01" value={qu.ratePerUnit ?? ""}
                        onChange={(e) => onUpdate(q.id, qu.vendorId, { ratePerUnit: parseFloat(e.target.value) || null })}
                        placeholder="—"
                        className="w-20 px-2 py-1 border border-amber-900/30 text-sm text-right tabular-nums"
                      />
                    </td>
                    <td className="py-2 text-right tabular-nums font-semibold text-amber-900">{total ? `₹${total.toLocaleString("en-IN", {maximumFractionDigits: 0})}` : "—"}</td>
                    <td className="py-2 text-center">
                      <input
                        type="number" value={qu.deliveryDays ?? ""}
                        onChange={(e) => onUpdate(q.id, qu.vendorId, { deliveryDays: parseInt(e.target.value) || null })}
                        placeholder="days"
                        className="w-12 px-1 py-1 border border-amber-900/30 text-xs text-center"
                      /> <span className="text-[10px]">d</span>
                    </td>
                    <td className="py-2 text-center">
                      {qu.score > 0 && <span className={`font-bold tabular-nums ${qu.score === Math.max(...sorted.map(s => s.score)) ? "text-green-700" : "text-amber-900"}`}>{qu.score}</span>}
                    </td>
                    <td className="py-2 text-right">
                      {qu.ratePerUnit && (
                        <button onClick={() => setAwarding(qu.vendorId)} className="text-xs px-2 py-1 bg-amber-900 text-amber-50">Award</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p className="text-[11px] text-amber-700/70 italic mt-2">
            Score = 50% inverse-price + 50% vendor rating. The cheapest vendor with good ratings wins.
          </p>
        </div>
      )}

      {awarding && <AwardDialog quotation={q} vendorId={awarding} vendors={vendors} onConfirm={(d) => { onAward(q.id, awarding, d); setAwarding(null); }} onClose={() => setAwarding(null)} />}
    </div>
  );
}

function AwardDialog({ quotation, vendorId, vendors, onConfirm, onClose }) {
  const vendor = vendors.find((v) => v.id === vendorId);
  const quote = quotation.quotes.find((q) => q.vendorId === vendorId);
  const [issuedBy, setIssuedBy] = useState("");
  const [expectedBy, setExpectedBy] = useState(quote?.deliveryDays ? new Date(Date.now() + quote.deliveryDays * 86400000).toISOString().split("T")[0] : "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!issuedBy.trim()) { setError("Issued-by name is required."); return; }
    onConfirm({ issuedBy, expectedBy, notes });
  };

  return (
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-amber-50 border-2 border-amber-900/40 max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-amber-950 mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Confirm Award & Generate PO</h3>
        <p className="text-xs text-amber-800/70 mb-4">
          {quotation.itemName} · {formatQty(quotation.qtyNeeded, quotation.unit)} → <strong>{vendor?.name}</strong> @ ₹{quote?.ratePerUnit}/{quotation.unit}
          <br/><span className="text-amber-900 font-semibold">Total: ₹{(quote.ratePerUnit * quotation.qtyNeeded).toLocaleString("en-IN", {maximumFractionDigits: 0})}</span>
        </p>

        <div className="space-y-3">
          <Field label="Issued By *" value={issuedBy} onChange={setIssuedBy} placeholder="Store keeper / officer" />
          <div>
            <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Expected By</label>
            <input type="date" value={expectedBy} onChange={(e) => setExpectedBy(e.target.value)} className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm" placeholder="Special instructions for vendor" />
          </div>
        </div>

        {error && <div className="mt-3 bg-red-50 border-l-4 border-red-700 px-3 py-2 text-xs text-red-900">{error}</div>}

        <div className="flex gap-2 mt-5 pt-4 border-t border-amber-900/15">
          <button onClick={submit} className="flex-1 bg-amber-900 text-amber-50 py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
            <ShoppingCart className="w-4 h-4" /> Generate PO
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-amber-900/40 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function RFQDialog({ purchaseIndents, vendors, onCreate, onClose }) {
  const open = purchaseIndents.filter((p) => p.status === "Open");
  const [indentId, setIndentId] = useState(open[0]?.id || "");
  const [selectedVendorIds, setSelectedVendorIds] = useState([]);
  const [error, setError] = useState("");

  const selectedIndent = open.find((p) => p.id === indentId);
  // Suggest vendors who supply this item
  const relevantVendors = selectedIndent ? vendors.filter((v) => v.itemIds?.includes(selectedIndent.itemId)) : [];
  const otherVendors = selectedIndent ? vendors.filter((v) => !v.itemIds?.includes(selectedIndent.itemId)) : vendors;

  const toggle = (id) => setSelectedVendorIds((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  const submit = () => {
    if (!indentId) { setError("Select an indent."); return; }
    if (selectedVendorIds.length === 0) { setError("Select at least one vendor."); return; }
    onCreate(indentId, selectedVendorIds);
  };

  return (
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-amber-50 border-2 border-amber-900/40 max-w-lg w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-amber-950 mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>New Quotation Request</h3>

        {open.length === 0 ? (
          <p className="text-sm text-amber-800/70 italic">No open indents to quote against. Generate indents from the Inventory or Store sections first.</p>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Indent *</label>
              <select value={indentId} onChange={(e) => setIndentId(e.target.value)} className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm">
                {open.map((p) => <option key={p.id} value={p.id}>{p.indentNo} · {p.itemName} ({formatQty(p.qtyNeeded, p.unit)})</option>)}
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-xs uppercase tracking-wider text-amber-900 mb-2">Vendors to Quote</label>
              {relevantVendors.length > 0 && (
                <div className="bg-green-50/50 border border-green-300 p-2 mb-2">
                  <div className="text-[10px] uppercase tracking-wider text-green-800 font-semibold mb-1">Supplies This Item</div>
                  {relevantVendors.map((v) => (
                    <label key={v.id} className="flex items-center gap-2 py-1 text-sm cursor-pointer">
                      <input type="checkbox" checked={selectedVendorIds.includes(v.id)} onChange={() => toggle(v.id)} />
                      <span className="font-semibold text-amber-950">{v.name}</span>
                      {v.defaultRates?.[selectedIndent?.itemId] && <span className="text-xs text-amber-700">@ ₹{v.defaultRates[selectedIndent.itemId]}</span>}
                      <StarRating value={((v.ratings?.quality||0)+(v.ratings?.timeliness||0)+(v.ratings?.accuracy||0))/3} small />
                    </label>
                  ))}
                </div>
              )}
              {otherVendors.length > 0 && (
                <details className="border border-amber-900/20 p-2">
                  <summary className="text-[10px] uppercase tracking-wider text-amber-700 cursor-pointer">Other Vendors ({otherVendors.length})</summary>
                  {otherVendors.map((v) => (
                    <label key={v.id} className="flex items-center gap-2 py-1 text-sm cursor-pointer">
                      <input type="checkbox" checked={selectedVendorIds.includes(v.id)} onChange={() => toggle(v.id)} />
                      <span className="text-amber-950">{v.name}</span>
                    </label>
                  ))}
                </details>
              )}
            </div>

            {error && <div className="mt-3 bg-red-50 border-l-4 border-red-700 px-3 py-2 text-xs text-red-900">{error}</div>}

            <div className="flex gap-2 mt-5 pt-4 border-t border-amber-900/15">
              <button onClick={submit} className="flex-1 bg-amber-900 text-amber-50 py-2.5 text-sm font-semibold">Send to {selectedVendorIds.length} vendors</button>
              <button onClick={onClose} className="px-4 py-2 border border-amber-900/40 text-sm">Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ----- Purchase Orders -----
function PurchaseOrderView({ purchaseOrders, vendors, grns }) {
  const [printing, setPrinting] = useState(null);

  if (purchaseOrders.length === 0) {
    return <div className="text-center py-12 text-amber-800/60"><ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-40" /><p className="text-sm italic">No POs issued yet.</p></div>;
  }

  return (
    <div>
      <div className="bg-amber-50/40 border border-amber-900/15 overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-amber-100/60 text-amber-900 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-3 py-3">PO No.</th>
              <th className="text-left px-3 py-3">Vendor</th>
              <th className="text-left px-3 py-3">Items</th>
              <th className="text-right px-3 py-3">Amount</th>
              <th className="text-left px-3 py-3">Status</th>
              <th className="text-left px-3 py-3">Issued / Expected</th>
              <th className="text-right px-3 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.map((p) => {
              const grn = grns.find((g) => g.poId === p.id);
              return (
                <tr key={p.id} className="border-t border-amber-900/10">
                  <td className="px-3 py-3 font-mono text-xs text-amber-700">{p.poNo}</td>
                  <td className="px-3 py-3 font-semibold text-amber-950">{p.vendorName}</td>
                  <td className="px-3 py-3 text-xs text-amber-900">{p.items.map((i) => `${i.name} (${formatQty(i.qty, i.unit)})`).join(", ")}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-bold text-amber-950">₹{p.totalAmount.toLocaleString("en-IN")}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-1 ${
                      p.status === "Received" ? "bg-green-100 text-green-800" :
                      p.status === "PartiallyReceived" ? "bg-orange-100 text-orange-800" :
                      p.status === "Cancelled" ? "bg-stone-200 text-stone-700" : "bg-blue-100 text-blue-900"
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-3 py-3 text-xs text-amber-800/80">
                    {new Date(p.issuedAt).toLocaleDateString("en-IN")}
                    {p.expectedBy && <div className="text-[10px]">Exp: {p.expectedBy}</div>}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button onClick={() => setPrinting(p)} className="text-xs px-2 py-1 border border-amber-900/40 hover:bg-amber-100 flex items-center gap-1 ml-auto">
                      <Printer className="w-3 h-3" /> Print
                    </button>
                    {grn && <div className="text-[10px] text-green-700 mt-1">GRN: {grn.grnNo}</div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {printing && <POPrint po={printing} vendor={vendors.find((v) => v.id === printing.vendorId)} onClose={() => setPrinting(null)} />}
    </div>
  );
}

function POPrint({ po, vendor, onClose }) {
  return (
    <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center z-50 p-4 print:bg-white print:p-0 print:static" onClick={onClose}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #po-print, #po-print * { visibility: visible; }
          #po-print { position: absolute; left: 0; top: 0; width: 100%; background: white !important; }
          #po-print .no-print { display: none !important; }
        }
        @page { margin: 12mm; size: A4; }
      `}</style>
      <div id="po-print" onClick={(e) => e.stopPropagation()} className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl print:max-h-none print:max-w-none print:shadow-none" style={{ fontFamily: "Georgia, serif" }}>
        <div className="no-print bg-amber-900 text-amber-50 px-4 py-2 flex items-center justify-between sticky top-0 z-10">
          <span className="text-sm uppercase tracking-wider">Purchase Order</span>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="bg-amber-50 text-amber-900 px-3 py-1 text-xs font-semibold flex items-center gap-1"><Printer className="w-3 h-3"/> Print</button>
            <button onClick={onClose} className="text-amber-50 p-1"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="p-8">
          <div className="text-center border-b-2 border-double border-stone-800 pb-4 mb-4">
            <div className="text-xs">✦ ॐ ✦</div>
            <div className="text-2xl font-bold tracking-wider mt-1">NELLIAKATTU OUSHADHEESWARI TEMPLE</div>
            <div className="text-xs mt-0.5">Kizhakombu PO, Koothattukulam — 686662</div>
            <div className="mt-3 text-base font-semibold uppercase tracking-[0.3em]">Purchase Order</div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-4 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wider text-stone-600 mb-1">Vendor</div>
              <div className="font-semibold">{vendor?.name}</div>
              {vendor?.contact && <div className="text-xs">Attn: {vendor.contact}</div>}
              {vendor?.address && <div className="text-xs">{vendor.address}</div>}
              {vendor?.phone && <div className="text-xs">{vendor.phone}</div>}
              {vendor?.gst && <div className="text-xs font-mono">GST: {vendor.gst}</div>}
            </div>
            <div className="text-right">
              <div><strong>PO No:</strong> {po.poNo}</div>
              <div><strong>Date:</strong> {new Date(po.issuedAt).toLocaleDateString("en-IN")}</div>
              {po.expectedBy && <div><strong>Expected:</strong> {po.expectedBy}</div>}
              {po.paymentTerms && <div><strong>Terms:</strong> {po.paymentTerms}</div>}
            </div>
          </div>

          <table className="w-full text-sm border-2 border-stone-800 mb-4">
            <thead className="bg-stone-100">
              <tr className="border-b-2 border-stone-800">
                <th className="text-left p-2">#</th>
                <th className="text-left p-2">Description</th>
                <th className="text-right p-2">Qty</th>
                <th className="text-right p-2">Rate</th>
                <th className="text-right p-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {po.items.map((it, idx) => (
                <tr key={idx} className="border-b border-stone-300">
                  <td className="p-2">{idx + 1}</td>
                  <td className="p-2">{it.name}</td>
                  <td className="p-2 text-right tabular-nums">{formatQty(it.qty, it.unit)}</td>
                  <td className="p-2 text-right tabular-nums">₹{it.ratePerUnit}</td>
                  <td className="p-2 text-right tabular-nums">₹{(it.qty * it.ratePerUnit).toLocaleString("en-IN", {maximumFractionDigits: 2})}</td>
                </tr>
              ))}
              <tr className="font-bold border-t-2 border-stone-800">
                <td colSpan={4} className="p-2 text-right">TOTAL</td>
                <td className="p-2 text-right tabular-nums text-base">₹ {po.totalAmount.toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>

          {po.notes && <div className="text-xs mb-4 p-2 border border-stone-300"><strong>Notes:</strong> {po.notes}</div>}

          <div className="text-xs italic text-stone-700 mb-6">
            Please supply the above items as per the agreed rates and terms. Submit invoice referencing this PO number.
          </div>

          <div className="grid grid-cols-2 gap-8 mt-12 pt-4 border-t border-dashed border-stone-400 text-xs">
            <div>
              <div className="border-b border-stone-400 pb-3 mb-1 font-semibold">{po.issuedBy}</div>
              <div className="text-stone-600">Authorized By</div>
            </div>
            <div className="text-right">
              <div className="border-b border-stone-400 pb-3 mb-1">&nbsp;</div>
              <div className="text-stone-600">Vendor Acknowledgement</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----- GRN -----
function GRNView({ purchaseOrders, grns, onCreate }) {
  const [receiving, setReceiving] = useState(null);
  const eligible = purchaseOrders.filter((p) => p.status === "Issued" || p.status === "PartiallyReceived");

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-amber-950" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Goods Receipt Notes</h3>
      </div>

      {eligible.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs uppercase tracking-wider text-amber-900 font-semibold mb-2">Awaiting Receipt</h4>
          <div className="space-y-2">
            {eligible.map((po) => (
              <div key={po.id} className="bg-amber-50/40 border border-amber-900/20 px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-amber-700">{po.poNo}</span>
                  <span className="ml-2 font-semibold text-amber-950">{po.vendorName}</span>
                  <div className="text-xs text-amber-800 mt-0.5">{po.items.map((i) => `${i.name} (${formatQty(i.qty, i.unit)})`).join(", ")}</div>
                </div>
                <button onClick={() => setReceiving(po)} className="bg-green-700 text-white px-3 py-1.5 text-xs flex items-center gap-1">
                  <FileCheck className="w-3 h-3" /> Receive Goods
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {grns.length > 0 && (
        <>
          <h4 className="text-xs uppercase tracking-wider text-amber-900 font-semibold mb-2 mt-4">GRN Register</h4>
          <div className="bg-amber-50/40 border border-amber-900/15 overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-amber-100/60 text-amber-900 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-3 py-3">GRN No.</th>
                  <th className="text-left px-3 py-3">PO</th>
                  <th className="text-left px-3 py-3">Vendor</th>
                  <th className="text-left px-3 py-3">Items (Ordered → Received)</th>
                  <th className="text-left px-3 py-3">Date</th>
                  <th className="text-left px-3 py-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {grns.map((g) => (
                  <tr key={g.id} className={`border-t border-amber-900/10 ${g.hasShort ? "bg-orange-50" : ""}`}>
                    <td className="px-3 py-3 font-mono text-xs text-amber-700">{g.grnNo}</td>
                    <td className="px-3 py-3 font-mono text-xs text-amber-700">{g.poNo}</td>
                    <td className="px-3 py-3 font-semibold text-amber-950">{g.vendorName}</td>
                    <td className="px-3 py-3 text-xs">
                      {g.items.map((i, idx) => (
                        <div key={idx} className={i.variance < 0 ? "text-red-700 font-semibold" : "text-amber-900"}>
                          {i.name}: {formatQty(i.qtyOrdered, i.unit)} → {formatQty(i.qtyReceived, i.unit)} {i.variance !== 0 && <span>({i.variance > 0 ? "+" : ""}{formatQty(Math.abs(i.variance), i.unit)})</span>}
                        </div>
                      ))}
                    </td>
                    <td className="px-3 py-3 text-xs text-amber-800/80 tabular-nums">{new Date(g.receivedAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</td>
                    <td className="px-3 py-3 text-xs italic">{g.remark || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {receiving && <GRNDialog po={receiving} onConfirm={(d) => { const r = onCreate(receiving.id, d); if (r.ok) setReceiving(null); }} onClose={() => setReceiving(null)} />}
    </div>
  );
}

function GRNDialog({ po, onConfirm, onClose }) {
  const [items, setItems] = useState(po.items.map((i) => ({ itemId: i.itemId, qtyReceived: i.qty, condition: "Good", remark: "" })));
  const [receivedBy, setReceivedBy] = useState("");
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");

  const update = (itemId, patch) => setItems((xs) => xs.map((x) => (x.itemId === itemId ? { ...x, ...patch } : x)));

  const submit = () => {
    if (!receivedBy.trim()) { setError("Received-by name required."); return; }
    onConfirm({ items, receivedBy, remark });
  };

  return (
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-amber-50 border-2 border-amber-900/40 max-w-xl w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-amber-950 mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Receive Goods · {po.poNo}</h3>
        <p className="text-xs text-amber-800/70 mb-4">From <strong>{po.vendorName}</strong> · Compare ordered vs received per line.</p>

        <div className="space-y-2 mb-4">
          {po.items.map((poIt) => {
            const recv = items.find((x) => x.itemId === poIt.itemId);
            const variance = (recv?.qtyReceived ?? 0) - poIt.qty;
            return (
              <div key={poIt.itemId} className={`p-3 border ${variance < 0 ? "bg-red-50 border-red-300" : variance > 0 ? "bg-green-50 border-green-300" : "bg-white border-amber-900/15"}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-amber-950">{poIt.name}</div>
                    <div className="text-xs text-amber-800/70">Ordered: {formatQty(poIt.qty, poIt.unit)} @ ₹{poIt.ratePerUnit}</div>
                  </div>
                  {variance !== 0 && (
                    <span className={`text-xs px-2 py-0.5 ${variance < 0 ? "bg-red-200 text-red-900" : "bg-green-200 text-green-900"}`}>
                      {variance > 0 ? "+" : ""}{formatQty(variance, poIt.unit)}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-amber-800 mb-0.5">Received Qty</label>
                    <input type="number" step="0.001" value={recv?.qtyReceived ?? ""} onChange={(e) => update(poIt.itemId, { qtyReceived: parseFloat(e.target.value) || 0 })} className="w-full px-2 py-1 border border-amber-900/30 text-sm tabular-nums" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-amber-800 mb-0.5">Condition</label>
                    <select value={recv?.condition} onChange={(e) => update(poIt.itemId, { condition: e.target.value })} className="w-full px-2 py-1 border border-amber-900/30 text-sm">
                      <option>Excellent</option><option>Good</option><option>Damaged</option><option>Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-amber-800 mb-0.5">Remark</label>
                    <input type="text" value={recv?.remark} onChange={(e) => update(poIt.itemId, { remark: e.target.value })} placeholder="opt." className="w-full px-2 py-1 border border-amber-900/30 text-sm" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Received By *" value={receivedBy} onChange={setReceivedBy} placeholder="Store keeper" />
          <Field label="Overall Remark" value={remark} onChange={setRemark} placeholder="Optional notes about delivery" />
        </div>

        {error && <div className="mt-3 bg-red-50 border-l-4 border-red-700 px-3 py-2 text-xs text-red-900">{error}</div>}

        <div className="flex gap-2 mt-5 pt-4 border-t border-amber-900/15">
          <button onClick={submit} className="flex-1 bg-green-700 text-white py-2.5 text-sm font-semibold flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Confirm GRN</button>
          <button onClick={onClose} className="px-4 py-2 border border-amber-900/40 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ----- Bills with OCR -----
function BillView({ bills, purchaseOrders, grns, vendors, onCreate, onVerify, onPaid }) {
  const [adding, setAdding] = useState(false);
  const [paying, setPaying] = useState(null);
  const [viewing, setViewing] = useState(null);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-amber-950" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Vendor Bills & Reconciliation</h3>
        <button onClick={() => setAdding(true)} className="bg-amber-900 text-amber-50 px-4 py-2 text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Upload Bill</button>
      </div>

      {bills.length === 0 ? (
        <div className="text-center py-12 text-amber-800/60"><Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" /><p className="text-sm italic">No bills yet. Upload to start tracking vendor invoices.</p></div>
      ) : (
        <div className="bg-amber-50/40 border border-amber-900/15 overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead className="bg-amber-100/60 text-amber-900 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-3 py-3">Bill No.</th>
                <th className="text-left px-3 py-3">Vendor</th>
                <th className="text-left px-3 py-3">PO Match</th>
                <th className="text-right px-3 py-3">Amount</th>
                <th className="text-left px-3 py-3">Status</th>
                <th className="text-left px-3 py-3">Date</th>
                <th className="text-right px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => {
                const po = purchaseOrders.find((p) => p.id === b.poId);
                const variance = po ? b.totalAmount - po.totalAmount : 0;
                return (
                  <tr key={b.id} className="border-t border-amber-900/10">
                    <td className="px-3 py-3">
                      <div className="font-mono text-xs text-amber-700">{b.billNo}</div>
                      {b.vendorBillNo && <div className="text-[10px] text-amber-700">Vendor: {b.vendorBillNo}</div>}
                    </td>
                    <td className="px-3 py-3 font-semibold text-amber-950">{vendors.find((v) => v.id === b.vendorId)?.name || "—"}</td>
                    <td className="px-3 py-3 text-xs">
                      {po ? (
                        <>
                          <div className="font-mono text-amber-700">{po.poNo}</div>
                          {variance !== 0 && <div className={`text-[10px] font-semibold ${variance > 0 ? "text-red-700" : "text-green-700"}`}>{variance > 0 ? "+" : ""}₹{Math.abs(variance).toLocaleString("en-IN", {maximumFractionDigits: 0})}</div>}
                        </>
                      ) : <span className="italic text-amber-700/60">—</span>}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-bold text-amber-950">₹{b.totalAmount.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-1 ${
                        b.status === "Paid" ? "bg-green-100 text-green-800" :
                        b.status === "Verified" ? "bg-blue-100 text-blue-900" :
                        b.status === "Disputed" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"
                      }`}>{b.status}</span>
                    </td>
                    <td className="px-3 py-3 text-xs text-amber-800/80 tabular-nums">{b.billDate || new Date(b.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="px-3 py-3 text-right space-x-1">
                      <button onClick={() => setViewing(b)} className="text-xs px-2 py-1 border border-amber-900/40 hover:bg-amber-100">View</button>
                      {b.status === "Pending" && <button onClick={() => onVerify(b.id, "Verified")} className="text-xs px-2 py-1 bg-blue-700 text-white">Verify</button>}
                      {b.status === "Verified" && <button onClick={() => setPaying(b)} className="text-xs px-2 py-1 bg-green-700 text-white">Pay</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {adding && <BillUploadDialog vendors={vendors} purchaseOrders={purchaseOrders} grns={grns} onSubmit={(data) => { const r = onCreate(data); if (r.ok) setAdding(false); }} onClose={() => setAdding(false)} />}
      {paying && <PayDialog bill={paying} onConfirm={(d) => { onPaid(paying.id, d); setPaying(null); }} onClose={() => setPaying(null)} />}
      {viewing && <BillViewer bill={viewing} po={purchaseOrders.find((p) => p.id === viewing.poId)} onClose={() => setViewing(null)} />}
    </div>
  );
}

function BillUploadDialog({ vendors, purchaseOrders, grns, onSubmit, onClose }) {
  const [vendorId, setVendorId] = useState("");
  const [poId, setPoId] = useState("");
  const [vendorBillNo, setVendorBillNo] = useState("");
  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0]);
  const [totalAmount, setTotalAmount] = useState("");
  const [scanDataUrl, setScanDataUrl] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [ocrRunning, setOcrRunning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const matchingPOs = vendorId ? purchaseOrders.filter((p) => p.vendorId === vendorId) : [];

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Read file as data URL for preview + storage
    const reader = new FileReader();
    reader.onload = async (ev) => {
      setScanDataUrl(ev.target.result);
      // Run OCR on images only
      if (file.type.startsWith("image/")) {
        await runOCR(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const runOCR = async (dataUrl) => {
    setOcrRunning(true);
    setOcrProgress(0);
    try {
      // Load Tesseract.js from CDN if not already loaded
      if (!window.Tesseract) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.0.4/tesseract.min.js";
          script.onload = resolve;
          script.onerror = () => reject(new Error("Failed to load OCR library"));
          document.head.appendChild(script);
        });
      }
      const result = await window.Tesseract.recognize(dataUrl, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") setOcrProgress(Math.round(m.progress * 100));
        },
      });
      const text = result.data.text;
      setOcrText(text);
      // Try to extract a total amount: look for "Total", "Grand Total", or large number patterns
      const totalMatch = text.match(/(?:total|grand\s*total|amount)[\s:₹\.rsRS]*([0-9,]+(?:\.[0-9]{1,2})?)/i);
      if (totalMatch) {
        const num = parseFloat(totalMatch[1].replace(/,/g, ""));
        if (!isNaN(num) && num > 10) setTotalAmount(String(num));
      }
      // Try to extract bill number
      const billMatch = text.match(/(?:bill|invoice|inv)[\s.#:no\-]*([A-Z0-9\-\/]{3,})/i);
      if (billMatch) setVendorBillNo(billMatch[1]);
    } catch (err) {
      setError("OCR failed: " + err.message);
    } finally {
      setOcrRunning(false);
    }
  };

  const submit = () => {
    if (!vendorId) { setError("Select vendor."); return; }
    if (!totalAmount) { setError("Enter total amount."); return; }
    onSubmit({
      vendorId, poId: poId || null, vendorBillNo, billDate,
      totalAmount: parseFloat(totalAmount),
      scanDataUrl, ocrText,
    });
  };

  return (
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-amber-50 border-2 border-amber-900/40 max-w-2xl w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-amber-950 mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Upload Vendor Bill</h3>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Left: scan + OCR */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-amber-900 mb-2">Scan / Photo (image or PDF)</label>
            <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFile} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-amber-900/40 p-4 hover:bg-amber-100/50 flex flex-col items-center gap-2">
              {scanDataUrl ? (
                scanDataUrl.startsWith("data:image") ? (
                  <img src={scanDataUrl} alt="bill scan" className="max-h-40 border border-amber-900/20" />
                ) : (
                  <div className="text-amber-900">PDF attached</div>
                )
              ) : (
                <>
                  <Upload className="w-8 h-8 text-amber-700" />
                  <span className="text-xs text-amber-700">Click to upload bill scan</span>
                </>
              )}
            </button>
            {ocrRunning && (
              <div className="mt-2 text-xs text-amber-900 flex items-center gap-2">
                <Loader className="w-3 h-3 animate-spin" /> Running OCR... {ocrProgress}%
              </div>
            )}
            {ocrText && !ocrRunning && (
              <details className="mt-2">
                <summary className="text-xs text-amber-700 cursor-pointer flex items-center gap-1"><Scan className="w-3 h-3" /> OCR extracted text</summary>
                <pre className="text-[10px] bg-stone-50 border border-stone-300 p-2 mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap">{ocrText}</pre>
              </details>
            )}
          </div>

          {/* Right: fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Vendor *</label>
              <select value={vendorId} onChange={(e) => { setVendorId(e.target.value); setPoId(""); }} className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm">
                <option value="">— Select —</option>
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            {matchingPOs.length > 0 && (
              <div>
                <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Match to PO</label>
                <select value={poId} onChange={(e) => setPoId(e.target.value)} className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm">
                  <option value="">— Optional —</option>
                  {matchingPOs.map((p) => <option key={p.id} value={p.id}>{p.poNo} · ₹{p.totalAmount.toLocaleString("en-IN")} · {p.status}</option>)}
                </select>
              </div>
            )}
            <Field label="Vendor's Bill Number" value={vendorBillNo} onChange={setVendorBillNo} placeholder="e.g. INV/2026/4321" />
            <div>
              <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Bill Date</label>
              <input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Total Amount (₹) *</label>
              <input type="number" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm tabular-nums" />
              {ocrText && totalAmount && <div className="text-[10px] text-green-700 mt-1">✓ Auto-extracted from scan — verify before saving</div>}
            </div>

            {poId && (() => {
              const po = matchingPOs.find((p) => p.id === poId);
              const variance = parseFloat(totalAmount || 0) - po.totalAmount;
              return (
                <div className={`text-xs p-2 border ${Math.abs(variance) < 1 ? "border-green-300 bg-green-50" : "border-orange-300 bg-orange-50"}`}>
                  <div>PO total: ₹{po.totalAmount.toLocaleString("en-IN")}</div>
                  <div>Bill total: ₹{(parseFloat(totalAmount) || 0).toLocaleString("en-IN")}</div>
                  <div className={`font-semibold ${Math.abs(variance) < 1 ? "text-green-800" : "text-orange-800"}`}>Variance: {variance > 0 ? "+" : ""}₹{variance.toFixed(2)}</div>
                </div>
              );
            })()}
          </div>
        </div>

        {error && <div className="mt-3 bg-red-50 border-l-4 border-red-700 px-3 py-2 text-xs text-red-900">{error}</div>}

        <div className="flex gap-2 mt-5 pt-4 border-t border-amber-900/15">
          <button onClick={submit} className="flex-1 bg-amber-900 text-amber-50 py-2.5 text-sm font-semibold">Save Bill</button>
          <button onClick={onClose} className="px-4 py-2 border border-amber-900/40 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function PayDialog({ bill, onConfirm, onClose }) {
  const [mode, setMode] = useState("Cash");
  const [ref, setRef] = useState("");
  return (
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-amber-50 border-2 border-amber-900/40 max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-amber-950 mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Mark Bill Paid</h3>
        <p className="text-sm text-amber-800 mb-4">{bill.billNo} · ₹{bill.totalAmount.toLocaleString("en-IN")}</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Payment Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm">
              <option>Cash</option><option>Cheque</option><option>NEFT</option><option>UPI</option><option>Card</option>
            </select>
          </div>
          <Field label="Reference / Cheque No." value={ref} onChange={setRef} placeholder="Optional" />
        </div>
        <div className="flex gap-2 mt-5 pt-4 border-t border-amber-900/15">
          <button onClick={() => onConfirm({ mode, ref })} className="flex-1 bg-green-700 text-white py-2.5 text-sm font-semibold">Confirm Payment</button>
          <button onClick={onClose} className="px-4 py-2 border border-amber-900/40 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function BillViewer({ bill, po, onClose }) {
  return (
    <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-amber-50 border-2 border-amber-900/40 max-w-2xl w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-xl font-bold text-amber-950" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{bill.billNo}</h3>
            <p className="text-xs text-amber-800/70">Vendor bill {bill.vendorBillNo} · {bill.billDate}</p>
          </div>
          <button onClick={onClose} className="p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {bill.scanDataUrl && (
            <div>
              <div className="text-xs uppercase tracking-wider text-amber-900 mb-1">Scan</div>
              {bill.scanDataUrl.startsWith("data:image") ? (
                <img src={bill.scanDataUrl} alt="bill" className="w-full border border-amber-900/30" />
              ) : (
                <a href={bill.scanDataUrl} target="_blank" rel="noreferrer" className="text-amber-900 underline text-sm">Open PDF</a>
              )}
            </div>
          )}
          <div className="space-y-2 text-sm">
            <div><strong>Status:</strong> {bill.status}</div>
            <div><strong>Amount:</strong> ₹{bill.totalAmount.toLocaleString("en-IN")}</div>
            {po && (
              <>
                <div><strong>PO:</strong> {po.poNo} · ₹{po.totalAmount.toLocaleString("en-IN")}</div>
                {Math.abs(bill.totalAmount - po.totalAmount) > 0.01 && (
                  <div className="text-orange-800"><strong>Variance:</strong> {bill.totalAmount > po.totalAmount ? "+" : ""}₹{(bill.totalAmount - po.totalAmount).toFixed(2)}</div>
                )}
              </>
            )}
            {bill.paidAt && <div><strong>Paid:</strong> {new Date(bill.paidAt).toLocaleDateString("en-IN")} via {bill.paymentMode} {bill.paymentRef && `· ${bill.paymentRef}`}</div>}
            {bill.ocrText && (
              <details>
                <summary className="cursor-pointer text-amber-700 text-xs">OCR text</summary>
                <pre className="text-[10px] bg-stone-50 p-2 mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap">{bill.ocrText}</pre>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

