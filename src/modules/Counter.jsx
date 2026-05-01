import { useState } from "react";
import { Receipt, Users, IndianRupee, Trash2, ShoppingCart } from "lucide-react";
import { VAZHIPADU_CATALOG } from "../seed/index.js";
import { Card, Field, NakshatramField, NakshatramSelect } from "../components/ui.jsx";
import { BillSlip } from "../modules/PrintableBill.jsx";
import { RetailCounter } from "../modules/RetailCounter.jsx";
import { KioskMode, DispatchQueueBanner } from "../modules/KioskMode.jsx";

// =================== COUNTER (BILLING) ===================
export function Counter({ bookVazhipadu, bookings, totalRevenue, retailItems, retailSales, sellRetail, raiseCounterRequisition, receiveCounterStock, kioskOrders = [], payAtKiosk, dispatchKioskOrder, cancelKioskOrder }) {
  // Top-level mode: vazhipadu billing vs retail sales counter
  const [mode, setMode] = useState("vazhipadu");

  // Primary devotee details (default applied to new cart lines)
  const [primaryName, setPrimaryName] = useState("");
  const [primaryNakshatram, setPrimaryNakshatram] = useState("");

  // Cart: each line has its own devotee + nakshatram (defaults to primary, but editable)
  const [cart, setCart] = useState([]);
  // Retail add-on cart on the same bill: { itemId, qty }
  const [retailAddCart, setRetailAddCart] = useState([]);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [feedback, setFeedback] = useState(null);
  const [lastBill, setLastBill] = useState(null); // for printing

  const addToCart = (vazhipadu) => {
    setCart((c) => [
      ...c,
      {
        lineId: `L${Date.now()}-${c.length}`,
        vazhipaduId: vazhipadu.id,
        devoteeName: primaryName,
        nakshatram: primaryNakshatram,
      },
    ]);
  };

  const updateLine = (lineId, field, value) => {
    setCart((c) => c.map((l) => (l.lineId === lineId ? { ...l, [field]: value } : l)));
  };

  const removeLine = (lineId) => setCart((c) => c.filter((l) => l.lineId !== lineId));
  const clearCart = () => { setCart([]); setRetailAddCart([]); };

  const cartTotal = cart.reduce((s, l) => {
    const v = VAZHIPADU_CATALOG.find((x) => x.id === l.vazhipaduId);
    return s + (v?.price || 0);
  }, 0);

  // Apply primary name to any blank lines (helpful when user fills name after adding)
  const applyPrimaryToBlanks = () => {
    setCart((c) =>
      c.map((l) => ({
        ...l,
        devoteeName: l.devoteeName || primaryName,
        nakshatram: l.nakshatram || primaryNakshatram,
      }))
    );
  };

  const submit = () => {
    if (cart.length === 0 && retailAddCart.length === 0) {
      setFeedback({ ok: false, msg: "Add at least one vazhipadu or retail item." });
      return;
    }

    // Validate vazhipadu portion if present
    let vazhipaduResult = null;
    if (cart.length > 0) {
      const filled = cart.map((l) => ({
        vazhipaduId: l.vazhipaduId,
        devoteeName: (l.devoteeName || primaryName).trim(),
        nakshatram: (l.nakshatram || primaryNakshatram).trim(),
      }));
      if (filled.some((l) => !l.devoteeName)) {
        setFeedback({ ok: false, msg: "Each vazhipadu line needs a devotee name." });
        return;
      }
      vazhipaduResult = bookVazhipadu(filled);
      if (!vazhipaduResult.ok) {
        setFeedback(vazhipaduResult);
        setTimeout(() => setFeedback(null), 5000);
        return;
      }
    }

    // Validate retail stock if present (atomic check)
    let retailResult = null;
    if (retailAddCart.length > 0) {
      retailResult = sellRetail(retailAddCart, paymentMode, primaryName);
      if (!retailResult.ok) {
        // If vazhipadu already booked but retail failed, we have a partial failure.
        // Inform the user — vazhipadu is still done, retail isn't.
        const msg = vazhipaduResult
          ? `Vazhipadu booked (${vazhipaduResult.billNo}), but retail items failed: ${retailResult.msg}`
          : retailResult.msg;
        setFeedback({ ok: false, msg });
        setTimeout(() => setFeedback(null), 6000);
        // Show vazhipadu-only bill if it was booked
        if (vazhipaduResult) {
          setLastBill({
            billNo: vazhipaduResult.billNo, time: vazhipaduResult.ts,
            total: vazhipaduResult.total, lines: vazhipaduResult.lines,
            retailLines: [], paymentMode, primaryName,
          });
          setCart([]); setPrimaryName(""); setPrimaryNakshatram("");
        }
        return;
      }
    }

    // Build combined bill
    const combinedTotal = (vazhipaduResult?.total || 0) + (retailResult?.total || 0);
    const billNo = vazhipaduResult?.billNo || retailResult?.billNo;
    const time = vazhipaduResult?.ts || retailResult?.ts;

    setLastBill({
      billNo,
      time,
      total: combinedTotal,
      lines: vazhipaduResult?.lines || [],
      retailLines: retailResult?.lines || [],
      paymentMode,
      primaryName,
      primaryNakshatram,
    });

    setFeedback({ ok: true, msg: `Bill ${billNo} · ₹${combinedTotal} (${cart.length} vazhipadu + ${retailAddCart.length} retail)` });
    setCart([]);
    setRetailAddCart([]);
    setPrimaryName("");
    setPrimaryNakshatram("");
    setTimeout(() => setFeedback(null), 5000);
  };

  // Retail cart helpers (used in vazhipadu mode add-on section)
  const addRetail = (item) => {
    if (item.counterQty <= 0) {
      setFeedback({ ok: false, msg: `Out of stock: ${item.name}` });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    setRetailAddCart((c) => {
      const existing = c.find((x) => x.itemId === item.id);
      if (existing) {
        if (existing.qty + 1 > item.counterQty) {
          setFeedback({ ok: false, msg: `Only ${item.counterQty} left for ${item.name}` });
          setTimeout(() => setFeedback(null), 3000);
          return c;
        }
        return c.map((x) => (x.itemId === item.id ? { ...x, qty: x.qty + 1 } : x));
      }
      return [...c, { itemId: item.id, qty: 1 }];
    });
  };

  const updateRetailQty = (itemId, qty) => {
    const item = retailItems?.find((r) => r.id === itemId);
    if (!item) return;
    const n = parseInt(qty);
    if (isNaN(n) || n <= 0) {
      setRetailAddCart((c) => c.filter((x) => x.itemId !== itemId));
      return;
    }
    if (n > item.counterQty) return;
    setRetailAddCart((c) => c.map((x) => (x.itemId === itemId ? { ...x, qty: n } : x)));
  };

  const removeRetail = (itemId) => setRetailAddCart((c) => c.filter((x) => x.itemId !== itemId));

  const vazhipaduTotal = cart.reduce((s, l) => {
    const v = VAZHIPADU_CATALOG.find((x) => x.id === l.vazhipaduId);
    return s + (v?.price || 0);
  }, 0);
  const retailTotal = retailAddCart.reduce((s, c) => {
    const item = retailItems?.find((r) => r.id === c.itemId);
    return s + (item?.mrp || 0) * c.qty;
  }, 0);
  const combinedCartTotal = vazhipaduTotal + retailTotal;

  return (
    <>
      {/* Mode switcher */}
      <div className="flex gap-2 mb-5 border-b border-amber-900/20 overflow-x-auto">
        <button
          onClick={() => setMode("vazhipadu")}
          className={`flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap border-b-2 ${
            mode === "vazhipadu" ? "border-amber-900 text-amber-950 font-semibold" : "border-transparent text-amber-800/70"
          }`}
        >
          <Receipt className="w-4 h-4" /> Vazhipadu Billing
          {kioskOrders.filter((o) => o.status === "AwaitingDispatch").length > 0 && (
            <span className="bg-red-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {kioskOrders.filter((o) => o.status === "AwaitingDispatch").length}
            </span>
          )}
        </button>
        <button
          onClick={() => setMode("retail")}
          className={`flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap border-b-2 ${
            mode === "retail" ? "border-amber-900 text-amber-950 font-semibold" : "border-transparent text-amber-800/70"
          }`}
        >
          <ShoppingCart className="w-4 h-4" /> Retail Counter
        </button>
        <button
          onClick={() => setMode("kiosk")}
          className={`flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap border-b-2 ${
            mode === "kiosk" ? "border-amber-900 text-amber-950 font-semibold" : "border-transparent text-amber-800/70"
          }`}
        >
          <Users className="w-4 h-4" /> Devotee Kiosk
        </button>
      </div>

      {mode === "kiosk" ? (
        <KioskMode
          retailItems={retailItems}
          payAtKiosk={payAtKiosk}
        />
      ) : mode === "retail" ? (
        <RetailCounter
          retailItems={retailItems}
          retailSales={retailSales}
          sellRetail={sellRetail}
          raiseCounterRequisition={raiseCounterRequisition}
          receiveCounterStock={receiveCounterStock}
        />
      ) : (
      <>
      {/* Awaiting-dispatch strip — visible to counter staff in vazhipadu mode */}
      {kioskOrders.filter((o) => o.status === "AwaitingDispatch").length > 0 && (
        <DispatchQueueBanner
          orders={kioskOrders.filter((o) => o.status === "AwaitingDispatch")}
          onDispatch={dispatchKioskOrder}
          setLastBill={setLastBill}
        />
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: catalog + primary details */}
        <div className="lg:col-span-2 space-y-5">
          <Card title="Devotee Details" subtitle="ഭക്തൻ വിവരങ്ങൾ" icon={Users}>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Primary Devotee Name" value={primaryName} onChange={setPrimaryName} placeholder="Full name" />
              <NakshatramField label="Nakshatram" value={primaryNakshatram} onChange={setPrimaryNakshatram} />
            </div>
            <p className="text-xs text-amber-800/70 italic mt-2">
              Applies as default to each cart line. You can override per line below — useful when booking for family members.
            </p>
          </Card>

          <Card title="Vazhipadu Catalog" subtitle="വഴിപാട് വിഭാഗം" icon={Receipt}>
            <div className="grid sm:grid-cols-2 gap-2">
              {VAZHIPADU_CATALOG.map((v) => (
                <button
                  key={v.id}
                  onClick={() => addToCart(v)}
                  className="text-left p-3 border border-amber-900/20 hover:border-amber-900 hover:bg-amber-100/40 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-950 group-hover:text-amber-900">{v.name}</span>
                    <span className="text-sm tabular-nums text-amber-900">₹{v.price}</span>
                  </div>
                  <div className="text-xs text-amber-800/70" style={{ fontFamily: "'Noto Sans Malayalam', serif" }}>{v.malayalam}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] uppercase tracking-wider text-amber-700/70">→ {v.area}</span>
                    <span className="text-xs text-amber-900 font-semibold opacity-0 group-hover:opacity-100">+ Add</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Retail add-on: items go on the same bill */}
          {retailItems && retailItems.length > 0 && (
            <Card title="Add Retail Items to Bill" subtitle="Optional · same bill" icon={ShoppingCart}>
              <p className="text-xs text-amber-800/70 italic mb-3">
                Camphor, agarbathi, charadu, souvenirs — tap to add to the same bill.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {retailItems.map((item) => {
                  const isOut = item.counterQty <= 0;
                  const inCart = retailAddCart.find((c) => c.itemId === item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => addRetail(item)}
                      disabled={isOut}
                      className={`text-left p-2 border text-xs transition-colors ${
                        isOut ? "bg-stone-100 border-stone-300 opacity-50 cursor-not-allowed" :
                        inCart ? "bg-amber-100 border-amber-700" :
                        "bg-white border-amber-900/20 hover:border-amber-900 hover:bg-amber-50"
                      }`}
                    >
                      <div className="font-semibold text-amber-950 truncate">{item.name}</div>
                      <div className="text-[10px] text-amber-700 truncate">{item.brand !== "—" ? item.brand : ""}{item.brand !== "—" && item.packSize ? " · " : ""}{item.packSize}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="tabular-nums font-bold text-amber-900">₹{item.mrp}</span>
                        {inCart ? (
                          <span className="text-[10px] text-amber-900 font-bold">×{inCart.qty} ✓</span>
                        ) : (
                          <span className={`text-[10px] ${isOut ? "text-red-700 font-bold" : "text-amber-700/70"}`}>{isOut ? "OUT" : `${item.counterQty} left`}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Right: cart */}
        <div className="space-y-5">
          <Card title="Bill Cart" subtitle="ബിൽ" icon={IndianRupee}>
            {cart.length === 0 && retailAddCart.length === 0 ? (
              <div className="text-center py-8 text-amber-800/60">
                <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm italic">Tap a vazhipadu or retail item to start.</p>
                <p className="text-xs mt-1">Both can go on the same bill.</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {/* Vazhipadu lines */}
                  {cart.map((line, idx) => {
                    const v = VAZHIPADU_CATALOG.find((x) => x.id === line.vazhipaduId);
                    return (
                      <div key={line.lineId} className="border border-amber-900/15 bg-amber-50/60 p-3 relative">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-amber-700/70 uppercase tracking-wider">Vazhipadu · Line {idx + 1}</div>
                            <div className="font-semibold text-amber-950 text-sm">{v.name}</div>
                            <div className="text-xs text-amber-800/70" style={{ fontFamily: "'Noto Sans Malayalam', serif" }}>{v.malayalam}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="tabular-nums font-semibold text-amber-900">₹{v.price}</div>
                            <button onClick={() => removeLine(line.lineId)} className="text-amber-800/60 hover:text-red-700 mt-1" aria-label="Remove">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={line.devoteeName}
                            onChange={(e) => updateLine(line.lineId, "devoteeName", e.target.value)}
                            placeholder={primaryName || "Devotee name"}
                            className="bg-white border border-amber-900/20 px-2 py-1 text-xs focus:border-amber-900 focus:outline-none"
                          />
                          <NakshatramSelect
                            value={line.nakshatram}
                            onChange={(v) => updateLine(line.lineId, "nakshatram", v)}
                            placeholder={primaryNakshatram ? `Default: ${primaryNakshatram}` : "— Nakshatram —"}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Retail lines */}
                  {retailAddCart.length > 0 && (
                    <div className="border border-amber-900/15 bg-amber-100/30 p-3">
                      <div className="text-xs text-amber-700/70 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <ShoppingCart className="w-3 h-3" /> Retail Items
                      </div>
                      <div className="space-y-1.5">
                        {retailAddCart.map((c) => {
                          const item = retailItems?.find((r) => r.id === c.itemId);
                          if (!item) return null;
                          return (
                            <div key={c.itemId} className="flex items-center gap-2 bg-white border border-amber-900/15 px-2 py-1.5">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-amber-950 truncate">{item.name}</div>
                                <div className="text-[10px] text-amber-700">{item.brand !== "—" ? item.brand : ""} · ₹{item.mrp}</div>
                              </div>
                              <input
                                type="number" min="1" max={item.counterQty} value={c.qty}
                                onChange={(e) => updateRetailQty(c.itemId, e.target.value)}
                                className="w-12 px-1.5 py-1 border border-amber-900/30 text-sm text-right tabular-nums"
                              />
                              <span className="text-sm tabular-nums font-semibold text-amber-900 w-14 text-right">₹{(c.qty * item.mrp).toLocaleString("en-IN")}</span>
                              <button onClick={() => removeRetail(c.itemId)} className="text-amber-700/60 hover:text-red-700">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t-2 border-double border-amber-900/40 pt-3 mt-3">
                  {/* Sub-totals shown when both kinds present */}
                  {cart.length > 0 && retailAddCart.length > 0 && (
                    <div className="text-xs text-amber-800 space-y-0.5 mb-2">
                      <div className="flex justify-between"><span>Vazhipadu subtotal</span><span className="tabular-nums">₹{vazhipaduTotal}</span></div>
                      <div className="flex justify-between"><span>Retail subtotal</span><span className="tabular-nums">₹{retailTotal}</span></div>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline mb-3">
                    <span className="text-sm uppercase tracking-wider text-amber-900">Total</span>
                    <span className="text-2xl font-bold tabular-nums text-amber-950">₹{combinedCartTotal.toLocaleString("en-IN")}</span>
                  </div>

                  {/* Payment mode shown when retail items present (vazhipadu-only stays simple) */}
                  {retailAddCart.length > 0 && (
                    <div className="mb-3">
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
                  )}

                  <button
                    onClick={submit}
                    className="w-full bg-amber-900 hover:bg-amber-950 text-amber-50 py-3 font-semibold tracking-wide flex items-center justify-center gap-2"
                  >
                    <Receipt className="w-4 h-4" />
                    Generate Bill · ₹{combinedCartTotal.toLocaleString("en-IN")}
                  </button>
                  <button onClick={clearCart} className="w-full mt-2 py-2 text-xs text-amber-800/70 hover:text-amber-900 uppercase tracking-wider">
                    Clear Cart
                  </button>
                </div>
              </>
            )}
            {feedback && (
              <div className={`mt-3 px-3 py-2 text-sm border-l-4 ${feedback.ok ? "border-green-700 bg-green-50 text-green-900" : "border-red-700 bg-red-50 text-red-900"}`}>
                {feedback.msg}
              </div>
            )}
          </Card>

          {/* Today's ledger */}
          <Card title="Today's Ledger" subtitle="ഇന്നത്തെ കണക്ക്" icon={IndianRupee}>
            {(() => {
              const todayStr = new Date().toDateString();
              const todayRetail = (retailSales || []).filter((s) => new Date(s.time).toDateString() === todayStr).reduce((s, x) => s + x.total, 0);
              const grandTotal = totalRevenue + todayRetail;
              return (
                <div className="bg-amber-900 text-amber-50 px-4 py-3 mb-3">
                  <div className="text-xs uppercase tracking-wider opacity-80">Total Collection</div>
                  <div className="text-3xl font-bold tabular-nums">₹{grandTotal.toLocaleString("en-IN")}</div>
                  <div className="text-xs opacity-80 mt-1">
                    Vazhipadu ₹{totalRevenue.toLocaleString("en-IN")}
                    {todayRetail > 0 && <> · Retail ₹{todayRetail.toLocaleString("en-IN")}</>}
                  </div>
                </div>
              );
            })()}
            <div className="max-h-72 overflow-y-auto space-y-2">
              {bookings.length === 0 && <p className="text-sm text-amber-800/60 italic">No bookings yet.</p>}
              {/* Group bookings by billNo */}
              {Object.entries(
                bookings.reduce((acc, b) => {
                  (acc[b.billNo] = acc[b.billNo] || []).push(b);
                  return acc;
                }, {})
              ).map(([billNo, lines]) => {
                const total = lines.reduce((s, l) => s + l.price, 0);
                return (
                  <button
                    key={billNo}
                    onClick={() => setLastBill({ billNo, time: lines[0].time, total, lines })}
                    className="w-full text-left border-b border-amber-900/10 pb-2 hover:bg-amber-50 px-1"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-amber-950">{lines[0].devoteeName}</span>
                      <span className="tabular-nums text-amber-900 font-semibold">₹{total}</span>
                    </div>
                    <div className="text-xs text-amber-800/70 flex justify-between">
                      <span>{lines.length} item{lines.length > 1 ? "s" : ""} · {billNo}</span>
                      <span className="text-amber-700">View / Print →</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Bill slip modal */}
      {lastBill && <BillSlip bill={lastBill} onClose={() => setLastBill(null)} />}
      </>
      )}
    </>
  );
}

