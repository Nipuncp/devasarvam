import { useState, useEffect } from "react";
import { Package, Receipt, Plus, Check, X, AlertTriangle, Clock, Sparkles, Printer, Trash2, ClipboardList, ArrowRight, RotateCcw, Inbox, ShoppingCart, Truck } from "lucide-react";
import { CAPITAL_ITEMS, POOJA_SCHEDULE, AREAS, VERIFIERS } from "../seed/index.js";
import { Card, Field, QtyInput, formatQty, StoreStat } from "../components/ui.jsx";

// =================== STORE / REQUISITION ===================

// Compute urgency for a requisition based on requiredBy time
function getUrgency(req) {
  if (!req.requiredBy || req.status !== "Pending") return null;
  const now = Date.now();
  const due = new Date(req.requiredBy).getTime();
  const minsLeft = Math.round((due - now) / 60000);
  if (minsLeft < 0) return { level: "overdue", label: `Overdue by ${Math.abs(minsLeft)} min`, color: "red" };
  if (minsLeft <= 15) return { level: "critical", label: `Needed in ${minsLeft} min`, color: "red" };
  if (minsLeft <= 60) return { level: "soon", label: `Needed in ${minsLeft} min`, color: "orange" };
  if (minsLeft <= 240) return { level: "today", label: `Needed in ${Math.round(minsLeft / 60)} hr`, color: "amber" };
  return { level: "later", label: `Needed in ${Math.round(minsLeft / 60)} hr`, color: "stone" };
}

// Time difference in human-readable form: "12 min", "1 hr 5 min"
function timeDiff(fromIso, toIso) {
  if (!fromIso || !toIso) return "—";
  const mins = Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60000);
  if (mins < 0) return `${Math.abs(mins)} min late`;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

// Build "needed by" preset times based on next pooja (rough demo logic)
function getRequiredByPresets() {
  const now = new Date();
  const presets = [];
  // In 30 min, 1 hour, 2 hours
  [30, 60, 120].forEach((m) => {
    const t = new Date(now.getTime() + m * 60000);
    presets.push({ label: `In ${m < 60 ? m + " min" : (m / 60) + " hr"}`, iso: t.toISOString(), time: t.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) });
  });
  // Next standard poojas later today
  const todayStr = now.toISOString().split("T")[0];
  for (const p of POOJA_SCHEDULE) {
    const [h, m] = p.time.split(":");
    const poojaTime = new Date(`${todayStr}T${h}:${m}:00`);
    if (poojaTime.getTime() > now.getTime() + 60000) {
      presets.push({ label: `Before ${p.name}`, iso: poojaTime.toISOString(), time: p.time, sub: p.malayalam });
    }
  }
  return presets.slice(0, 6); // keep it tidy
}

export function Store({ inventory, requisitions, purchaseIndents, raiseRequisition, issueRequisition, rejectRequisition, returnRequisition, markIndentOrdered, markIndentReceived, cancelIndent }) {
  const [view, setView] = useState("pending"); // pending | history | new | indent

  const pending = requisitions.filter((r) => r.status === "Pending");
  const issuedCapital = requisitions.filter((r) => (r.status === "Issued" || r.status === "PartiallyIssued") && r.items.some((i) => i.kind === "capital"));
  const history = requisitions.filter((r) => r.status !== "Pending");
  const openIndents = purchaseIndents.filter((p) => p.status === "Open");
  const orderedIndents = purchaseIndents.filter((p) => p.status === "Ordered");

  // Avg time to deliver across issued requisitions
  const issued = requisitions.filter((r) => r.status === "Issued" || r.status === "PartiallyIssued" || r.status === "Returned");
  const avgDeliverMins = issued.length
    ? Math.round(
        issued.reduce((s, r) => s + (new Date(r.issuedAt).getTime() - new Date(r.raisedAt).getTime()) / 60000, 0) / issued.length
      )
    : 0;
  const overdueCount = pending.filter((r) => r.requiredBy && new Date(r.requiredBy).getTime() < Date.now()).length;
  const partialCount = requisitions.filter((r) => r.status === "PartiallyIssued").length;

  return (
    <div>
      {/* Stats strip */}
      <div className="grid sm:grid-cols-4 gap-3 mb-6">
        <StoreStat label="Pending Requests" value={pending.length} sub={overdueCount > 0 ? `${overdueCount} overdue` : null} accent />
        <StoreStat label="Partial Issues" value={partialCount} sub="Have shortages" />
        <StoreStat label="Open Indents" value={openIndents.length} sub={`${orderedIndents.length} on order`} />
        <StoreStat label="Avg. Delivery Time" value={avgDeliverMins ? `${avgDeliverMins} min` : "—"} sub={`Across ${issued.length} issued`} />
      </div>

      {/* View tabs */}
      <div className="flex gap-1 mb-5 border-b border-amber-900/20 overflow-x-auto">
        {[
          { id: "pending", label: `Pending Queue (${pending.length})`, icon: Inbox },
          { id: "new", label: "Raise New", icon: Plus },
          { id: "indent", label: `Purchase Indent (${openIndents.length + orderedIndents.length})`, icon: ShoppingCart },
          { id: "history", label: `Issue Register (${history.length})`, icon: ClipboardList },
        ].map((s) => {
          const Ic = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setView(s.id)}
              className={`flex items-center gap-2 px-3 py-2 text-sm whitespace-nowrap border-b-2 ${
                view === s.id ? "border-amber-900 text-amber-950 font-semibold" : "border-transparent text-amber-800/70"
              }`}
            >
              <Ic className="w-4 h-4" />
              {s.label}
            </button>
          );
        })}
      </div>

      {view === "pending" && (
        <PendingQueue
          pending={pending}
          issuedCapital={issuedCapital}
          inventory={inventory}
          onIssue={issueRequisition}
          onReject={rejectRequisition}
          onReturn={returnRequisition}
        />
      )}
      {view === "new" && <NewRequisition inventory={inventory} onRaise={raiseRequisition} onDone={() => setView("pending")} />}
      {view === "indent" && (
        <PurchaseIndentView
          indents={purchaseIndents}
          inventory={inventory}
          onOrder={markIndentOrdered}
          onReceive={markIndentReceived}
          onCancel={cancelIndent}
        />
      )}
      {view === "history" && <IssueRegister history={history} />}
    </div>
  );
}

