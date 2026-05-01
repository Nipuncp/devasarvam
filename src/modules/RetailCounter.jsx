import { useState } from "react";
import { Package, Receipt, Check, X, AlertTriangle, Printer, Trash2, ClipboardList, ShoppingCart, Truck } from "lucide-react";
import { Card, Field, StoreStat } from "../components/ui.jsx";

// =================== RETAIL COUNTER ===================
export function RetailCounter({ retailItems, retailSales, sellRetail, raiseCounterRequisition, receiveCounterStock }) {
  const [view, setView] = useState("sell"); // sell | sales | stock | refill
  const [cart, setCart] = useState([]); // [{ itemId, qty }]
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [customerName, setCustomerName] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [lastSale, setLastSale] = useState(null); // for receipt printing
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const categories = ["All", ...new Set(retailItems.map((r) => r.category))];

  const filtered = retailItems.filter((r) => {
    if (categoryFilter !== "All" && r.category !== categoryFilter) return false;
    if (searchTerm && !`${r.name} ${r.brand}`.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const lowStockItems = retailItems.filter((r) => r.counterQty <= r.counterReorder);

  const addToCart = (item) => {
    if (item.counterQty <= 0) {
      setFeedback({ ok: false, msg: `Out of stock: ${item.name}` });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    setCart((c) => {
      const existing = c.find((x) => x.itemId === item.id);
      if (existing) {
        // Don't exceed available stock
        if (existing.qty + 1 > item.counterQty) {
          setFeedback({ ok: false, msg: `Only ${item.counterQty} left in counter for ${item.name}` });
          setTimeout(() => setFeedback(null), 3000);
          return c;
        }
        return c.map((x) => (x.itemId === item.id ? { ...x, qty: x.qty + 1 } : x));
      }
      return [...c, { itemId: item.id, qty: 1 }];
    });
  };

  const updateCartQty = (itemId, qty) => {
    const item = retailItems.find((r) => r.id === itemId);
    if (!item) return;
    const n = parseInt(qty);
    if (isNaN(n) || n <= 0) {
      setCart((c) => c.filter((x) => x.itemId !== itemId));
      return;
    }
    if (n > item.counterQty) {
      setFeedback({ ok: false, msg: `Only ${item.counterQty} available` });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    setCart((c) => c.map((x) => (x.itemId === itemId ? { ...x, qty: n } : x)));
  };

  const removeFromCart = (itemId) => setCart((c) => c.filter((x) => x.itemId !== itemId));
  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((s, c) => {
    const item = retailItems.find((r) => r.id === c.itemId);
    return s + (item?.mrp || 0) * c.qty;
  }, 0);

  const submitSale = () => {
    if (cart.length === 0) {
      setFeedback({ ok: false, msg: "Cart is empty." });
      return;
    }
    const r = sellRetail(cart, paymentMode, customerName);
    setFeedback(r);
    if (r.ok) {
      setLastSale({ billNo: r.billNo, time: r.ts, total: r.total, lines: r.lines, paymentMode: r.paymentMode, customerName: r.customerName });
      setCart([]);
      setCustomerName("");
    }
    setTimeout(() => setFeedback(null), 5000);
  };

  // Today's sales summary
  const todayStr = new Date().toDateString();
  const todaySales = retailSales.filter((s) => new Date(s.time).toDateString() === todayStr);
  const todayTotal = todaySales.reduce((s, x) => s + x.total, 0);
  const todayMargin = todaySales.reduce((s, x) => s + x.margin, 0);
  const paymentBreakdown = todaySales.reduce((acc, s) => {
    acc[s.paymentMode] = (acc[s.paymentMode] || 0) + s.total;
    return acc;
  }, {});

  return (
    <>
      {/* Stats row */}
      <div className="grid sm:grid-cols-4 gap-3 mb-5">
        <StoreStat label="Today's Sales" value={`₹${todayTotal.toLocaleString("en-IN")}`} sub={`${todaySales.length} bills`} accent />
        <StoreStat label="Today's Margin" value={`₹${todayMargin.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} sub={todayTotal > 0 ? `${((todayMargin/todayTotal)*100).toFixed(1)}%` : "—"} />
        <StoreStat label="Items in Counter" value={retailItems.length} sub={`${lowStockItems.length} low`} />
        <StoreStat label="Cart" value={cart.length} sub={`₹${cartTotal}`} />
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-5 border-b border-amber-900/20 overflow-x-auto">
        {[
          { id: "sell", label: "Sell", icon: ShoppingCart },
          { id: "sales", label: `Today's Sales (${todaySales.length})`, icon: Receipt },
          { id: "stock", label: `Counter Stock${lowStockItems.length > 0 ? ` · ${lowStockItems.length} low` : ""}`, icon: Package },
          { id: "refill", label: "Refill from Store", icon: Truck },
        ].map((t) => {
          const Ic = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`flex items-center gap-2 px-3 py-2 text-sm whitespace-nowrap border-b-2 ${
                view === t.id ? "border-amber-900 text-amber-950 font-semibold" : "border-transparent text-amber-800/70"
              }`}
            >
              <Ic className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* SELL VIEW */}
      {view === "sell" && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Catalog */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex gap-2 flex-wrap">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search item or brand..."
                className="flex-1 min-w-[200px] bg-white/60 border border-amber-900/30 px-3 py-2 text-sm focus:border-amber-900 focus:outline-none"
              />
              <div className="flex gap-1 overflow-x-auto">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategoryFilter(c)}
                    className={`text-xs px-3 py-1.5 whitespace-nowrap ${categoryFilter === c ? "bg-amber-900 text-amber-50" : "border border-amber-900/30 text-amber-900 hover:bg-amber-100"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              {filtered.map((item) => {
                const isLow = item.counterQty <= item.counterReorder;
                const isOut = item.counterQty <= 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    disabled={isOut}
                    className={`text-left p-3 border transition-colors ${
                      isOut ? "bg-stone-100 border-stone-300 opacity-60 cursor-not-allowed" :
                      "bg-white border-amber-900/20 hover:border-amber-900 hover:bg-amber-50"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-amber-950 text-sm">{item.name}</div>
                        <div className="text-xs text-amber-700">{item.brand !== "—" ? `${item.brand} · ` : ""}{item.packSize}</div>
                        {item.malayalam && <div className="text-[10px] text-amber-800/70" style={{ fontFamily: "'Noto Sans Malayalam', serif" }}>{item.malayalam}</div>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm tabular-nums font-bold text-amber-900">₹{item.mrp}</div>
                        <div className={`text-[10px] tabular-nums ${isOut ? "text-red-700 font-bold" : isLow ? "text-orange-700 font-semibold" : "text-amber-700/70"}`}>
                          {isOut ? "OUT" : `${item.counterQty} left`}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cart */}
          <div>
            <Card title="Sales Cart" subtitle="വിൽപ്പന" icon={ShoppingCart}>
              {cart.length === 0 ? (
                <p className="text-sm text-amber-800/60 italic text-center py-6">Tap an item to add it.</p>
              ) : (
                <>
                  <div className="space-y-2 max-h-[380px] overflow-y-auto">
                    {cart.map((c) => {
                      const item = retailItems.find((r) => r.id === c.itemId);
                      if (!item) return null;
                      return (
                        <div key={c.itemId} className="flex items-center gap-2 bg-white border border-amber-900/15 px-2 py-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-amber-950 truncate">{item.name}</div>
                            <div className="text-[10px] text-amber-700">{item.brand !== "—" ? item.brand : ""} · ₹{item.mrp}</div>
                          </div>
                          <input
                            type="number" min="1" max={item.counterQty} value={c.qty}
                            onChange={(e) => updateCartQty(c.itemId, e.target.value)}
                            className="w-12 px-1.5 py-1 border border-amber-900/30 text-sm text-right tabular-nums"
                          />
                          <span className="text-sm tabular-nums font-semibold text-amber-900 w-16 text-right">₹{(c.qty * item.mrp).toLocaleString("en-IN")}</span>
                          <button onClick={() => removeFromCart(c.itemId)} className="text-amber-700/60 hover:text-red-700">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t-2 border-double border-amber-900/40 pt-3 mt-3 space-y-2">
                    <Field label="Customer Name (optional)" value={customerName} onChange={setCustomerName} placeholder="For records" />
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Payment Mode</label>
                      <div className="grid grid-cols-4 gap-1">
                        {["Cash", "UPI", "Card", "Other"].map((m) => (
                          <button
                            key={m}
                            onClick={() => setPaymentMode(m)}
                            className={`text-xs py-1.5 ${paymentMode === m ? "bg-amber-900 text-amber-50" : "border border-amber-900/30 text-amber-900 hover:bg-amber-100"}`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-baseline pt-2 border-t border-amber-900/15">
                      <span className="text-sm uppercase tracking-wider text-amber-900">Total</span>
                      <span className="text-2xl font-bold tabular-nums text-amber-950">₹{cartTotal.toLocaleString("en-IN")}</span>
                    </div>
                    <button
                      onClick={submitSale}
                      className="w-full bg-amber-900 hover:bg-amber-950 text-amber-50 py-3 font-semibold tracking-wide flex items-center justify-center gap-2"
                    >
                      <Receipt className="w-4 h-4" /> Sell · ₹{cartTotal.toLocaleString("en-IN")}
                    </button>
                    <button onClick={clearCart} className="w-full py-1 text-xs text-amber-800/70 hover:text-amber-900 uppercase tracking-wider">Clear</button>
                  </div>
                </>
              )}
              {feedback && (
                <div className={`mt-3 px-3 py-2 text-sm border-l-4 ${feedback.ok ? "border-green-700 bg-green-50 text-green-900" : "border-red-700 bg-red-50 text-red-900"}`}>
                  {feedback.msg}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* TODAY'S SALES VIEW */}
      {view === "sales" && (
        <div>
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-amber-900 text-amber-50 p-4">
              <div className="text-xs uppercase tracking-wider opacity-80">Total Collection</div>
              <div className="text-2xl font-bold tabular-nums">₹{todayTotal.toLocaleString("en-IN")}</div>
            </div>
            <div className="bg-amber-50 border border-amber-900/30 p-4">
              <div className="text-xs uppercase tracking-wider text-amber-800">Margin</div>
              <div className="text-2xl font-bold tabular-nums text-amber-950">₹{todayMargin.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
            </div>
            <div className="bg-amber-50 border border-amber-900/30 p-4">
              <div className="text-xs uppercase tracking-wider text-amber-800 mb-1">Payment Breakdown</div>
              <div className="space-y-0.5">
                {Object.keys(paymentBreakdown).length === 0 ? <div className="text-xs italic">No sales yet</div> :
                  Object.entries(paymentBreakdown).map(([m, v]) => (
                    <div key={m} className="flex justify-between text-sm">
                      <span className="text-amber-900">{m}</span>
                      <span className="tabular-nums font-semibold text-amber-950">₹{v.toLocaleString("en-IN")}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>

          <div className="bg-amber-50/40 border border-amber-900/15 overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-amber-100/60 text-amber-900 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-3 py-3">Bill</th>
                  <th className="text-left px-3 py-3">Time</th>
                  <th className="text-left px-3 py-3">Customer</th>
                  <th className="text-left px-3 py-3">Items</th>
                  <th className="text-left px-3 py-3">Pay Mode</th>
                  <th className="text-right px-3 py-3">Total</th>
                  <th className="text-right px-3 py-3">Margin</th>
                  <th className="text-right px-3 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {todaySales.length === 0 ? (
                  <tr><td colSpan={8} className="px-3 py-6 text-center text-sm italic text-amber-800/60">No sales yet today.</td></tr>
                ) : todaySales.map((s) => (
                  <tr key={s.id} className="border-t border-amber-900/10">
                    <td className="px-3 py-3 font-mono text-xs text-amber-700">{s.billNo}</td>
                    <td className="px-3 py-3 text-xs text-amber-800/80 tabular-nums">{new Date(s.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-3 py-3 text-amber-900">{s.customerName || <span className="italic text-amber-700/60">—</span>}</td>
                    <td className="px-3 py-3 text-xs">{s.items.map((i) => `${i.name}×${i.qty}`).join(", ")}</td>
                    <td className="px-3 py-3 text-xs"><span className="bg-amber-100 text-amber-900 px-2 py-0.5">{s.paymentMode}</span></td>
                    <td className="px-3 py-3 text-right tabular-nums font-bold text-amber-900">₹{s.total.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-green-700">₹{s.margin.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                    <td className="px-3 py-3 text-right">
                      <button onClick={() => setLastSale(s)} className="text-xs px-2 py-1 border border-amber-900/40 hover:bg-amber-100 flex items-center gap-1 ml-auto">
                        <Printer className="w-3 h-3" /> Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COUNTER STOCK VIEW */}
      {view === "stock" && (
        <CounterStockView retailItems={retailItems} />
      )}

      {/* REFILL VIEW */}
      {view === "refill" && (
        <CounterRefill
          retailItems={retailItems}
          lowStockItems={lowStockItems}
          onRaise={raiseCounterRequisition}
          onReceive={receiveCounterStock}
        />
      )}

      {/* Receipt modal */}
      {lastSale && <RetailReceipt sale={lastSale} onClose={() => setLastSale(null)} />}
    </>
  );
}

// ----- Counter stock detail view -----
export function CounterStockView({ retailItems }) {
  const totalValue = retailItems.reduce((s, r) => s + r.counterQty * r.costPrice, 0);
  const totalRetailValue = retailItems.reduce((s, r) => s + r.counterQty * r.mrp, 0);

  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <StoreStat label="Items" value={retailItems.length} />
        <StoreStat label="Cost Value" value={`₹${totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} sub="At cost price" />
        <StoreStat label="Retail Value" value={`₹${totalRetailValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} sub="At MRP" />
      </div>
      <div className="bg-amber-50/40 border border-amber-900/15 overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-amber-100/60 text-amber-900 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-3 py-3">Item</th>
              <th className="text-left px-3 py-3">Brand</th>
              <th className="text-left px-3 py-3">Pack</th>
              <th className="text-left px-3 py-3">Category</th>
              <th className="text-right px-3 py-3">MRP</th>
              <th className="text-right px-3 py-3">Cost</th>
              <th className="text-right px-3 py-3">Margin</th>
              <th className="text-right px-3 py-3">Counter Qty</th>
              <th className="text-right px-3 py-3">Reorder</th>
              <th className="text-center px-3 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {retailItems.map((r) => {
              const margin = r.mrp - r.costPrice;
              const marginPct = ((margin / r.mrp) * 100).toFixed(0);
              const isLow = r.counterQty <= r.counterReorder;
              const isOut = r.counterQty <= 0;
              return (
                <tr key={r.id} className={`border-t border-amber-900/10 ${isOut ? "bg-red-50" : isLow ? "bg-orange-50" : ""}`}>
                  <td className="px-3 py-3">
                    <div className="font-semibold text-amber-950">{r.name}</div>
                    {r.malayalam && <div className="text-xs text-amber-800/70" style={{ fontFamily: "'Noto Sans Malayalam', serif" }}>{r.malayalam}</div>}
                  </td>
                  <td className="px-3 py-3 text-amber-900 text-xs">{r.brand}</td>
                  <td className="px-3 py-3 text-xs text-amber-800/80">{r.packSize}</td>
                  <td className="px-3 py-3 text-xs"><span className="bg-amber-100 text-amber-900 px-2 py-0.5">{r.category}</span></td>
                  <td className="px-3 py-3 text-right tabular-nums font-bold text-amber-900">₹{r.mrp}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-amber-800/80">₹{r.costPrice}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-green-700 text-xs">₹{margin} ({marginPct}%)</td>
                  <td className={`px-3 py-3 text-right tabular-nums font-bold ${isOut ? "text-red-800" : isLow ? "text-orange-800" : "text-amber-950"}`}>{r.counterQty}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-amber-800/70">{r.counterReorder}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 font-bold ${
                      isOut ? "bg-red-200 text-red-900" : isLow ? "bg-orange-200 text-orange-900" : "bg-green-100 text-green-800"
                    }`}>
                      {isOut ? "Out" : isLow ? "Reorder" : "OK"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-amber-800/70 italic mt-2">
        Counter stock is refilled only by the Store. Use the "Refill from Store" tab to raise a requisition.
        Purchase of new stock is handled exclusively through the Purchase department.
      </p>
    </div>
  );
}

// ----- Counter refill: raise requisition to store, acknowledge receipt -----
export function CounterRefill({ retailItems, lowStockItems, onRaise, onReceive }) {
  const [refillCart, setRefillCart] = useState({}); // itemId → qty
  const [purpose, setPurpose] = useState("Routine counter refill");
  const [feedback, setFeedback] = useState(null);
  const [receiveItem, setReceiveItem] = useState(null);
  const [receiveQty, setReceiveQty] = useState("");

  const addToRefill = (item, suggested) => {
    setRefillCart((c) => ({ ...c, [item.id]: suggested }));
  };

  const updateRefillQty = (itemId, qty) => {
    const n = parseInt(qty);
    if (isNaN(n) || n <= 0) {
      setRefillCart((c) => {
        const { [itemId]: _, ...rest } = c;
        return rest;
      });
    } else {
      setRefillCart((c) => ({ ...c, [itemId]: n }));
    }
  };

  const submit = () => {
    const items = Object.entries(refillCart).map(([itemId, qty]) => ({ itemId, qty }));
    if (items.length === 0) {
      setFeedback({ ok: false, msg: "Add items to refill cart first." });
      return;
    }
    const r = onRaise({ items, purpose });
    setFeedback(r);
    if (r.ok) {
      setRefillCart({});
    }
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleReceive = () => {
    if (!receiveItem || !receiveQty) return;
    const n = parseInt(receiveQty);
    if (isNaN(n) || n <= 0) return;
    onReceive(receiveItem.id, n);
    setReceiveItem(null);
    setReceiveQty("");
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div>
        <Card title="Items Needing Refill" subtitle="At or below counter reorder level" icon={AlertTriangle}>
          {lowStockItems.length === 0 ? (
            <p className="text-sm text-amber-800/60 italic">All counter stock is comfortable. Nothing to refill right now.</p>
          ) : (
            <div className="space-y-2">
              {lowStockItems.map((item) => {
                // Suggested = enough to bring back to ~3× reorder level
                const suggested = Math.max(item.counterReorder * 3 - item.counterQty, item.counterReorder);
                const inCart = refillCart[item.id];
                return (
                  <div key={item.id} className={`p-3 border ${inCart ? "bg-amber-100/50 border-amber-700" : "bg-white border-amber-900/15"}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-amber-950 text-sm">{item.name}</div>
                        <div className="text-xs text-amber-700">{item.brand} · {item.packSize}</div>
                        <div className="text-xs text-orange-800 font-semibold mt-1">{item.counterQty} left · reorder at {item.counterReorder}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {inCart ? (
                          <input
                            type="number" min="1" value={inCart}
                            onChange={(e) => updateRefillQty(item.id, e.target.value)}
                            className="w-16 px-2 py-1 border border-amber-900/30 text-sm text-right"
                          />
                        ) : (
                          <button onClick={() => addToRefill(item, suggested)} className="text-xs px-3 py-1 bg-amber-900 text-amber-50">
                            + Add ({suggested})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="All Counter Items (manual refill)" icon={Package}>
          <details className="text-sm">
            <summary className="cursor-pointer text-amber-800 mb-2">Show all items</summary>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {retailItems.filter((i) => !lowStockItems.find((l) => l.id === i.id)).map((item) => {
                const inCart = refillCart[item.id];
                return (
                  <div key={item.id} className="flex items-center justify-between py-1 border-b border-amber-900/10 last:border-0">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-amber-950">{item.name}</span>
                      <span className="text-xs text-amber-700 ml-2">{item.brand} · {item.counterQty} left</span>
                    </div>
                    {inCart ? (
                      <input
                        type="number" min="1" value={inCart}
                        onChange={(e) => updateRefillQty(item.id, e.target.value)}
                        className="w-14 px-1.5 py-0.5 border border-amber-900/30 text-xs text-right"
                      />
                    ) : (
                      <button onClick={() => addToRefill(item, item.counterReorder * 2)} className="text-[10px] px-2 py-0.5 border border-amber-900/30 hover:bg-amber-100">+</button>
                    )}
                  </div>
                );
              })}
            </div>
          </details>
        </Card>
      </div>

      <div>
        <Card title="Refill Requisition" subtitle="Sent to Store" icon={Truck}>
          {Object.keys(refillCart).length === 0 ? (
            <p className="text-sm text-amber-800/60 italic text-center py-6">Add items from the left to build a refill request.</p>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {Object.entries(refillCart).map(([itemId, qty]) => {
                  const item = retailItems.find((r) => r.id === itemId);
                  if (!item) return null;
                  return (
                    <div key={itemId} className="flex items-center justify-between bg-white border border-amber-900/15 px-3 py-2">
                      <div>
                        <div className="text-sm font-semibold text-amber-950">{item.name}</div>
                        <div className="text-xs text-amber-700">{item.brand} · {item.packSize}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number" min="1" value={qty}
                          onChange={(e) => updateRefillQty(itemId, e.target.value)}
                          className="w-14 px-1.5 py-1 border border-amber-900/30 text-sm text-right"
                        />
                        <span className="text-xs text-amber-700">pkts</span>
                        <button onClick={() => updateRefillQty(itemId, 0)} className="text-amber-700/60 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Field label="Purpose" value={purpose} onChange={setPurpose} placeholder="Reason / urgency" />
              <button onClick={submit} className="w-full mt-3 bg-amber-900 text-amber-50 py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
                <ClipboardList className="w-4 h-4" /> Send to Store
              </button>
              <p className="text-[10px] text-amber-700/70 italic mt-2">
                The store keeper will see this in the Pending Queue. Once they issue the items, come back here to acknowledge receipt.
              </p>
            </>
          )}
          {feedback && (
            <div className={`mt-3 px-3 py-2 text-sm border-l-4 ${feedback.ok ? "border-green-700 bg-green-50 text-green-900" : "border-red-700 bg-red-50 text-red-900"}`}>
              {feedback.msg}
            </div>
          )}
        </Card>

        <Card title="Acknowledge Receipt from Store" subtitle="After store hands over items" icon={Check}>
          <p className="text-xs text-amber-800/70 italic mb-3">
            When the store keeper physically delivers items, click an item below and enter how many were received.
            Counter stock will increase accordingly.
          </p>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {retailItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setReceiveItem(item)}
                className="w-full text-left flex justify-between items-center py-1.5 px-2 hover:bg-amber-50 border-b border-amber-900/10 last:border-0"
              >
                <div>
                  <span className="text-sm text-amber-950">{item.name}</span>
                  <span className="text-xs text-amber-700 ml-2">{item.brand}</span>
                </div>
                <span className="text-xs text-amber-700/70">{item.counterQty} on counter →</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Receipt acknowledgement dialog */}
      {receiveItem && (
        <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 p-4" onClick={() => setReceiveItem(null)}>
          <div className="bg-amber-50 border-2 border-amber-900/40 max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-amber-950 mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Receive Stock</h3>
            <p className="text-sm text-amber-800 mb-3">{receiveItem.name} · {receiveItem.brand}</p>
            <p className="text-xs text-amber-700 mb-3">Currently {receiveItem.counterQty} on counter.</p>
            <div className="mb-4">
              <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Quantity Received</label>
              <input
                autoFocus type="number" min="1" value={receiveQty}
                onChange={(e) => setReceiveQty(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReceive()}
                className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleReceive} className="flex-1 bg-amber-900 text-amber-50 py-2 text-sm font-semibold">Add to Counter</button>
              <button onClick={() => setReceiveItem(null)} className="px-4 py-2 border border-amber-900/40 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----- Printable retail receipt -----
export function RetailReceipt({ sale, onClose }) {
  return (
    <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center z-50 p-4 print:bg-white print:p-0 print:static" onClick={onClose}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #retail-receipt-print, #retail-receipt-print * { visibility: visible; }
          #retail-receipt-print { position: absolute; left: 0; top: 0; width: 100%; background: white !important; font-family: 'Courier New', monospace; }
          #retail-receipt-print .no-print { display: none !important; }
        }
        @page { margin: 8mm; size: 80mm auto; }
      `}</style>
      <div id="retail-receipt-print" onClick={(e) => e.stopPropagation()} className="bg-white max-w-xs w-full max-h-[90vh] overflow-y-auto shadow-2xl print:max-h-none print:max-w-none print:shadow-none" style={{ fontFamily: "'Courier New', monospace" }}>
        <div className="no-print bg-amber-900 text-amber-50 px-3 py-2 flex items-center justify-between sticky top-0 z-10">
          <span className="text-xs uppercase tracking-wider">Sale Receipt</span>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="bg-amber-50 text-amber-900 px-2 py-1 text-xs font-semibold flex items-center gap-1"><Printer className="w-3 h-3"/> Print</button>
            <button onClick={onClose} className="text-amber-50"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="p-4">
          <div className="text-center border-b-2 border-double border-stone-800 pb-2 mb-2">
            <div className="text-xs">✦ ॐ ✦</div>
            <div className="text-base font-bold tracking-wider">NELLIAKATTU OUSHADHEESWARI</div>
            <div className="text-[10px] font-semibold">TEMPLE</div>
            <div className="text-[9px] mt-0.5">Kizhakombu PO, Koothattukulam — 686662</div>
            <div className="text-[10px] mt-1 italic">Counter Sales</div>
          </div>
          <div className="text-xs mb-2">
            <div className="flex justify-between"><span>Bill:</span><strong>{sale.billNo}</strong></div>
            <div className="flex justify-between"><span>Date:</span><span>{new Date(sale.time).toLocaleDateString("en-IN")}</span></div>
            <div className="flex justify-between"><span>Time:</span><span>{new Date(sale.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span></div>
            {sale.customerName && <div className="flex justify-between"><span>Customer:</span><span>{sale.customerName}</span></div>}
          </div>
          <table className="w-full text-xs border-t border-b border-stone-800 my-2">
            <thead>
              <tr className="border-b border-stone-400">
                <th className="text-left py-1">Item</th>
                <th className="text-right py-1">Qty</th>
                <th className="text-right py-1">Rate</th>
                <th className="text-right py-1">Amt</th>
              </tr>
            </thead>
            <tbody>
              {sale.lines.map((l, idx) => (
                <tr key={idx} className="border-b border-stone-300">
                  <td className="py-1">
                    {l.name}
                    {l.brand !== "—" && <div className="text-[9px] text-stone-600">{l.brand}</div>}
                  </td>
                  <td className="py-1 text-right tabular-nums">{l.qty}</td>
                  <td className="py-1 text-right tabular-nums">{l.mrp}</td>
                  <td className="py-1 text-right tabular-nums">{l.lineTotal}</td>
                </tr>
              ))}
              <tr className="font-bold border-t-2 border-stone-800">
                <td colSpan={3} className="py-1 text-right">TOTAL</td>
                <td className="py-1 text-right tabular-nums text-sm">₹ {sale.total}</td>
              </tr>
            </tbody>
          </table>
          <div className="text-xs flex justify-between">
            <span>Paid via:</span><span className="font-semibold">{sale.paymentMode}</span>
          </div>
          <div className="text-center text-[10px] mt-3 italic">✦ Blessings ✦</div>
        </div>
      </div>
    </div>
  );
}

