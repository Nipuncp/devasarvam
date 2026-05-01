import { Receipt, X, Printer } from "lucide-react";

// =================== PRINTABLE BILL SLIP ===================
export function BillSlip({ bill, onClose }) {
  const handlePrint = () => {
    window.print();
  };

  const billDate = new Date(bill.time);

  return (
    <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center z-50 p-4 print:bg-white print:p-0 print:static" onClick={onClose}>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #bill-slip-print, #bill-slip-print * { visibility: visible; }
          #bill-slip-print {
            position: absolute; left: 0; top: 0; width: 100%;
            background: white !important;
            font-family: 'Courier New', monospace;
          }
          #bill-slip-print .no-print { display: none !important; }
          .print-page-break { page-break-after: always; }
        }
        @page { margin: 10mm; size: A5; }
      `}</style>

      <div
        id="bill-slip-print"
        onClick={(e) => e.stopPropagation()}
        className="bg-white max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl print:max-h-none print:max-w-none print:shadow-none print:overflow-visible"
        style={{ fontFamily: "'Courier New', monospace" }}
      >
        {/* Action bar (hidden on print) */}
        <div className="no-print bg-amber-900 text-amber-50 px-4 py-2 flex items-center justify-between sticky top-0 z-10">
          <span className="text-sm uppercase tracking-wider">Bill Preview</span>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="bg-amber-50 text-amber-900 px-3 py-1 text-xs font-semibold flex items-center gap-1 hover:bg-amber-100">
              <Printer className="w-3 h-3" /> Print
            </button>
            <button onClick={onClose} className="text-amber-50 hover:text-white p-1" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The slip itself — repeated twice for original + counterfoil */}
        {["ORIGINAL — DEVOTEE COPY", "COUNTERFOIL — TEMPLE OFFICE"].map((label, copyIdx) => (
          <div key={copyIdx} className={`p-6 ${copyIdx === 0 ? "border-b-2 border-dashed border-stone-400" : ""}`}>
            {/* Header */}
            <div className="text-center border-b-2 border-double border-stone-800 pb-3 mb-3">
              <div className="text-xs">✦ ॐ ✦</div>
              <div className="text-lg font-bold tracking-wider mt-1">NELLIAKATTU OUSHADHEESWARI TEMPLE</div>
              <div className="text-[10px] mt-0.5">Kizhakombu PO, Koothattukulam — 686662</div>
              <div className="text-[10px] uppercase tracking-[0.2em] mt-2">
                {bill.lines?.length > 0 && bill.retailLines?.length > 0 ? "Vazhipadu & Sales Receipt" :
                 (!bill.lines || bill.lines.length === 0) && bill.retailLines?.length > 0 ? "Sales Receipt" :
                 "Vazhipadu Receipt"}
              </div>
            </div>

            {/* Bill meta */}
            <div className="flex justify-between text-xs mb-3">
              <div>
                <div><strong>Bill No:</strong> {bill.billNo}</div>
                <div><strong>Date:</strong> {billDate.toLocaleDateString("en-IN")}</div>
                {bill.primaryName && <div><strong>Devotee:</strong> {bill.primaryName}</div>}
              </div>
              <div className="text-right">
                <div><strong>Time:</strong> {billDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                {bill.paymentMode && <div><strong>Pay:</strong> {bill.paymentMode}</div>}
                <div className="text-[10px] uppercase tracking-wider mt-1 bg-stone-800 text-white px-2 py-0.5 inline-block">{label}</div>
              </div>
            </div>

            {/* Vazhipadu lines */}
            {bill.lines && bill.lines.length > 0 && (
              <table className="w-full text-xs border-t border-b border-stone-800 mb-2">
                <thead>
                  <tr className="border-b border-stone-400">
                    <th className="text-left py-1 pr-1">#</th>
                    <th className="text-left py-1 pr-1">Vazhipadu</th>
                    <th className="text-left py-1 pr-1">Devotee / Nakshatram</th>
                    <th className="text-right py-1">₹</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.lines.map((l, idx) => (
                    <tr key={l.id || idx} className="border-b border-stone-300 align-top">
                      <td className="py-1 pr-1">{l.lineNo || idx + 1}</td>
                      <td className="py-1 pr-1">
                        <div>{l.vazhipaduName}</div>
                        <div className="text-[10px] text-stone-600">→ {l.area}</div>
                      </td>
                      <td className="py-1 pr-1">
                        <div>{l.devoteeName}</div>
                        {l.nakshatram && <div className="text-[10px] text-stone-600">{l.nakshatram}</div>}
                      </td>
                      <td className="py-1 text-right tabular-nums">{l.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Retail lines */}
            {bill.retailLines && bill.retailLines.length > 0 && (
              <table className="w-full text-xs border-t border-b border-stone-800 mb-2">
                <thead>
                  <tr className="border-b border-stone-400">
                    <th className="text-left py-1 pr-1">#</th>
                    <th className="text-left py-1 pr-1">Item</th>
                    <th className="text-right py-1 pr-1">Qty</th>
                    <th className="text-right py-1 pr-1">Rate</th>
                    <th className="text-right py-1">₹</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.retailLines.map((l, idx) => (
                    <tr key={idx} className="border-b border-stone-300">
                      <td className="py-1 pr-1">{(bill.lines?.length || 0) + idx + 1}</td>
                      <td className="py-1 pr-1">
                        {l.name}
                        {l.brand && l.brand !== "—" && <div className="text-[10px] text-stone-600">{l.brand} · {l.packSize}</div>}
                      </td>
                      <td className="py-1 text-right tabular-nums">{l.qty}</td>
                      <td className="py-1 text-right tabular-nums">{l.mrp}</td>
                      <td className="py-1 text-right tabular-nums">{l.lineTotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Combined total */}
            <table className="w-full text-xs">
              <tbody>
                {bill.lines?.length > 0 && bill.retailLines?.length > 0 && (
                  <>
                    <tr><td className="text-right">Vazhipadu subtotal</td><td className="text-right tabular-nums w-20">₹ {bill.lines.reduce((s, l) => s + l.price, 0)}</td></tr>
                    <tr><td className="text-right">Retail subtotal</td><td className="text-right tabular-nums">₹ {bill.retailLines.reduce((s, l) => s + l.lineTotal, 0)}</td></tr>
                  </>
                )}
                <tr className="border-t-2 border-stone-800 font-bold">
                  <td className="py-2 text-right">TOTAL</td>
                  <td className="py-2 text-right tabular-nums">₹ {bill.total}</td>
                </tr>
              </tbody>
            </table>

            {/* Amount in words (simple) */}
            <div className="text-[10px] mt-2 italic">
              Rupees {numberToWords(bill.total)} only
            </div>

            {/* COUNTER DISPATCH SECTION — shows when bill came from kiosk OR explicitly when retail items present */}
            {(bill.fromKiosk || (bill.retailLines && bill.retailLines.length > 0 && bill.lines && bill.lines.length > 0)) && (
              <div className="mt-3 border-t-2 border-stone-800 pt-2">
                {bill.tokenNo && (
                  <div className="text-[10px] uppercase tracking-wider text-stone-700 mb-2 text-center bg-stone-100 py-1">
                    From Kiosk Token: <strong>{bill.tokenNo}</strong>
                  </div>
                )}

                {/* Items to hand to devotee at the counter — retail items */}
                {bill.retailLines && bill.retailLines.length > 0 && (
                  <div className="mb-2 border border-stone-800 p-2">
                    <div className="text-[10px] uppercase tracking-wider font-bold mb-1 flex justify-between">
                      <span>📦 Hand To Devotee At Counter</span>
                      <span className="text-[9px] italic">(retail items)</span>
                    </div>
                    {bill.retailLines.map((l, i) => (
                      <div key={i} className="flex justify-between text-xs py-0.5 border-b border-stone-200 last:border-0">
                        <span>☐ {l.name}{l.brand && l.brand !== "—" && ` (${l.brand})`}</span>
                        <span className="font-bold tabular-nums">× {l.qty}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Items to send to sreekovil/area — vazhipadu issuances grouped by area */}
                {bill.lines && bill.lines.length > 0 && (() => {
                  // Group by area
                  const byArea = {};
                  for (const line of bill.lines) {
                    if (!byArea[line.area]) byArea[line.area] = [];
                    byArea[line.area].push(line);
                  }
                  return Object.entries(byArea).map(([area, lines]) => (
                    <div key={area} className="mb-2 border border-stone-800 p-2">
                      <div className="text-[10px] uppercase tracking-wider font-bold mb-1 flex justify-between">
                        <span>🛕 Send To: {area}</span>
                        <span className="text-[9px] italic">(pooja items)</span>
                      </div>
                      {lines.map((l, i) => (
                        <div key={i} className="text-xs py-0.5 border-b border-stone-200 last:border-0">
                          <div className="flex justify-between">
                            <span>☐ {l.vazhipaduName}</span>
                            <span className="text-[10px] text-stone-600">{l.devoteeName}</span>
                          </div>
                          {l.nakshatram && <div className="text-[9px] text-stone-600 ml-3">Nakshatram: {l.nakshatram}</div>}
                        </div>
                      ))}
                    </div>
                  ));
                })()}

                <p className="text-[9px] italic text-stone-700 text-center mt-1">
                  Counter staff: tick each item as handed over. Pooja items will be issued to the area automatically by the system.
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-dashed border-stone-400 text-[10px] flex justify-between">
              <div>
                <div className="mb-3">_____________________</div>
                <div>Devotee Signature</div>
              </div>
              <div className="text-right">
                <div className="mb-3">_____________________</div>
                <div>Counter Authorized</div>
              </div>
            </div>

            <div className="text-center text-[10px] mt-3 italic">
              ✦ May the Lord's blessings be upon you ✦
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Simple Indian-style number-to-words for amount in words
export function numberToWords(n) {
  if (n === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const twoDigits = (x) => x < 20 ? ones[x] : tens[Math.floor(x / 10)] + (x % 10 ? " " + ones[x % 10] : "");
  const threeDigits = (x) => {
    const h = Math.floor(x / 100), r = x % 100;
    return (h ? ones[h] + " Hundred" + (r ? " " : "") : "") + (r ? twoDigits(r) : "");
  };
  let result = "";
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  if (crore) result += threeDigits(crore) + " Crore ";
  if (lakh) result += twoDigits(lakh) + " Lakh ";
  if (thousand) result += twoDigits(thousand) + " Thousand ";
  if (n) result += threeDigits(n);
  return result.trim();
}