// ----- Pending queue: store keeper acts on requests -----
function PendingQueue({ pending, issuedCapital, inventory, onIssue, onReject, onReturn }) {
  const [feedback, setFeedback] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [printing, setPrinting] = useState(null);
  const [issuingReq, setIssuingReq] = useState(null); // requisition being issued via dialog
  const [returningReq, setReturningReq] = useState(null); // capital item being returned
  const [, setTick] = useState(0); // forces re-render so urgency labels stay current

  // Re-evaluate urgency every 30 seconds
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  // Sort pending: overdue + critical first, then by requiredBy ascending; null requiredBy goes last
  const sortedPending = [...pending].sort((a, b) => {
    if (!a.requiredBy && !b.requiredBy) return new Date(a.raisedAt) - new Date(b.raisedAt);
    if (!a.requiredBy) return 1;
    if (!b.requiredBy) return -1;
    return new Date(a.requiredBy) - new Date(b.requiredBy);
  });

  // When confirmed in the IssueDialog
  const handleConfirmIssue = (req, details) => {
    const r = onIssue(req.id, details);
    setFeedback({ id: req.id, ...r });
    if (r.ok) {
      setIssuingReq(null);
      // Build a fresh enriched record for the printable slip
      setPrinting({
        ...req,
        status: "Issued",
        issuedAt: details.issuedAt,
        issuedBy: details.issuedBy,
        receivedBy: details.receivedBy,
        issueRemark: details.remark,
      });
    }
    setTimeout(() => setFeedback(null), 4000);
    return r; // dialog reads .ok to know whether to close
  };

  const handleConfirmReturn = (req, details) => {
    onReturn(req.id, details);
    setReturningReq(null);
    return { ok: true };
  };

  return (
    <>
      {pending.length === 0 && issuedCapital.length === 0 && (
        <div className="text-center py-12 text-amber-800/60">
          <Inbox className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm italic">No pending requisitions. Raise a new one from the tab above.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm uppercase tracking-wider text-amber-900 font-semibold mb-3">Awaiting Issue · sorted by urgency</h3>
          <div className="space-y-3">
            {sortedPending.map((req) => (
              <RequisitionCard
                key={req.id}
                req={req}
                inventory={inventory}
                actions={
                  <>
                    <button onClick={() => setIssuingReq(req)} className="bg-amber-900 hover:bg-amber-950 text-amber-50 px-4 py-2 text-sm flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Issue
                    </button>
                    <button onClick={() => { setRejectingId(req.id); setRejectReason(""); }} className="border border-red-700/50 text-red-800 hover:bg-red-50 px-3 py-2 text-sm">
                      Reject
                    </button>
                  </>
                }
                feedback={feedback?.id === req.id ? feedback : null}
              />
            ))}
          </div>
        </div>
      )}

      {issuedCapital.length > 0 && (
        <div>
          <h3 className="text-sm uppercase tracking-wider text-amber-900 font-semibold mb-3">Capital Items Out — Awaiting Return</h3>
          <div className="space-y-3">
            {issuedCapital.map((req) => (
              <RequisitionCard
                key={req.id}
                req={req}
                inventory={inventory}
                showStatus
                actions={
                  <button onClick={() => setReturningReq(req)} className="bg-amber-900 hover:bg-amber-950 text-amber-50 px-4 py-2 text-sm flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4" /> Mark Returned
                  </button>
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Reject dialog */}
      {rejectingId && (
        <div className="fixed inset-0 bg-stone-900/40 flex items-center justify-center z-50 p-4" onClick={() => setRejectingId(null)}>
          <div className="bg-amber-50 border-2 border-amber-900/40 max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-amber-950 mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Reject Requisition</h3>
            <textarea
              autoFocus
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason (e.g. insufficient stock, item not available)…"
              rows={3}
              className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm focus:border-amber-900 focus:outline-none mb-3"
            />
            <div className="flex gap-2">
              <button onClick={() => { onReject(rejectingId, rejectReason); setRejectingId(null); }} className="flex-1 bg-red-700 text-white py-2 text-sm font-semibold">Confirm Reject</button>
              <button onClick={() => setRejectingId(null)} className="px-4 py-2 border border-amber-900/40 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Issue dialog — captures store keeper, receiver, timestamp */}
      {issuingReq && (
        <IssueDialog
          req={issuingReq}
          onConfirm={(details) => handleConfirmIssue(issuingReq, details)}
          onClose={() => setIssuingReq(null)}
        />
      )}

      {/* Return dialog — for capital items */}
      {returningReq && (
        <ReturnDialog
          req={returningReq}
          onConfirm={(details) => handleConfirmReturn(returningReq, details)}
          onClose={() => setReturningReq(null)}
        />
      )}

      {/* Printable issue slip */}
      {printing && <IssueSlip req={printing} onClose={() => setPrinting(null)} />}
    </>
  );
}

// ----- Reusable requisition card -----
function RequisitionCard({ req, inventory, actions, feedback, showStatus }) {
  const urgency = getUrgency(req);
  const urgencyColors = {
    red: "bg-red-100 text-red-800 border-red-400",
    orange: "bg-orange-100 text-orange-800 border-orange-400",
    amber: "bg-amber-100 text-amber-900 border-amber-400",
    stone: "bg-stone-100 text-stone-700 border-stone-300",
  };
  const cardBorder = urgency?.level === "overdue" || urgency?.level === "critical" ? "border-red-400" : urgency?.level === "soon" ? "border-orange-400" : "border-amber-900/20";

  return (
    <div className={`bg-amber-50/40 border-l-4 ${cardBorder} border-y border-r border-y-amber-900/20 border-r-amber-900/20 p-4`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-wider text-amber-700 font-mono">{req.reqNo}</span>
            <span className="text-sm">
              <strong className="text-amber-950">{req.requestedBy}</strong>
              <ArrowRight className="inline w-3 h-3 mx-1 text-amber-700" />
              <span className="text-amber-900">{req.forArea}</span>
            </span>
            {urgency && (
              <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 border ${urgencyColors[urgency.color]} flex items-center gap-1`}>
                <Clock className="w-3 h-3" /> {urgency.label}
              </span>
            )}
            {showStatus && (
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-orange-200 text-orange-900">Out</span>
            )}
          </div>
          {req.purpose && <div className="text-xs text-amber-800/70 italic mt-1">"{req.purpose}"</div>}

          {/* Time strip */}
          <div className="text-[11px] text-amber-700/80 mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
            <span><strong className="text-amber-900">Raised:</strong> {new Date(req.raisedAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span>
            {req.requiredBy && (
              <span><strong className="text-amber-900">Needed by:</strong> {new Date(req.requiredBy).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span>
            )}
            {req.issuedAt && (
              <span><strong className="text-amber-900">Issued:</strong> {new Date(req.issuedAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                {" "}<span className="text-green-700 font-semibold">({timeDiff(req.raisedAt, req.issuedAt)} to deliver)</span>
              </span>
            )}
            {req.returnedAt && (
              <span><strong className="text-amber-900">Returned:</strong> {new Date(req.returnedAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span>
            )}
          </div>

          {/* Audit strip — who issued, who received */}
          {(req.issuedBy || req.returnedBy) && (
            <div className="text-[11px] text-amber-800 mt-1 flex flex-wrap gap-x-3 gap-y-0.5 bg-amber-100/40 px-2 py-1 border-l-2 border-amber-700/40">
              {req.issuedBy && <span><strong>Issued by:</strong> {req.issuedBy}</span>}
              {req.receivedBy && <span><strong>Received by:</strong> {req.receivedBy}</span>}
              {req.returnedBy && <span><strong>Returned by:</strong> {req.returnedBy}</span>}
              {req.verifiedBy && <span><strong>Verified by:</strong> {req.verifiedBy}</span>}
              {req.issueRemark && <span className="italic">— {req.issueRemark}</span>}
              {req.returnRemark && <span className="italic">— {req.returnRemark}</span>}
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">{actions}</div>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {req.items.map((it, idx) => {
          const inv = it.kind === "consumable" ? inventory.find((x) => x.id === it.itemId) : null;
          // After issue, items have qtyIssued/qtyShort; before issue, just check live inventory
          const issued = it.qtyIssued ?? null; // null = hasn't been issued yet
          const shortNow = it.qtyShort ?? (inv && inv.qty < it.qtyRequested ? +(it.qtyRequested - (inv?.qty ?? 0)).toFixed(3) : 0);
          const wasPartial = issued !== null && it.qtyShort > 0;
          const wasFullyIssued = issued !== null && it.qtyShort === 0;

          // Color the row by status
          const rowClass = wasPartial
            ? "bg-orange-50 border border-orange-400"
            : wasFullyIssued
            ? "bg-green-50 border border-green-300"
            : shortNow > 0
            ? "bg-red-50 border border-red-300"
            : "bg-white border border-amber-900/10";

          return (
            <div key={idx} className={`px-3 py-2 text-sm ${rowClass}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-amber-950">{it.name}</span>
                  <span className="text-[10px] uppercase tracking-wider ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-900">{it.kind}</span>
                </div>
                <div className="text-right text-xs">
                  <div className="tabular-nums font-semibold text-amber-900">Req: {formatQty(it.qtyRequested, it.unit)}</div>
                  {inv && issued === null && <div className="text-[10px] text-amber-700/70">Stock: {formatQty(inv.qty, inv.unit)}</div>}
                </div>
              </div>
              {/* Issued / short breakdown — shown after issue */}
              {issued !== null && (
                <div className="mt-1.5 pt-1.5 border-t border-current/20 flex items-center justify-between gap-3 text-xs">
                  <span className="text-green-800">
                    ✓ Issued: <strong className="tabular-nums">{formatQty(issued, it.unit)}</strong>
                  </span>
                  {it.qtyShort > 0 && (
                    <span className="text-red-800 font-semibold">
                      ⚠ Short: <span className="tabular-nums">{formatQty(it.qtyShort, it.unit)}</span>
                      <span className="text-[10px] ml-1 italic font-normal">→ to indent</span>
                    </span>
                  )}
                </div>
              )}
              {/* Pre-issue stock warning */}
              {issued === null && shortNow > 0 && (
                <div className="text-[10px] text-red-700 font-semibold mt-1">
                  ⚠ Will be short by {formatQty(shortNow, it.unit)} — auto-flows to purchase indent
                </div>
              )}
            </div>
          );
        })}
      </div>

      {feedback && (
        <div className={`mt-3 px-3 py-2 text-xs border-l-4 ${feedback.ok ? "border-green-700 bg-green-50 text-green-900" : "border-red-700 bg-red-50 text-red-900"}`}>
          {feedback.msg}
        </div>
      )}
    </div>
  );
}

// ----- Raise new requisition -----
function NewRequisition({ inventory, onRaise, onDone }) {
  const [requestedBy, setRequestedBy] = useState("");
  const [forArea, setForArea] = useState("");
  const [purpose, setPurpose] = useState("");
  const [items, setItems] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [requiredBy, setRequiredBy] = useState(""); // ISO string or ""

  const presets = getRequiredByPresets();

  // Convert datetime-local string to ISO (and back for display)
  const toLocalInput = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    // strip seconds and timezone for input[type=datetime-local]
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const fromLocalInput = (s) => (s ? new Date(s).toISOString() : "");

  const addConsumable = (item) => {
    if (items.some((x) => x.itemId === item.id)) return;
    setItems((xs) => [...xs, { kind: "consumable", itemId: item.id, name: item.name, qtyRequested: 0, unit: item.unit }]);
  };
  const addCapital = (item) => {
    if (items.some((x) => x.itemId === item.id)) return;
    setItems((xs) => [...xs, { kind: "capital", itemId: item.id, name: item.name, qtyRequested: 1, unit: "nos" }]);
  };
  const updateQty = (idx, qty) => setItems((xs) => xs.map((x, i) => (i === idx ? { ...x, qtyRequested: qty } : x)));
  const removeItem = (idx) => setItems((xs) => xs.filter((_, i) => i !== idx));

  const submit = () => {
    const cleaned = items.map((i) => ({ ...i, qtyRequested: parseFloat(i.qtyRequested) || 0 }));
    const r = onRaise({ requestedBy, forArea, purpose, items: cleaned, requiredBy });
    setFeedback(r);
    if (r.ok) {
      setRequestedBy(""); setForArea(""); setPurpose(""); setItems([]); setRequiredBy("");
      setTimeout(() => onDone(), 1200);
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Form left */}
      <div className="space-y-5">
        <Card title="Requisition Header" subtitle="ആവശ്യപത്രം" icon={ClipboardList}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Requested By *</label>
              <select value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} className="w-full bg-white/60 border border-amber-900/30 px-3 py-2 text-sm">
                <option value="">— Select area / role —</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                <option value="Melsanthi">Melsanthi</option>
                <option value="Thantri">Thantri</option>
                <option value="Trustee">Trustee</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">For Use At</label>
              <select value={forArea} onChange={(e) => setForArea(e.target.value)} className="w-full bg-white/60 border border-amber-900/30 px-3 py-2 text-sm">
                <option value="">— Same as requester —</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3">
            <Field label="Purpose" value={purpose} onChange={setPurpose} placeholder="e.g. Morning abhishekam, festival prep…" />
          </div>

          {/* Required-by time picker */}
          <div className="mt-4 pt-4 border-t border-amber-900/15">
            <label className="block text-xs uppercase tracking-wider text-amber-900 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Required By <span className="opacity-60 font-normal normal-case">(when items are needed)</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {presets.map((p) => (
                <button
                  key={p.iso}
                  onClick={() => setRequiredBy(p.iso)}
                  className={`text-xs px-2.5 py-1 border ${
                    requiredBy === p.iso
                      ? "bg-amber-900 text-amber-50 border-amber-900"
                      : "border-amber-900/30 text-amber-900 hover:bg-amber-100"
                  }`}
                >
                  {p.label} <span className="opacity-70">· {p.time}</span>
                </button>
              ))}
            </div>
            <input
              type="datetime-local"
              value={toLocalInput(requiredBy)}
              onChange={(e) => setRequiredBy(fromLocalInput(e.target.value))}
              className="w-full bg-white/60 border border-amber-900/30 focus:border-amber-900 focus:outline-none px-3 py-2 text-sm"
            />
            {requiredBy && (
              <div className="text-xs text-amber-800 mt-1.5 italic">
                Needed by {new Date(requiredBy).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </div>
            )}
          </div>
        </Card>

        <Card title="Add Consumables" subtitle="ദൈനംദിന വസ്തുക്കൾ" icon={Package}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {inventory.map((i) => {
              const added = items.some((x) => x.itemId === i.id);
              return (
                <button key={i.id} onClick={() => addConsumable(i)} disabled={added}
                  className={`text-left p-2 border text-xs ${added ? "bg-amber-200/60 border-amber-600 cursor-default" : "border-amber-900/20 hover:border-amber-900 hover:bg-amber-50"}`}>
                  <div className="font-semibold text-amber-950">{i.name}</div>
                  <div className="text-[10px] text-amber-700">{formatQty(i.qty, i.unit)} avail.</div>
                  {added && <div className="text-[10px] text-amber-900 font-bold mt-0.5">✓ Added</div>}
                </button>
              );
            })}
          </div>
        </Card>

        <Card title="Add Capital Items" subtitle="ഉരുപ്പടികൾ" icon={Sparkles}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CAPITAL_ITEMS.map((c) => {
              const added = items.some((x) => x.itemId === c.id);
              return (
                <button key={c.id} onClick={() => addCapital(c)} disabled={added}
                  className={`text-left p-2 border text-xs ${added ? "bg-amber-200/60 border-amber-600 cursor-default" : "border-amber-900/20 hover:border-amber-900 hover:bg-amber-50"}`}>
                  <div className="font-semibold text-amber-950">{c.name}</div>
                  <div className="text-[10px] text-amber-700">Custodian: {c.custodian}</div>
                  {added && <div className="text-[10px] text-amber-900 font-bold mt-0.5">✓ Added</div>}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-amber-800/60 italic mt-2">Capital items must be returned. They'll appear in "Awaiting Return" once issued.</p>
        </Card>
      </div>

      {/* Cart right */}
      <div>
        <Card title="Requisition Lines" subtitle="ആവശ്യപ്പെട്ട ഇനങ്ങൾ" icon={ClipboardList}>
          {items.length === 0 ? (
            <p className="text-sm text-amber-800/60 italic text-center py-8">No items added yet. Pick from the left.</p>
          ) : (
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white border border-amber-900/15 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-amber-950">{it.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-amber-700">{it.kind}</div>
                  </div>
                  <QtyInput
                    qty={it.qtyRequested}
                    baseUnit={it.unit}
                    onChange={(v) => updateQty(idx, v)}
                  />
                  <button onClick={() => removeItem(idx)} className="text-amber-700/60 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}

          <button onClick={submit} disabled={!requestedBy || items.length === 0}
            className="w-full mt-4 bg-amber-900 hover:bg-amber-950 disabled:bg-amber-900/30 disabled:cursor-not-allowed text-amber-50 py-3 font-semibold tracking-wide flex items-center justify-center gap-2">
            <ClipboardList className="w-4 h-4" /> Raise Requisition
          </button>

          {feedback && (
            <div className={`mt-3 px-3 py-2 text-sm border-l-4 ${feedback.ok ? "border-green-700 bg-green-50 text-green-900" : "border-red-700 bg-red-50 text-red-900"}`}>
              {feedback.msg}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ----- Issue register / history -----
function IssueRegister({ history }) {
  if (history.length === 0) {
    return <div className="text-center py-12 text-amber-800/60 italic text-sm">No issued or rejected requisitions yet.</div>;
  }
  return (
    <div className="bg-amber-50/40 border border-amber-900/15 overflow-x-auto">
      <table className="w-full text-sm min-w-[900px]">
        <thead className="bg-amber-100/60 text-amber-900 text-xs uppercase tracking-wider">
          <tr>
            <th className="text-left px-4 py-3">Req No.</th>
            <th className="text-left px-4 py-3">Requested By</th>
            <th className="text-left px-4 py-3">Items</th>
            <th className="text-left px-4 py-3">Status</th>
            <th className="text-left px-4 py-3">Raised</th>
            <th className="text-left px-4 py-3">Needed By</th>
            <th className="text-left px-4 py-3">Delivered In</th>
          </tr>
        </thead>
        <tbody>
          {history.map((r) => {
            const deliverTime = r.status === "Issued" || r.status === "Returned" ? timeDiff(r.raisedAt, r.issuedAt) : "—";
            const lateBy = r.requiredBy && r.issuedAt && new Date(r.issuedAt).getTime() > new Date(r.requiredBy).getTime();
            return (
              <tr key={r.id} className="border-t border-amber-900/10 align-top">
                <td className="px-4 py-3 font-mono text-amber-700 text-xs">{r.reqNo}</td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-amber-950">{r.requestedBy}</div>
                  <div className="text-xs text-amber-800/70">→ {r.forArea}</div>
                </td>
                <td className="px-4 py-3 text-amber-900 text-xs">
                  {r.items.map((i) => `${i.name} (${formatQty(i.qtyRequested, i.unit)})`).join(", ")}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 ${
                    r.status === "Issued" ? "bg-green-100 text-green-800" :
                    r.status === "PartiallyIssued" ? "bg-orange-100 text-orange-800" :
                    r.status === "Returned" ? "bg-blue-100 text-blue-800" :
                    r.status === "Rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"
                  }`}>{r.status === "PartiallyIssued" ? "Partial" : r.status}</span>
                  {r.rejectReason && <div className="text-[10px] text-red-700 mt-1 italic">{r.rejectReason}</div>}
                </td>
                <td className="px-4 py-3 text-xs text-amber-800/80 tabular-nums">
                  {new Date(r.raisedAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                </td>
                <td className="px-4 py-3 text-xs text-amber-800/80 tabular-nums">
                  {r.requiredBy ? new Date(r.requiredBy).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "—"}
                </td>
                <td className={`px-4 py-3 text-xs tabular-nums font-semibold ${lateBy ? "text-red-700" : "text-green-700"}`}>
                  {deliverTime}
                  {lateBy && <div className="text-[10px] font-normal">delivered late</div>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ----- Purchase Indent register: shortages flow here from partial issues -----
function PurchaseIndentView({ indents, inventory, onOrder, onReceive, onCancel }) {
  const [orderingIndent, setOrderingIndent] = useState(null);
  const [receivingIndent, setReceivingIndent] = useState(null);

  const open = indents.filter((p) => p.status === "Open");
  const ordered = indents.filter((p) => p.status === "Ordered");
  const completed = indents.filter((p) => p.status === "Received" || p.status === "Cancelled");

  if (indents.length === 0) {
    return (
      <div className="text-center py-12 text-amber-800/60">
        <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p className="text-sm italic">No purchase indents yet.</p>
        <p className="text-xs mt-1">Shortages from partial issues will appear here automatically.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* OPEN — needs to be ordered */}
      {open.length > 0 && (
        <div>
          <h3 className="text-sm uppercase tracking-wider text-red-800 font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Open Indents — Need to Order ({open.length})
          </h3>
          <div className="bg-amber-50/40 border border-amber-900/15 overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-amber-100/60 text-amber-900 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Indent No.</th>
                  <th className="text-left px-4 py-3">Item</th>
                  <th className="text-right px-4 py-3">Qty Needed</th>
                  <th className="text-right px-4 py-3">In Stock</th>
                  <th className="text-left px-4 py-3">Sources</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {open.map((p) => {
                  const inv = inventory.find((i) => i.id === p.itemId);
                  return (
                    <tr key={p.id} className="border-t border-amber-900/10 align-top">
                      <td className="px-4 py-3 font-mono text-xs text-amber-700">{p.indentNo}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-amber-950">{p.itemName}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 ${
                            p.source === "reorder" ? "bg-blue-100 text-blue-900" : "bg-red-100 text-red-900"
                          }`}>
                            {p.source === "reorder" ? "Reorder" : "Shortage"}
                          </span>
                          <span className="text-[10px] text-amber-700/70">Created {new Date(p.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-bold text-red-800">{formatQty(p.qtyNeeded, p.unit)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-amber-800/70">{inv ? formatQty(inv.qty, inv.unit) : "—"}</td>
                      <td className="px-4 py-3 text-xs">
                        {p.sources.slice(0, 3).map((s, idx) => (
                          <div key={idx} className="text-amber-800">
                            <span className="font-mono text-amber-700">{s.reqNo}</span> · {s.requestedBy} · <span className="tabular-nums">{formatQty(s.qty, p.unit)}</span>
                          </div>
                        ))}
                        {p.sources.length > 3 && <div className="text-[10px] italic text-amber-700/60">+{p.sources.length - 3} more</div>}
                      </td>
                      <td className="px-4 py-3 text-right space-y-1">
                        <button onClick={() => setOrderingIndent(p)} className="bg-amber-900 hover:bg-amber-950 text-amber-50 px-3 py-1.5 text-xs flex items-center gap-1 ml-auto">
                          <ShoppingCart className="w-3 h-3" /> Place Order
                        </button>
                        <button onClick={() => onCancel(p.id, "Cancelled by store")} className="block text-[10px] text-amber-800/60 hover:text-red-700 ml-auto">Cancel</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ORDERED — awaiting delivery */}
      {ordered.length > 0 && (
        <div>
          <h3 className="text-sm uppercase tracking-wider text-amber-900 font-semibold mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4" /> On Order — Awaiting Delivery ({ordered.length})
          </h3>
          <div className="bg-amber-50/40 border border-amber-900/15 overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-amber-100/60 text-amber-900 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Indent No.</th>
                  <th className="text-left px-4 py-3">Item</th>
                  <th className="text-right px-4 py-3">Ordered</th>
                  <th className="text-left px-4 py-3">Vendor</th>
                  <th className="text-left px-4 py-3">Expected</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((p) => (
                  <tr key={p.id} className="border-t border-amber-900/10">
                    <td className="px-4 py-3 font-mono text-xs text-amber-700">{p.indentNo}</td>
                    <td className="px-4 py-3 font-semibold text-amber-950">{p.itemName}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatQty(p.qtyNeeded, p.unit)}</td>
                    <td className="px-4 py-3 text-amber-900">{p.vendor || "—"}</td>
                    <td className="px-4 py-3 text-xs text-amber-800/80">
                      {p.expectedBy ? new Date(p.expectedBy).toLocaleDateString("en-IN") : "—"}
                      {p.estCost && <div className="text-[10px] text-amber-700">Est ₹{p.estCost}/{p.unit}</div>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setReceivingIndent(p)} className="bg-green-700 hover:bg-green-800 text-white px-3 py-1.5 text-xs flex items-center gap-1 ml-auto">
                        <Check className="w-3 h-3" /> Mark Received
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMPLETED — received or cancelled */}
      {completed.length > 0 && (
        <div>
          <h3 className="text-sm uppercase tracking-wider text-amber-800/70 font-semibold mb-3">History ({completed.length})</h3>
          <div className="bg-amber-50/40 border border-amber-900/15 overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-amber-100/60 text-amber-900 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Indent No.</th>
                  <th className="text-left px-4 py-3">Item</th>
                  <th className="text-right px-4 py-3">Qty</th>
                  <th className="text-right px-4 py-3">Cost</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {completed.map((p) => (
                  <tr key={p.id} className="border-t border-amber-900/10">
                    <td className="px-4 py-3 font-mono text-xs text-amber-700">{p.indentNo}</td>
                    <td className="px-4 py-3 font-semibold text-amber-950">{p.itemName}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {p.qtyReceived ? formatQty(p.qtyReceived, p.unit) : formatQty(p.qtyNeeded, p.unit)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-900">
                      {p.costPerUnit ? `₹${(p.qtyReceived * p.costPerUnit).toFixed(0)}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 ${p.status === "Received" ? "bg-green-100 text-green-800" : "bg-stone-200 text-stone-700"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-amber-800/70 tabular-nums">
                      {new Date(p.receivedAt || p.cancelledAt || p.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {orderingIndent && (
        <OrderIndentDialog
          indent={orderingIndent}
          onConfirm={(details) => { onOrder(orderingIndent.id, details); setOrderingIndent(null); }}
          onClose={() => setOrderingIndent(null)}
        />
      )}
      {receivingIndent && (
        <ReceiveIndentDialog
          indent={receivingIndent}
          onConfirm={(details) => {
            const r = onReceive(receivingIndent.id, details);
            if (r?.ok) setReceivingIndent(null);
            return r;
          }}
          onClose={() => setReceivingIndent(null)}
        />
      )}
    </div>
  );
}

// ----- Place purchase order dialog -----
function OrderIndentDialog({ indent, onConfirm, onClose }) {
  const [vendor, setVendor] = useState("");
  const [orderedBy, setOrderedBy] = useState("");
  const [expectedBy, setExpectedBy] = useState("");
  const [estCost, setEstCost] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!vendor.trim()) { setError("Vendor name is required."); return; }
    if (!orderedBy.trim()) { setError("Ordered-by name is required."); return; }
    onConfirm({ vendor, orderedBy, expectedBy: expectedBy || null, estCost });
  };

  return (
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-amber-50 border-2 border-amber-900/40 max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-amber-950 mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Place Order · {indent.indentNo}
        </h3>
        <p className="text-xs text-amber-800/70 mb-4">
          {indent.itemName} · need <strong>{formatQty(indent.qtyNeeded, indent.unit)}</strong>
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Vendor / Supplier *</label>
            <input autoFocus type="text" value={vendor} onChange={(e) => setVendor(e.target.value)}
              placeholder="e.g. Sree Krishna Stores" className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Ordered By *</label>
            <input type="text" value={orderedBy} onChange={(e) => setOrderedBy(e.target.value)}
              placeholder="Store keeper / office in-charge" className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Expected By</label>
              <input type="date" value={expectedBy} onChange={(e) => setExpectedBy(e.target.value)}
                className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Est. ₹ per {indent.unit}</label>
              <input type="number" step="0.01" value={estCost} onChange={(e) => setEstCost(e.target.value)}
                placeholder="Optional" className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        {error && <div className="mt-3 bg-red-50 border-l-4 border-red-700 px-3 py-2 text-xs text-red-900">{error}</div>}

        <div className="flex gap-2 mt-5 pt-4 border-t border-amber-900/15">
          <button onClick={submit} className="flex-1 bg-amber-900 text-amber-50 py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
            <ShoppingCart className="w-4 h-4" /> Place Order
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-amber-900/40 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ----- Receive purchase dialog: restock with weighted-avg cost -----
function ReceiveIndentDialog({ indent, onConfirm, onClose }) {
  const [qtyReceived, setQtyReceived] = useState(String(indent.qtyNeeded));
  const [costPerUnit, setCostPerUnit] = useState(indent.estCost ? String(indent.estCost) : "");
  const [receivedBy, setReceivedBy] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!receivedBy.trim()) { setError("Received-by name is required."); return; }
    if (!costPerUnit) { setError("Enter actual cost per unit."); return; }
    const r = onConfirm({ qtyReceived, costPerUnit, receivedBy });
    if (!r?.ok) setError(r?.msg || "Failed to record receipt.");
  };

  const total = (parseFloat(qtyReceived) || 0) * (parseFloat(costPerUnit) || 0);

  return (
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-amber-50 border-2 border-amber-900/40 max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-amber-950 mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Receive Stock · {indent.indentNo}
        </h3>
        <p className="text-xs text-amber-800/70 mb-4">
          {indent.itemName} from <strong>{indent.vendor}</strong> · Ordered {formatQty(indent.qtyNeeded, indent.unit)}
        </p>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Qty Received ({indent.unit}) *</label>
              <input autoFocus type="number" step="0.001" value={qtyReceived} onChange={(e) => setQtyReceived(e.target.value)}
                className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Cost per {indent.unit} (₹) *</label>
              <input type="number" step="0.01" value={costPerUnit} onChange={(e) => setCostPerUnit(e.target.value)}
                className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Received By *</label>
            <input type="text" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)}
              placeholder="Store keeper accepting goods" className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm" />
          </div>

          {total > 0 && (
            <div className="bg-amber-100/50 border border-amber-900/20 p-3 text-xs space-y-1">
              <div className="flex justify-between"><span>Total purchase value:</span><span className="tabular-nums font-semibold">₹{total.toFixed(2)}</span></div>
              <div className="text-amber-800 italic">Inventory will be increased and unit cost recalculated as a weighted average with existing stock.</div>
            </div>
          )}
        </div>

        {error && <div className="mt-3 bg-red-50 border-l-4 border-red-700 px-3 py-2 text-xs text-red-900">{error}</div>}

        <div className="flex gap-2 mt-5 pt-4 border-t border-amber-900/15">
          <button onClick={submit} className="flex-1 bg-green-700 text-white py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> Confirm Receipt
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-amber-900/40 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ----- Issue dialog: captures who handed over, who received, and when -----
function IssueDialog({ req, onConfirm, onClose }) {
  // Default issued-at = now, formatted for datetime-local input
  const nowLocal = (() => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();

  const [issuedBy, setIssuedBy] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [issuedAtLocal, setIssuedAtLocal] = useState(nowLocal);
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");

  // Common store keeper / runner names — quick-pick chips
  const storeKeepers = ["Store Keeper", "Asst. Store Keeper", "Office In-charge"];
  const receivers = [req.requestedBy, req.forArea, "Melsanthi", "Kazhakam", "Runner"];
  const uniqueReceivers = [...new Set(receivers.filter(Boolean))];

  const submit = () => {
    if (!issuedBy.trim()) { setError("Enter who is issuing the items."); return; }
    if (!receivedBy.trim()) { setError("Enter who is receiving the items."); return; }
    const issuedAtIso = new Date(issuedAtLocal).toISOString();
    const r = onConfirm({ issuedBy, receivedBy, issuedAt: issuedAtIso, remark });
    if (!r?.ok) setError(r?.msg || "Failed to issue.");
  };

  return (
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-amber-50 border-2 border-amber-900/40 max-w-lg w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-amber-950 mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Confirm Issue · {req.reqNo}
        </h3>
        <p className="text-xs text-amber-800/70 mb-4">
          {req.requestedBy} <ArrowRight className="inline w-3 h-3 mx-1" /> {req.forArea}
          {req.purpose && <> · "{req.purpose}"</>}
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Issued By (Store) *</label>
            <input
              autoFocus
              type="text"
              value={issuedBy}
              onChange={(e) => setIssuedBy(e.target.value)}
              placeholder="Name of person handing over"
              className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm focus:border-amber-900 focus:outline-none"
            />
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {storeKeepers.map((n) => (
                <button key={n} onClick={() => setIssuedBy(n)} className="text-[10px] px-2 py-0.5 border border-amber-900/30 hover:bg-amber-100 text-amber-800">
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Received By *</label>
            <input
              type="text"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              placeholder="Name of person receiving"
              className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm focus:border-amber-900 focus:outline-none"
            />
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {uniqueReceivers.map((n) => (
                <button key={n} onClick={() => setReceivedBy(n)} className="text-[10px] px-2 py-0.5 border border-amber-900/30 hover:bg-amber-100 text-amber-800">
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1 flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Issue Timestamp *
            </label>
            <input
              type="datetime-local"
              value={issuedAtLocal}
              onChange={(e) => setIssuedAtLocal(e.target.value)}
              className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm focus:border-amber-900 focus:outline-none"
            />
            <button
              onClick={() => setIssuedAtLocal(nowLocal)}
              className="text-[10px] px-2 py-0.5 border border-amber-900/30 hover:bg-amber-100 text-amber-800 mt-1.5"
            >
              Set to now
            </button>
            <p className="text-[10px] text-amber-700/70 mt-1 italic">
              Defaults to current time. Adjust only when back-entering an earlier handover.
            </p>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Remark (optional)</label>
            <input
              type="text"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="e.g. partial issue, condition note, batch no."
              className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm focus:border-amber-900 focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="mt-3 bg-red-50 border-l-4 border-red-700 px-3 py-2 text-xs text-red-900">{error}</div>
        )}

        <div className="flex gap-2 mt-5 pt-4 border-t border-amber-900/15">
          <button onClick={submit} className="flex-1 bg-amber-900 hover:bg-amber-950 text-amber-50 py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> Confirm Issue
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-amber-900/40 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ----- Return dialog: captures who returned and who verified -----
function ReturnDialog({ req, onConfirm, onClose }) {
  const nowLocal = (() => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();

  const [returnedBy, setReturnedBy] = useState(req.receivedBy || "");
  const [verifiedBy, setVerifiedBy] = useState("");
  const [returnedAtLocal, setReturnedAtLocal] = useState(nowLocal);
  const [returnRemark, setReturnRemark] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!returnedBy.trim()) { setError("Enter who is returning the items."); return; }
    if (!verifiedBy.trim()) { setError("Enter who is verifying the return."); return; }
    onConfirm({
      returnedBy,
      verifiedBy,
      returnedAt: new Date(returnedAtLocal).toISOString(),
      returnRemark,
    });
  };

  return (
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-amber-50 border-2 border-amber-900/40 max-w-lg w-full p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-amber-950 mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Confirm Return · {req.reqNo}
        </h3>
        <p className="text-xs text-amber-800/70 mb-4">
          Originally issued to {req.receivedBy || req.requestedBy} on{" "}
          {req.issuedAt ? new Date(req.issuedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Returned By *</label>
            <input
              autoFocus type="text" value={returnedBy} onChange={(e) => setReturnedBy(e.target.value)}
              placeholder="Name of person returning"
              className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm focus:border-amber-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Verified By (Store) *</label>
            <select
              value={VERIFIERS.some((v) => v.role === verifiedBy) ? verifiedBy : (verifiedBy ? "__other__" : "")}
              onChange={(e) => {
                if (e.target.value === "__other__") {
                  setVerifiedBy(""); // clear so user can type a custom name
                } else {
                  setVerifiedBy(e.target.value);
                }
              }}
              className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm focus:border-amber-900 focus:outline-none"
              style={{ fontFamily: "inherit" }}
            >
              <option value="">— Select verifier —</option>
              {VERIFIERS.map((v) => (
                <option key={v.role} value={v.role}>
                  {v.role} · {v.malayalam}
                </option>
              ))}
              <option value="__other__">Other (type below)</option>
            </select>
            {/* Show free-text input only when "Other" is selected (i.e. value isn't in the list and isn't empty) */}
            {!VERIFIERS.some((v) => v.role === verifiedBy) && (
              <input
                type="text"
                value={verifiedBy}
                onChange={(e) => setVerifiedBy(e.target.value)}
                placeholder="Enter custom name / role"
                className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm focus:border-amber-900 focus:outline-none mt-1.5"
              />
            )}
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1 flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Returned At *
            </label>
            <input
              type="datetime-local" value={returnedAtLocal} onChange={(e) => setReturnedAtLocal(e.target.value)}
              className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm focus:border-amber-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Condition / Remark (optional)</label>
            <input
              type="text" value={returnRemark} onChange={(e) => setReturnRemark(e.target.value)}
              placeholder="e.g. minor scratch, complete set verified"
              className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm focus:border-amber-900 focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="mt-3 bg-red-50 border-l-4 border-red-700 px-3 py-2 text-xs text-red-900">{error}</div>
        )}

        <div className="flex gap-2 mt-5 pt-4 border-t border-amber-900/15">
          <button onClick={submit} className="flex-1 bg-amber-900 hover:bg-amber-950 text-amber-50 py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
            <RotateCcw className="w-4 h-4" /> Confirm Return
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-amber-900/40 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ----- Printable issue slip (for store-keeper records) -----
function IssueSlip({ req, onClose }) {
  return (
    <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center z-50 p-4 print:bg-white print:p-0 print:static" onClick={onClose}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #issue-slip-print, #issue-slip-print * { visibility: visible; }
          #issue-slip-print { position: absolute; left: 0; top: 0; width: 100%; background: white !important; font-family: 'Courier New', monospace; }
          #issue-slip-print .no-print { display: none !important; }
        }
        @page { margin: 10mm; size: A5; }
      `}</style>
      <div id="issue-slip-print" onClick={(e) => e.stopPropagation()}
        className="bg-white max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl print:max-h-none print:max-w-none print:shadow-none"
        style={{ fontFamily: "'Courier New', monospace" }}>
        <div className="no-print bg-amber-900 text-amber-50 px-4 py-2 flex items-center justify-between sticky top-0 z-10">
          <span className="text-sm uppercase tracking-wider">Issue Slip</span>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="bg-amber-50 text-amber-900 px-3 py-1 text-xs font-semibold flex items-center gap-1 hover:bg-amber-100">
              <Printer className="w-3 h-3" /> Print
            </button>
            <button onClick={onClose} className="text-amber-50 hover:text-white p-1"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="p-6">
          <div className="text-center border-b-2 border-double border-stone-800 pb-3 mb-3">
            <div className="text-xs">✦ ॐ ✦</div>
            <div className="text-lg font-bold tracking-wider mt-1">NELLIAKATTU OUSHADHEESWARI TEMPLE</div>
            <div className="text-[10px] mt-0.5">Kizhakombu PO, Koothattukulam — 686662</div>
            <div className="text-[10px] uppercase tracking-[0.2em] mt-2">Stores — Issue Voucher</div>
          </div>

          <div className="flex justify-between text-xs mb-3">
            <div>
              <div><strong>Requisition:</strong> {req.reqNo}</div>
              <div><strong>Raised:</strong> {new Date(req.raisedAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</div>
              {req.requiredBy && <div><strong>Needed By:</strong> {new Date(req.requiredBy).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</div>}
            </div>
            <div className="text-right">
              <div><strong>Issued:</strong> {req.issuedAt ? new Date(req.issuedAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "—"}</div>
              <div><strong>By:</strong> {req.issuedBy || "Store Keeper"}</div>
              {req.issuedAt && <div><strong>Delivered in:</strong> {timeDiff(req.raisedAt, req.issuedAt)}</div>}
            </div>
          </div>

          <div className="bg-stone-100 px-2 py-1 text-xs mb-2">
            <div><strong>Requested By:</strong> {req.requestedBy} → <strong>For:</strong> {req.forArea}</div>
            {req.purpose && <div className="italic">Purpose: {req.purpose}</div>}
          </div>

          <table className="w-full text-xs border-t border-b border-stone-800">
            <thead>
              <tr className="border-b border-stone-400">
                <th className="text-left py-1">#</th>
                <th className="text-left py-1">Item</th>
                <th className="text-right py-1">Requested</th>
                <th className="text-right py-1">Issued</th>
                <th className="text-right py-1">Short</th>
              </tr>
            </thead>
            <tbody>
              {req.items.map((it, idx) => {
                const issued = it.qtyIssued ?? it.qtyRequested;
                const short = it.qtyShort ?? 0;
                return (
                  <tr key={idx} className="border-b border-stone-300">
                    <td className="py-1">{idx + 1}</td>
                    <td className="py-1">
                      {it.name}
                      <span className="text-[9px] uppercase ml-1 text-stone-600">[{it.kind}]</span>
                    </td>
                    <td className="py-1 text-right tabular-nums">{formatQty(it.qtyRequested, it.unit)}</td>
                    <td className="py-1 text-right tabular-nums font-semibold">{formatQty(issued, it.unit)}</td>
                    <td className={`py-1 text-right tabular-nums ${short > 0 ? "font-bold text-red-700" : ""}`}>
                      {short > 0 ? formatQty(short, it.unit) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {req.items.some((i) => i.qtyShort > 0) && (
            <div className="text-[10px] mt-2 px-2 py-1 bg-red-50 border border-red-400 text-red-900">
              <strong>⚠ SHORTAGE:</strong> Items marked Short have been added to the Purchase Indent register.
              The receiving area should re-request once stock is replenished.
            </div>
          )}

          {req.issueRemark && (
            <div className="text-[10px] mt-2 px-2 py-1 bg-stone-100 border border-stone-300">
              <strong>Remark:</strong> <span className="italic">{req.issueRemark}</span>
            </div>
          )}

          {req.items.some((i) => i.kind === "capital") && (
            <div className="text-[10px] mt-2 italic border border-stone-400 px-2 py-1">
              ⚠ Capital items must be returned. Custodian responsible until return verified.
            </div>
          )}

          <div className="mt-6 pt-3 border-t border-dashed border-stone-400 text-[10px] grid grid-cols-2 gap-4">
            <div>
              <div className="text-[9px] uppercase tracking-wider text-stone-600 mb-1">Issued By (Store)</div>
              <div className="border-b border-stone-400 pb-3 mb-1 font-semibold">
                {req.issuedBy || <span className="text-stone-400 font-normal">________________</span>}
              </div>
              <div className="text-stone-600">Signature</div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-wider text-stone-600 mb-1">Received By</div>
              <div className="border-b border-stone-400 pb-3 mb-1 font-semibold">
                {req.receivedBy || <span className="text-stone-400 font-normal">________________</span>}
              </div>
              <div className="text-stone-600">Signature</div>
            </div>
          </div>

          {/* Return signatures appear only if returned */}
          {req.returnedAt && (
            <div className="mt-4 pt-3 border-t border-dashed border-stone-400 text-[10px]">
              <div className="text-center text-[9px] uppercase tracking-[0.2em] text-stone-600 mb-2">— Return Verified —</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-stone-600 mb-1">Returned By</div>
                  <div className="border-b border-stone-400 pb-3 mb-1 font-semibold">{req.returnedBy || "—"}</div>
                  <div className="text-stone-600">on {new Date(req.returnedAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-stone-600 mb-1">Verified By</div>
                  <div className="border-b border-stone-400 pb-3 mb-1 font-semibold">{req.verifiedBy || "—"}</div>
                  <div className="text-stone-600">{req.returnRemark && <span className="italic">{req.returnRemark}</span>}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

