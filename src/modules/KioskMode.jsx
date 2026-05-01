import { useState } from "react";
import { Check, X, Users, IndianRupee, Printer, Star, Phone, Scan } from "lucide-react";
import { VAZHIPADU_CATALOG, NAKSHATRAMS } from "../seed/index.js";
import { Card } from "../components/ui.jsx";
import { BillSlip } from "../modules/PrintableBill.jsx";

// =================== KIOSK MODE (Devotee self-service) ===================
export function KioskMode({ retailItems, payAtKiosk }) {
  const [lang, setLang] = useState("en"); // "en" or "ml"
  const [primaryName, setPrimaryName] = useState("");
  const [primaryNakshatram, setPrimaryNakshatram] = useState("");
  const [phone, setPhone] = useState("");
  const [vCart, setVCart] = useState([]); // [{vazhipaduId, devoteeName, nakshatram, lineId}]
  const [rCart, setRCart] = useState([]); // [{itemId, qty}]
  const [step, setStep] = useState(1); // 1: details, 2: vazhipadu, 3: retail, 4: review, 5: payment
  const [printing, setPrinting] = useState(null); // paid bill to print
  const [feedback, setFeedback] = useState(null);

  // Payment state
  const [paymentMode, setPaymentMode] = useState(null); // "UPI" | "Card" | "NETC"
  const [paymentStatus, setPaymentStatus] = useState("idle"); // "idle" | "processing" | "success" | "failed"
  const [paymentTxnRef, setPaymentTxnRef] = useState("");

  const T = {
    en: {
      welcome: "Welcome to Nelliakattu Oushadheeswari Temple",
      subtitle: "Self-Service Booking Kiosk",
      tap: "Tap to begin",
      next: "Next →",
      back: "← Back",
      yourDetails: "Your Details",
      name: "Your Name",
      nakshatram: "Nakshatram (Birth Star)",
      phone: "Phone (optional)",
      vazhipaduStep: "Choose Vazhipadu",
      vazhipaduOpt: "Vazhipadu / Offerings (optional)",
      retailStep: "Pooja Items / Souvenirs",
      retailOpt: "Add Items (optional)",
      review: "Review & Pay",
      total: "Total",
      payNow: "Pay Now",
      cancel: "Cancel",
      addedTo: "✓ Added",
      startNew: "Start New Order",
      empty: "No items yet — tap to add or skip this step",
      perItem: "× ",
      cart: "Your Order",
      // Payment step
      paymentStep: "Payment",
      choosePayment: "Choose Payment Method",
      payUPI: "UPI / QR Code",
      payCard: "Debit / Credit Card",
      payNETC: "Other",
      scanQR: "Scan QR with any UPI app",
      tapCard: "Insert or tap card on the reader",
      processing: "Processing payment...",
      pleaseWait: "Please wait — do not leave the kiosk",
      paymentSuccess: "Payment Successful",
      paymentFailed: "Payment Failed",
      tryAgain: "Try Again",
      txnRef: "Transaction Ref",
      printBill: "Print Bill",
      collectAtCounter: "Collect items at the counter",
      thankYou: "Thank you for your offering",
    },
    ml: {
      welcome: "നെല്ലിയക്കാട്ടു ഔഷധീശ്വരി ക്ഷേത്രത്തിലേക്ക് സ്വാഗതം",
      subtitle: "സ്വയം സേവന വഴിപാട് കിയോസ്ക്",
      tap: "ആരംഭിക്കാൻ തൊടുക",
      next: "അടുത്തത് →",
      back: "← തിരികെ",
      yourDetails: "നിങ്ങളുടെ വിവരങ്ങൾ",
      name: "നിങ്ങളുടെ പേര്",
      nakshatram: "നക്ഷത്രം",
      phone: "ഫോൺ (നിർബന്ധമല്ല)",
      vazhipaduStep: "വഴിപാട് തിരഞ്ഞെടുക്കുക",
      vazhipaduOpt: "വഴിപാട് / സമർപ്പണങ്ങൾ (നിർബന്ധമല്ല)",
      retailStep: "പൂജാ സാധനങ്ങൾ / സ്മാരകം",
      retailOpt: "സാധനങ്ങൾ ചേർക്കുക (നിർബന്ധമല്ല)",
      review: "പരിശോധിച്ച് പണമടയ്ക്കുക",
      total: "ആകെ",
      payNow: "ഇപ്പോൾ പണമടയ്ക്കുക",
      cancel: "റദ്ദാക്കുക",
      addedTo: "✓ ചേർത്തു",
      startNew: "പുതിയ ഓർഡർ",
      empty: "ഇതുവരെ ഒന്നുമില്ല — തൊടുക അല്ലെങ്കിൽ ഈ ഘട്ടം ഒഴിവാക്കുക",
      perItem: "× ",
      cart: "നിങ്ങളുടെ ഓർഡർ",
      // Payment step
      paymentStep: "പേയ്മെന്റ്",
      choosePayment: "പേയ്മെന്റ് രീതി തിരഞ്ഞെടുക്കുക",
      payUPI: "UPI / QR കോഡ്",
      payCard: "ഡെബിറ്റ് / ക്രെഡിറ്റ് കാർഡ്",
      payNETC: "മറ്റുള്ളവ",
      scanQR: "ഏതെങ്കിലും UPI ആപ്പ് ഉപയോഗിച്ച് QR സ്കാൻ ചെയ്യുക",
      tapCard: "റീഡറിൽ കാർഡ് ഇൻസെർട്ട് അല്ലെങ്കിൽ ടാപ്പ് ചെയ്യുക",
      processing: "പണമടയ്ക്കൽ പ്രോസസ്സ് ചെയ്യുന്നു...",
      pleaseWait: "ദയവായി കാത്തിരിക്കുക — കിയോസ്ക് വിട്ടുപോകരുത്",
      paymentSuccess: "പണമടയ്ക്കൽ വിജയകരം",
      paymentFailed: "പണമടയ്ക്കൽ പരാജയപ്പെട്ടു",
      tryAgain: "വീണ്ടും ശ്രമിക്കുക",
      txnRef: "ട്രാൻസാക്ഷൻ റഫ്",
      printBill: "ബിൽ അച്ചടിക്കുക",
      collectAtCounter: "കൗണ്ടറിൽ നിന്ന് സാധനങ്ങൾ ശേഖരിക്കുക",
      thankYou: "നിങ്ങളുടെ വഴിപാടിന് നന്ദി",
    },
  };
  const t = T[lang];

  const reset = () => {
    setPrimaryName(""); setPrimaryNakshatram(""); setPhone("");
    setVCart([]); setRCart([]); setStep(1); setFeedback(null);
    setPaymentMode(null); setPaymentStatus("idle"); setPaymentTxnRef("");
  };

  const addVazhipadu = (v) => {
    setVCart((c) => [
      ...c,
      { lineId: `kl-${Date.now()}-${c.length}`, vazhipaduId: v.id, devoteeName: primaryName, nakshatram: primaryNakshatram },
    ]);
  };
  const removeVLine = (lineId) => setVCart((c) => c.filter((x) => x.lineId !== lineId));

  const incRetail = (item) => {
    setRCart((c) => {
      const existing = c.find((x) => x.itemId === item.id);
      if (existing) {
        if (existing.qty >= item.counterQty) return c;
        return c.map((x) => (x.itemId === item.id ? { ...x, qty: x.qty + 1 } : x));
      }
      return [...c, { itemId: item.id, qty: 1 }];
    });
  };
  const decRetail = (itemId) => {
    setRCart((c) => {
      const existing = c.find((x) => x.itemId === itemId);
      if (!existing) return c;
      if (existing.qty <= 1) return c.filter((x) => x.itemId !== itemId);
      return c.map((x) => (x.itemId === itemId ? { ...x, qty: x.qty - 1 } : x));
    });
  };

  const vazhipaduTotal = vCart.reduce((s, l) => {
    const v = VAZHIPADU_CATALOG.find((x) => x.id === l.vazhipaduId);
    return s + (v?.price || 0);
  }, 0);
  const retailTotal = rCart.reduce((s, l) => {
    const r = retailItems.find((x) => x.id === l.itemId);
    return s + (r?.mrp || 0) * l.qty;
  }, 0);
  const grandTotal = vazhipaduTotal + retailTotal;

  // Validate cart contents before payment step
  const validateForPayment = () => {
    if (vCart.length === 0 && rCart.length === 0) {
      setFeedback({ ok: false, msg: lang === "ml" ? "ഒരു ഇനം എങ്കിലും ചേർക്കുക." : "Please add at least one item." });
      return false;
    }
    if (vCart.length > 0 && !primaryName.trim()) {
      setFeedback({ ok: false, msg: lang === "ml" ? "വഴിപാടിന് പേര് ആവശ്യമാണ്." : "Name is required for vazhipadu." });
      setStep(1);
      return false;
    }
    return true;
  };

  // User picked a payment mode → simulate payment processing
  const startPayment = (mode) => {
    setPaymentMode(mode);
    setPaymentStatus("processing");

    // SIMULATED: in production, this is where the PSP SDK call goes.
    // For UPI: open the QR/intent and poll for callback.
    // For Card: signal to the POS terminal and wait for response.
    // The setTimeout below mimics a 2.5-second payment processing window.
    setTimeout(() => {
      // Generate a fake transaction ref — production would use the PSP's response
      const ref = `${mode}-${Date.now().toString().slice(-8)}`;
      setPaymentTxnRef(ref);
      setPaymentStatus("success");

      // Now actually book the order with this payment ref
      const r = payAtKiosk(
        {
          primaryName, primaryNakshatram, phone,
          vazhipaduCart: vCart.map((l) => ({ vazhipaduId: l.vazhipaduId, devoteeName: l.devoteeName, nakshatram: l.nakshatram })),
          retailCart: rCart,
        },
        { mode, txnRef: ref }
      );

      if (r.ok) {
        // Show printable bill — keep it on screen until devotee dismisses (auto-resets afterwards)
        setPrinting(r.bill);
      } else {
        // Stock vanished between cart and payment, or other failure
        // In production we'd refund here. For prototype, surface error.
        setPaymentStatus("failed");
        setFeedback({ ok: false, msg: r.msg });
      }
    }, 2500);
  };

  // Reset payment to retry (different mode)
  const retryPayment = () => {
    setPaymentMode(null);
    setPaymentStatus("idle");
    setPaymentTxnRef("");
    setFeedback(null);
  };

  // After devotee dismisses the printed bill, reset for next devotee
  const finishAndReset = () => {
    setPrinting(null);
    reset();
  };

  return (
    <div className="bg-gradient-to-b from-amber-50 to-amber-100/50 -mx-6 -my-8 px-6 py-8 min-h-[600px]">
      {/* Language toggle floating */}
      <div className="flex justify-end mb-3">
        <div className="inline-flex bg-white border border-amber-900/30 rounded">
          <button
            onClick={() => setLang("en")}
            className={`px-4 py-1.5 text-sm ${lang === "en" ? "bg-amber-900 text-amber-50" : "text-amber-900"}`}
          >English</button>
          <button
            onClick={() => setLang("ml")}
            className={`px-4 py-1.5 text-sm ${lang === "ml" ? "bg-amber-900 text-amber-50" : "text-amber-900"}`}
            style={{ fontFamily: "'Noto Sans Malayalam', serif" }}
          >മലയാളം</button>
        </div>
      </div>

      {/* Welcome banner */}
      <div className="text-center mb-6">
        <div className="text-xs uppercase tracking-[0.3em] text-amber-800 mb-1">✦ ॐ ✦</div>
        <h2
          className="text-2xl md:text-3xl font-bold text-amber-950"
          style={{ fontFamily: lang === "ml" ? "'Noto Sans Malayalam', serif" : "'Cormorant Garamond', serif" }}
        >
          {t.welcome}
        </h2>
        <p className="text-sm text-amber-800/80 mt-1" style={{ fontFamily: lang === "ml" ? "'Noto Sans Malayalam', serif" : "inherit" }}>
          {t.subtitle}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex justify-center gap-2 mb-6">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-sm transition-colors ${
              step === n ? "bg-amber-900 text-amber-50" :
              step > n ? "bg-amber-700 text-amber-50" : "bg-white border border-amber-900/30 text-amber-800"
            }`}
          >
            {step > n ? "✓" : n}
          </div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto bg-white border border-amber-900/30 p-6 shadow-lg" style={{ fontFamily: lang === "ml" ? "'Noto Sans Malayalam', serif" : "inherit" }}>

        {/* STEP 1: DETAILS */}
        {step === 1 && (
          <div>
            <h3 className="text-xl font-bold text-amber-950 mb-4">{t.yourDetails}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm uppercase tracking-wider text-amber-900 mb-2">{t.name}</label>
                <input
                  type="text" value={primaryName} onChange={(e) => setPrimaryName(e.target.value)}
                  className="w-full bg-amber-50/40 border-2 border-amber-900/30 px-4 py-3 text-lg focus:border-amber-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-wider text-amber-900 mb-2">{t.nakshatram}</label>
                <select
                  value={primaryNakshatram} onChange={(e) => setPrimaryNakshatram(e.target.value)}
                  className="w-full bg-amber-50/40 border-2 border-amber-900/30 px-4 py-3 text-lg focus:border-amber-900 focus:outline-none"
                  style={{ fontFamily: "inherit" }}
                >
                  <option value="">— —</option>
                  {NAKSHATRAMS.map((n) => (
                    <option key={n.name} value={n.name}>{n.name} · {n.malayalam}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm uppercase tracking-wider text-amber-900 mb-2">{t.phone}</label>
                <input
                  type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-amber-50/40 border-2 border-amber-900/30 px-4 py-3 text-lg focus:border-amber-900 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: VAZHIPADU */}
        {step === 2 && (
          <div>
            <h3 className="text-xl font-bold text-amber-950 mb-1">{t.vazhipaduStep}</h3>
            <p className="text-sm text-amber-700/80 italic mb-4">{t.vazhipaduOpt}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VAZHIPADU_CATALOG.map((v) => {
                const inCart = vCart.filter((l) => l.vazhipaduId === v.id).length;
                return (
                  <button
                    key={v.id}
                    onClick={() => addVazhipadu(v)}
                    className={`text-left p-4 border-2 transition-colors ${
                      inCart > 0 ? "bg-amber-100 border-amber-700" : "bg-white border-amber-900/20 hover:border-amber-900 hover:bg-amber-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-amber-950 text-base">{lang === "ml" ? v.malayalam : v.name}</div>
                        {lang === "en" && <div className="text-xs text-amber-800/70" style={{ fontFamily: "'Noto Sans Malayalam', serif" }}>{v.malayalam}</div>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-amber-900">₹{v.price}</div>
                        {inCart > 0 && <div className="text-xs text-amber-700 font-bold">{t.perItem}{inCart}</div>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {vCart.length > 0 && (
              <div className="mt-4 bg-amber-50/60 border border-amber-900/20 p-3">
                <div className="text-xs uppercase tracking-wider text-amber-800 mb-2">{t.cart}</div>
                {vCart.map((l) => {
                  const v = VAZHIPADU_CATALOG.find((x) => x.id === l.vazhipaduId);
                  return (
                    <div key={l.lineId} className="flex justify-between items-center py-1">
                      <span className="text-sm">{lang === "ml" ? v.malayalam : v.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-amber-900">₹{v.price}</span>
                        <button onClick={() => removeVLine(l.lineId)} className="text-amber-700/60 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: RETAIL */}
        {step === 3 && (
          <div>
            <h3 className="text-xl font-bold text-amber-950 mb-1">{t.retailStep}</h3>
            <p className="text-sm text-amber-700/80 italic mb-4">{t.retailOpt}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[450px] overflow-y-auto">
              {retailItems.filter((r) => r.counterQty > 0).map((item) => {
                const inCart = rCart.find((c) => c.itemId === item.id);
                return (
                  <div key={item.id} className={`p-3 border-2 ${inCart ? "bg-amber-100 border-amber-700" : "bg-white border-amber-900/20"}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-amber-950 text-sm">{item.name}</div>
                        {item.brand !== "—" && <div className="text-xs text-amber-700">{item.brand} · {item.packSize}</div>}
                      </div>
                      <div className="text-base font-bold text-amber-900">₹{item.mrp}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      {inCart ? (
                        <div className="flex items-center gap-2 w-full justify-between">
                          <button onClick={() => decRetail(item.id)} className="bg-amber-900 text-amber-50 w-10 h-10 text-xl font-bold">−</button>
                          <span className="text-xl font-bold text-amber-950">{inCart.qty}</span>
                          <button onClick={() => incRetail(item)} className="bg-amber-900 text-amber-50 w-10 h-10 text-xl font-bold">+</button>
                        </div>
                      ) : (
                        <button onClick={() => incRetail(item)} className="w-full bg-amber-900 text-amber-50 py-2 text-sm font-semibold">+ Add</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW */}
        {step === 4 && (
          <div>
            <h3 className="text-xl font-bold text-amber-950 mb-4">{t.review}</h3>
            <div className="bg-amber-50/60 border border-amber-900/20 p-4 mb-4">
              <div className="text-sm text-amber-800/80">{t.name}: <strong>{primaryName || "—"}</strong></div>
              {primaryNakshatram && <div className="text-sm text-amber-800/80">{t.nakshatram}: <strong>{primaryNakshatram}</strong></div>}
            </div>

            {vCart.length > 0 && (
              <div className="mb-3">
                <div className="text-xs uppercase tracking-wider text-amber-900 mb-2">{lang === "ml" ? "വഴിപാട്" : "Vazhipadu"}</div>
                {vCart.map((l) => {
                  const v = VAZHIPADU_CATALOG.find((x) => x.id === l.vazhipaduId);
                  return (
                    <div key={l.lineId} className="flex justify-between text-sm py-1 border-b border-amber-900/10 last:border-0">
                      <span>{v.name} {l.devoteeName && `· ${l.devoteeName}`}</span>
                      <span className="tabular-nums font-semibold">₹{v.price}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {rCart.length > 0 && (
              <div className="mb-3">
                <div className="text-xs uppercase tracking-wider text-amber-900 mb-2">{lang === "ml" ? "സാധനങ്ങൾ" : "Items"}</div>
                {rCart.map((c) => {
                  const item = retailItems.find((x) => x.id === c.itemId);
                  return (
                    <div key={c.itemId} className="flex justify-between text-sm py-1 border-b border-amber-900/10 last:border-0">
                      <span>{item.name} × {c.qty}</span>
                      <span className="tabular-nums font-semibold">₹{c.qty * item.mrp}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between items-baseline pt-3 border-t-2 border-double border-amber-900/40">
              <span className="text-lg uppercase tracking-wider text-amber-900">{t.total}</span>
              <span className="text-3xl font-bold tabular-nums text-amber-950">₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>

            {feedback && (
              <div className={`mt-3 px-3 py-2 text-sm border-l-4 ${feedback.ok ? "border-green-700 bg-green-50 text-green-900" : "border-red-700 bg-red-50 text-red-900"}`}>
                {feedback.msg}
              </div>
            )}

            <button
              onClick={() => { if (validateForPayment()) setStep(5); }}
              disabled={grandTotal === 0}
              className="w-full mt-4 bg-amber-900 hover:bg-amber-950 disabled:bg-stone-300 disabled:cursor-not-allowed text-amber-50 py-4 text-lg font-bold tracking-wide flex items-center justify-center gap-2"
            >
              <IndianRupee className="w-5 h-5" /> {t.payNow} · ₹{grandTotal.toLocaleString("en-IN")}
            </button>
          </div>
        )}

        {/* STEP 5: PAYMENT */}
        {step === 5 && (
          <div>
            <h3 className="text-xl font-bold text-amber-950 mb-2">{t.paymentStep}</h3>
            <div className="bg-amber-100/60 border border-amber-900/30 px-4 py-3 mb-5 text-center">
              <div className="text-xs uppercase tracking-wider text-amber-800">{t.total}</div>
              <div className="text-4xl font-bold tabular-nums text-amber-950">₹{grandTotal.toLocaleString("en-IN")}</div>
            </div>

            {/* Idle: choose payment mode */}
            {paymentStatus === "idle" && (
              <div>
                <p className="text-sm text-amber-800 text-center mb-4">{t.choosePayment}</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => startPayment("UPI")}
                    className="p-5 border-2 border-amber-900/30 bg-white hover:border-amber-900 hover:bg-amber-50 transition-colors"
                  >
                    <div className="text-4xl mb-2">📱</div>
                    <div className="font-bold text-amber-950">{t.payUPI}</div>
                    <div className="text-[10px] text-amber-700 mt-1">{t.scanQR}</div>
                  </button>
                  <button
                    onClick={() => startPayment("Card")}
                    className="p-5 border-2 border-amber-900/30 bg-white hover:border-amber-900 hover:bg-amber-50 transition-colors"
                  >
                    <div className="text-4xl mb-2">💳</div>
                    <div className="font-bold text-amber-950">{t.payCard}</div>
                    <div className="text-[10px] text-amber-700 mt-1">{t.tapCard}</div>
                  </button>
                  <button
                    onClick={() => startPayment("NETC")}
                    className="p-5 border-2 border-amber-900/30 bg-white hover:border-amber-900 hover:bg-amber-50 transition-colors"
                  >
                    <div className="text-4xl mb-2">⚡</div>
                    <div className="font-bold text-amber-950">{t.payNETC}</div>
                  </button>
                </div>
              </div>
            )}

            {/* Processing */}
            {paymentStatus === "processing" && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin w-16 h-16 border-4 border-amber-900 border-t-transparent rounded-full mb-4"></div>
                <div className="text-lg font-bold text-amber-950">{t.processing}</div>
                <div className="text-sm text-amber-800/80 mt-1">{t.pleaseWait}</div>
                <div className="text-xs text-amber-700/70 italic mt-3">via {paymentMode}</div>
              </div>
            )}

            {/* Failed */}
            {paymentStatus === "failed" && (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">⚠️</div>
                <div className="text-lg font-bold text-red-800">{t.paymentFailed}</div>
                {feedback?.msg && <div className="text-sm text-red-700 mt-2">{feedback.msg}</div>}
                <button onClick={retryPayment} className="mt-4 bg-amber-900 text-amber-50 px-6 py-2 font-semibold">
                  {t.tryAgain}
                </button>
              </div>
            )}

            {/* Success — bill prints automatically; this is just visible while modal is open */}
            {paymentStatus === "success" && !printing && (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">✓</div>
                <div className="text-lg font-bold text-green-800">{t.paymentSuccess}</div>
                <div className="text-xs text-amber-700 mt-2">{t.txnRef}: <span className="font-mono">{paymentTxnRef}</span></div>
              </div>
            )}
          </div>
        )}

        {/* Step navigation */}
        {step !== 5 && (
          <div className="flex justify-between mt-6 pt-4 border-t border-amber-900/15">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="px-5 py-2 border border-amber-900/30 text-amber-900 disabled:opacity-30"
            >
              {t.back}
            </button>
            {step < 4 && (
              <button
                onClick={() => setStep((s) => Math.min(5, s + 1))}
                className="bg-amber-900 text-amber-50 px-6 py-2 font-semibold"
              >
                {t.next}
              </button>
            )}
            <button onClick={reset} className="px-5 py-2 text-amber-700 hover:text-red-700">
              {t.cancel}
            </button>
          </div>
        )}

        {/* Step 5 has its own back/cancel — only when not processing */}
        {step === 5 && paymentStatus === "idle" && (
          <div className="flex justify-between mt-6 pt-4 border-t border-amber-900/15">
            <button onClick={() => setStep(4)} className="px-5 py-2 border border-amber-900/30 text-amber-900">{t.back}</button>
            <button onClick={reset} className="px-5 py-2 text-amber-700 hover:text-red-700">{t.cancel}</button>
          </div>
        )}
      </div>

      {/* Printable kiosk slip */}
      {printing && <KioskSlip bill={printing} lang={lang} onClose={finishAndReset} />}
    </div>
  );
}

// ----- Dispatch queue: paid kiosk orders awaiting item handover -----
export function DispatchQueueBanner({ orders, onDispatch, setLastBill }) {
  const handleDispatch = (order) => {
    onDispatch(order.id, "Counter Staff");
  };

  // Build a bill object from a kiosk order so the existing BillSlip component can render it
  const buildBillFromOrder = (o) => ({
    billNo: o.billNo,
    time: o.paidAt,
    total: o.total,
    lines: o.vazhipaduLines || [],
    retailLines: o.retailLines || [],
    paymentMode: o.paymentMode,
    paymentTxnRef: o.paymentTxnRef,
    primaryName: o.primaryName,
    primaryNakshatram: o.primaryNakshatram,
    tokenNo: o.tokenNo,
    fromKiosk: true,
    paid: true,
  });

  return (
    <div className="mb-6 bg-green-50 border-l-4 border-green-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm uppercase tracking-wider text-green-900 font-bold flex items-center gap-2">
          <Users className="w-4 h-4" /> Awaiting Dispatch — Paid at Kiosk ({orders.length})
        </h3>
        <span className="text-[10px] text-green-800 italic">Devotees have paid · hand over items and confirm</span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {orders.map((o) => (
          <div key={o.id} className="bg-white border border-green-300 p-3">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <div className="text-3xl font-bold tabular-nums text-green-900">{o.tokenNo}</div>
                <div className="text-xs text-amber-800 truncate">{o.primaryName || "—"}{o.primaryNakshatram && ` · ${o.primaryNakshatram}`}</div>
                <div className="text-[10px] text-amber-700/70">
                  Paid {new Date(o.paidAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} via {o.paymentMode}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-bold tabular-nums text-amber-950">₹{o.total}</div>
                <div className="text-[10px] bg-green-200 text-green-900 px-1.5 py-0.5 inline-block">PAID</div>
              </div>
            </div>

            {/* Items at-a-glance */}
            <div className="text-xs text-amber-800 mb-2 space-y-0.5 max-h-20 overflow-y-auto">
              {o.vazhipaduLines?.map((l, i) => <div key={`v${i}`}>🛕 {l.vazhipaduName}{l.area && ` → ${l.area}`}</div>)}
              {o.retailLines?.map((l, i) => <div key={`r${i}`}>📦 {l.name} × {l.qty}</div>)}
            </div>

            <div className="flex gap-1">
              <button onClick={() => setLastBill(buildBillFromOrder(o))} className="flex-1 border border-amber-900/30 text-amber-900 text-xs py-1.5">View / Reprint</button>
              <button onClick={() => handleDispatch(o)} className="flex-1 bg-green-700 hover:bg-green-800 text-white text-xs py-1.5 font-semibold flex items-center justify-center gap-1">
                <Check className="w-3 h-3" /> Dispatched
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----- Printable Kiosk Slip (devotee carries to counter) -----
export function KioskSlip({ bill, lang, onClose }) {
  // Group vazhipadu lines by area for the dispatch section
  const byArea = {};
  for (const line of (bill.lines || [])) {
    if (!byArea[line.area]) byArea[line.area] = [];
    byArea[line.area].push(line);
  }

  return (
    <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center z-50 p-4 print:bg-white print:p-0 print:static" onClick={onClose}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #kiosk-slip-print, #kiosk-slip-print * { visibility: visible; }
          #kiosk-slip-print { position: absolute; left: 0; top: 0; width: 100%; background: white !important; font-family: 'Courier New', monospace; }
          #kiosk-slip-print .no-print { display: none !important; }
        }
        @page { margin: 8mm; size: 80mm auto; }
      `}</style>
      <div id="kiosk-slip-print" onClick={(e) => e.stopPropagation()} className="bg-white max-w-xs w-full max-h-[90vh] overflow-y-auto shadow-2xl print:max-h-none print:max-w-none print:shadow-none" style={{ fontFamily: "'Courier New', monospace" }}>
        <div className="no-print bg-amber-900 text-amber-50 px-3 py-2 flex items-center justify-between sticky top-0 z-10">
          <span className="text-xs uppercase tracking-wider">Bill — Paid</span>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="bg-amber-50 text-amber-900 px-2 py-1 text-xs font-semibold flex items-center gap-1"><Printer className="w-3 h-3"/> {lang === "ml" ? "അച്ചടിക്കുക" : "Print"}</button>
            <button onClick={onClose} className="bg-green-700 text-white px-2 py-1 text-xs font-semibold">{lang === "ml" ? "പൂർത്തിയാക്കുക" : "Done"}</button>
          </div>
        </div>
        <div className="p-4">
          <div className="text-center border-b-2 border-double border-stone-800 pb-2 mb-2">
            <div className="text-xs">✦ ॐ ✦</div>
            <div className="text-base font-bold tracking-wider">NELLIAKATTU OUSHADHEESWARI</div>
            <div className="text-[10px] font-semibold">TEMPLE</div>
            <div className="text-[9px] mt-0.5">Kizhakombu PO, Koothattukulam — 686662</div>
          </div>

          {/* PAID stamp + token */}
          <div className="text-center my-2 py-2 border-y-2 border-stone-800 relative">
            <div className="absolute top-1 right-1 transform rotate-12 border-2 border-green-700 text-green-700 px-2 py-0.5 text-[10px] font-bold tracking-wider">
              ✓ PAID
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em]">Token</div>
            <div className="text-4xl font-bold tracking-wider tabular-nums">{bill.tokenNo}</div>
            <div className="text-[9px] italic mt-0.5">Show at counter to collect items</div>
          </div>

          <div className="text-xs mb-2">
            <div className="flex justify-between"><span>Bill:</span><strong>{bill.billNo}</strong></div>
            <div className="flex justify-between"><span>Time:</span><span>{new Date(bill.time).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span></div>
            {bill.primaryName && <div className="flex justify-between"><span>Devotee:</span><strong>{bill.primaryName}</strong></div>}
            {bill.primaryNakshatram && <div className="flex justify-between"><span>Nakshatram:</span><span>{bill.primaryNakshatram}</span></div>}
          </div>

          {bill.lines && bill.lines.length > 0 && (
            <table className="w-full text-xs border-t border-stone-800 my-2">
              <thead><tr className="border-b border-stone-400"><th className="text-left py-1">Vazhipadu</th><th className="text-right py-1">₹</th></tr></thead>
              <tbody>
                {bill.lines.map((l, i) => (
                  <tr key={i} className="border-b border-stone-300">
                    <td className="py-1">
                      {l.vazhipaduName}
                      {l.devoteeName && <div className="text-[9px] text-stone-600">{l.devoteeName}{l.nakshatram && ` · ${l.nakshatram}`}</div>}
                    </td>
                    <td className="py-1 text-right tabular-nums">{l.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {bill.retailLines && bill.retailLines.length > 0 && (
            <table className="w-full text-xs border-t border-stone-800 my-2">
              <thead><tr className="border-b border-stone-400"><th className="text-left py-1">Item</th><th className="text-right py-1">Qty</th><th className="text-right py-1">₹</th></tr></thead>
              <tbody>
                {bill.retailLines.map((l, i) => (
                  <tr key={i} className="border-b border-stone-300">
                    <td className="py-1">{l.name}{l.brand && l.brand !== "—" && <div className="text-[9px] text-stone-600">{l.brand}</div>}</td>
                    <td className="py-1 text-right tabular-nums">{l.qty}</td>
                    <td className="py-1 text-right tabular-nums">{l.lineTotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <table className="w-full text-xs border-t-2 border-stone-800 mt-2">
            <tbody>
              <tr className="font-bold">
                <td className="py-2 text-right text-base">TOTAL PAID</td>
                <td className="py-2 text-right tabular-nums text-lg">₹ {bill.total}</td>
              </tr>
              <tr className="text-[10px]">
                <td className="text-right">Mode:</td>
                <td className="text-right">{bill.paymentMode}</td>
              </tr>
              {bill.paymentTxnRef && (
                <tr className="text-[9px] text-stone-600">
                  <td className="text-right">Txn:</td>
                  <td className="text-right font-mono">{bill.paymentTxnRef}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Counter Dispatch sections — what to collect / where things go */}
          <div className="mt-3 pt-2 border-t-2 border-stone-800">
            <div className="text-[10px] uppercase tracking-wider text-stone-700 mb-1 text-center bg-stone-100 py-0.5">
              Counter Collection
            </div>

            {bill.retailLines && bill.retailLines.length > 0 && (
              <div className="mb-1.5 border border-stone-800 p-1.5">
                <div className="text-[10px] uppercase tracking-wider font-bold mb-0.5">
                  📦 Collect at Counter
                </div>
                {bill.retailLines.map((l, i) => (
                  <div key={i} className="flex justify-between text-[10px] py-0.5">
                    <span>☐ {l.name}{l.brand && l.brand !== "—" && ` (${l.brand})`}</span>
                    <span className="font-bold tabular-nums">× {l.qty}</span>
                  </div>
                ))}
              </div>
            )}

            {Object.entries(byArea).map(([area, lines]) => (
              <div key={area} className="mb-1.5 border border-stone-800 p-1.5">
                <div className="text-[10px] uppercase tracking-wider font-bold mb-0.5">
                  🛕 {area}
                </div>
                {lines.map((l, i) => (
                  <div key={i} className="text-[10px] py-0.5">
                    <div className="flex justify-between">
                      <span>☐ {l.vazhipaduName}</span>
                      <span className="text-[9px] text-stone-600">{l.devoteeName}</span>
                    </div>
                    {l.nakshatram && <div className="text-[9px] text-stone-600 ml-3">{l.nakshatram}</div>}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="text-center text-[10px] mt-3 italic border-t border-dashed border-stone-400 pt-2">
            {lang === "ml" ? "നിങ്ങളുടെ വഴിപാടിന് നന്ദി" : "Thank you for your offering"}<br/>
            ✦ {lang === "ml" ? "ദൈവാനുഗ്രഹം" : "Blessings"} ✦
          </div>
        </div>
      </div>
    </div>
  );
}

