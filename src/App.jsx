import { useState, useEffect, useRef } from "react";
import {
  Sun, Moon, Bell, Package, Receipt, Calendar, FileSpreadsheet,
  Plus, Check, X, AlertTriangle, Download, Clock, Users, IndianRupee,
  TrendingDown, Sparkles, Printer, Trash2, ClipboardList, ArrowRight, RotateCcw, Inbox, ShoppingCart, Truck,
  Star, Phone, Building2, FileText, Upload, Loader, Award, Scan, FileCheck
} from "lucide-react";
// =================== SEED DATA ===================
// Originally inline as const VAZHIPADU_CATALOG / INITIAL_INVENTORY / etc.
// Moved to src/seed/*.json so admins can edit master data without touching code,
// and so Phase 1 (Supabase) can seed the DB from the same JSON files.
import {
  VAZHIPADU_CATALOG,
  INITIAL_INVENTORY,
  CAPITAL_ITEMS,
  INITIAL_RETAIL_ITEMS,
  POOJA_SCHEDULE,
  AREAS,
  VERIFIERS,
  NAKSHATRAMS,
} from "./seed/index.js";

// =================== MODULES (Phase 3 — extracted from this file) ===================
import { Uthsavam } from "./modules/Uthsavam.jsx";
import { DailyRoutine } from "./modules/DailyRoutine.jsx";
import { Inventory } from "./modules/Inventory.jsx";
import { Counter } from "./modules/Counter.jsx";
import { Store } from "./modules/Store.jsx";
import { Purchase } from "./modules/Purchase.jsx";
import { DataEntry } from "./modules/DataEntry.jsx";
import { BackupReminder } from "./components/BackupReminder.jsx";
import { Card, Field, formatQty } from "./components/ui.jsx";

// =================== APP ===================
export default function TempleManagement() {
  const [tab, setTab] = useState("daily");
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [bookings, setBookings] = useState([]);
  const [issuances, setIssuances] = useState([]); // auto-generated when bookings happen
  const [openLog, setOpenLog] = useState({ opened: "", closed: "", note: "" });
  const [poojaLog, setPoojaLog] = useState({});
  const [housekeeping, setHousekeeping] = useState([
    { id: "hk1", task: "Sweep prakaram", area: "Prakaram", done: false },
    { id: "hk2", task: "Wash sreekovil floor", area: "Sreekovil", done: false },
    { id: "hk3", task: "Clean lamps", area: "Sreekovil", done: false },
    { id: "hk4", task: "Wash vessels", area: "Oottupura", done: true },
    { id: "hk5", task: "Refill water vessels", area: "Prakaram", done: false },
  ]);
  const [events, setEvents] = useState([
    { id: "e1", name: "Vishu Mahotsavam", date: "2026-04-14", budget: 250000, raised: 187500, status: "Completed" },
    { id: "e2", name: "Pratishta Dinam", date: "2026-05-22", budget: 450000, raised: 215000, status: "Active" },
  ]);

  // Requisitions raised by areas asking the store for items
  // Status: Pending → Issued / PartiallyIssued / Rejected. Capital items also get Returned.
  const [requisitions, setRequisitions] = useState(() => {
    // Build demo requisitions relative to "now" so urgency indicators are meaningful
    const now = new Date();
    const inMinutes = (m) => new Date(now.getTime() + m * 60000).toISOString();
    const minutesAgo = (m) => new Date(now.getTime() - m * 60000).toISOString();
    return [
      {
        id: "req-demo-1",
        reqNo: "R000101",
        requestedBy: "Melsanthi",
        forArea: "Sreekovil",
        purpose: "Morning abhishekam",
        raisedAt: minutesAgo(45),
        requiredBy: inMinutes(20), // needed in 20 min — orange urgency
        items: [
          { kind: "consumable", itemId: "i2", name: "Ghee", qtyRequested: 0.3, unit: "kg" },
          { kind: "consumable", itemId: "i3", name: "Camphor", qtyRequested: 0.05, unit: "kg" },
        ],
        status: "Pending",
      },
      {
        id: "req-demo-2",
        reqNo: "R000102",
        requestedBy: "Kazhakam",
        forArea: "Sreekovil",
        purpose: "Evening Deeparadhana — kindi for water",
        raisedAt: minutesAgo(15),
        requiredBy: inMinutes(180), // needed in 3 hrs — calm
        items: [
          { kind: "capital", itemId: "c4", name: "Kalasham (silver)", qtyRequested: 1, unit: "nos" },
        ],
        status: "Pending",
      },
      {
        id: "req-demo-3",
        reqNo: "R000103",
        requestedBy: "Oottupura",
        forArea: "Oottupura",
        purpose: "Annadanam — large batch for festival day",
        raisedAt: minutesAgo(5),
        requiredBy: inMinutes(120),
        items: [
          // Asks for 30 kg flowers — only 6.5 kg in stock → partial issue, 23.5 kg shortage flows to indent
          { kind: "consumable", itemId: "i6", name: "Flowers", qtyRequested: 30, unit: "kg" },
          { kind: "consumable", itemId: "i10", name: "Rice", qtyRequested: 50, unit: "kg" }, // 85 in stock — full
        ],
        status: "Pending",
      },
    ];
  });

  // Purchase Indent register — shortages auto-flow here, store keeper places orders
  // Status: Open → Ordered → Received (each entry).
  // An entry consolidates same-item shortages from multiple requisitions.
  const [purchaseIndents, setPurchaseIndents] = useState([]);

  // ===== PROCUREMENT STATE =====
  // Vendor master — itemIds is the list of inventory item IDs they supply
  const [vendors, setVendors] = useState([
    {
      id: "ven-1", code: "V001", name: "Sree Krishna Stores", contact: "Ramesh", phone: "+91 98470 12345",
      address: "Main Road, Chalakudy", gst: "32ABCDE1234F1Z5", itemIds: ["i1", "i9", "i10", "i11"],
      defaultRates: { i1: 32, i9: 11, i10: 52, i11: 58 }, paymentTerms: "Net 30",
      ratings: { quality: 4.5, timeliness: 4.2, accuracy: 4.0 }, totalOrders: 24, ordersOnTime: 20, billsAccurate: 22,
    },
    {
      id: "ven-2", code: "V002", name: "Arya Sandalwood Mart", contact: "Suresh Kumar", phone: "+91 98765 43210",
      address: "Temple Lane, Trichur", gst: "32XYZAB9876C2D1", itemIds: ["i3", "i4", "i7", "i8"],
      defaultRates: { i3: 820, i4: 470, i7: 175, i8: 1.4 }, paymentTerms: "Net 15",
      ratings: { quality: 4.8, timeliness: 4.5, accuracy: 4.7 }, totalOrders: 18, ordersOnTime: 17, billsAccurate: 18,
    },
    {
      id: "ven-3", code: "V003", name: "Kerala Pure Ghee Co.", contact: "Vijayan", phone: "+91 94470 55667",
      address: "Industrial Estate, Aluva", gst: "32GHIJK5678L3M2", itemIds: ["i2"],
      defaultRates: { i2: 615 }, paymentTerms: "Advance",
      ratings: { quality: 4.9, timeliness: 4.0, accuracy: 4.6 }, totalOrders: 12, ordersOnTime: 10, billsAccurate: 11,
    },
    {
      id: "ven-4", code: "V004", name: "Sree Devi Flowers", contact: "Lakshmi", phone: "+91 99461 22334",
      address: "Market Junction, Irinjalakuda", gst: "", itemIds: ["i6", "i7"],
      defaultRates: { i6: 215, i7: 170 }, paymentTerms: "Cash",
      ratings: { quality: 4.2, timeliness: 4.8, accuracy: 3.8 }, totalOrders: 30, ordersOnTime: 29, billsAccurate: 26,
    },
    {
      id: "ven-5", code: "V005", name: "Trichur Rice Traders", contact: "Babu", phone: "+91 98472 88990",
      address: "Wholesale Market, Trichur", gst: "32PQRST3344U5V6", itemIds: ["i10", "i11", "i5"],
      defaultRates: { i10: 56, i11: 62, i5: 88 }, paymentTerms: "Net 15",
      ratings: { quality: 4.0, timeliness: 3.8, accuracy: 4.1 }, totalOrders: 15, ordersOnTime: 12, billsAccurate: 13,
    },
  ]);

  // Quotations: { id, indentId, requestedAt, status: "Open"|"Closed", quotes: [{ vendorId, ratePerUnit, deliveryDays, notes, receivedAt }] }
  const [quotations, setQuotations] = useState([]);

  // Purchase Orders: { id, poNo, indentId, vendorId, items: [{ itemId, qty, ratePerUnit, unit }], totalAmount, status: "Issued"|"PartiallyReceived"|"Received"|"Cancelled", expectedBy, issuedAt, ... }
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  // GRNs: { id, grnNo, poId, receivedAt, items: [{ itemId, qtyOrdered, qtyReceived, ratePerUnit, condition }], discrepancies, receivedBy }
  const [grns, setGrns] = useState([]);

  // Bills: { id, billNo, vendorBillNo, vendorId, poId, grnId, billDate, totalAmount, items, scanDataUrl, ocrText, status: "Pending"|"Verified"|"Paid"|"Disputed", paidAt, ... }
  const [bills, setBills] = useState([]);

  // ===== RETAIL / COUNTER SALES STATE =====
  // Pre-packaged items sold at the vazhipadu counter — separate stock that's transferred from main store.
  const [retailItems, setRetailItems] = useState(INITIAL_RETAIL_ITEMS);
  // Sales: { id, billNo, time, items: [{itemId, name, brand, qty, mrp, lineTotal}], total, paymentMode, customerName, gstApplicable }
  const [retailSales, setRetailSales] = useState([]);

  // Kiosk pre-bills: devotee builds order at the touchscreen kiosk → slip printed → pays at counter.
  // status: "Pending" → "Paid" (becomes a real bill) | "Cancelled" (devotee changed mind)
  const [kioskOrders, setKioskOrders] = useState([]);

  // Track when the user last exported a backup. ISO timestamp string, or null if never.
  const [lastBackupAt, setLastBackupAt] = useState(null);

  // Load persisted state from browser localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("temple-state");
      if (stored) {
        const s = JSON.parse(stored);
        if (s.inventory) setInventory(s.inventory);
        if (s.bookings) setBookings(s.bookings);
        if (s.issuances) setIssuances(s.issuances);
        if (s.openLog) setOpenLog(s.openLog);
        if (s.poojaLog) setPoojaLog(s.poojaLog);
        if (s.housekeeping) setHousekeeping(s.housekeeping);
        if (s.events) setEvents(s.events);
        if (s.requisitions) setRequisitions(s.requisitions);
        if (s.purchaseIndents) setPurchaseIndents(s.purchaseIndents);
        if (s.vendors) setVendors(s.vendors);
        if (s.quotations) setQuotations(s.quotations);
        if (s.purchaseOrders) setPurchaseOrders(s.purchaseOrders);
        if (s.grns) setGrns(s.grns);
        if (s.bills) setBills(s.bills);
        if (s.retailItems) setRetailItems(s.retailItems);
        if (s.retailSales) setRetailSales(s.retailSales);
        if (s.kioskOrders) setKioskOrders(s.kioskOrders);
        if (s.lastBackupAt) setLastBackupAt(s.lastBackupAt);
      }
    } catch (e) {
      // localStorage might be disabled or quota exceeded — silently ignore
      console.warn("Could not load saved state:", e);
    }
  }, []);

  // Persist to browser localStorage on any state change
  useEffect(() => {
    try {
      const state = { inventory, bookings, issuances, openLog, poojaLog, housekeeping, events, requisitions, purchaseIndents, vendors, quotations, purchaseOrders, grns, bills, retailItems, retailSales, kioskOrders, lastBackupAt };
      localStorage.setItem("temple-state", JSON.stringify(state));
    } catch (e) {
      console.warn("Could not save state:", e);
    }
  }, [inventory, bookings, issuances, openLog, poojaLog, housekeeping, events, requisitions, purchaseIndents, vendors, quotations, purchaseOrders, grns, bills, retailItems, retailSales, kioskOrders, lastBackupAt]);

  // Core cross-module logic: book a CART of vazhipadus → atomic inventory check → single bill, multiple line items
  // cart: [{ vazhipaduId, devoteeName, nakshatram, preferredDate }, ...]
  const bookVazhipadu = (cart) => {
    if (!cart || cart.length === 0) return { ok: false, msg: "Cart is empty." };

    // Resolve each cart entry to its vazhipadu definition
    const resolved = cart.map((c) => ({ ...c, v: VAZHIPADU_CATALOG.find((x) => x.id === c.vazhipaduId) }));
    if (resolved.some((r) => !r.v)) return { ok: false, msg: "Invalid vazhipadu in cart." };
    if (resolved.some((r) => !r.devoteeName?.trim())) return { ok: false, msg: "Each line needs a devotee name." };

    // Aggregate total items needed across the cart, then check inventory once
    const needed = {}; // itemName -> qty
    for (const { v } of resolved) {
      for (const [name, qty] of v.items) {
        needed[name] = (needed[name] || 0) + qty;
      }
    }
    const shortages = [];
    for (const [name, qty] of Object.entries(needed)) {
      const inv = inventory.find((i) => i.name === name);
      if (!inv || inv.qty < qty) shortages.push(`${name} (need ${qty.toFixed(3)}, have ${inv?.qty ?? 0})`);
    }
    if (shortages.length) return { ok: false, msg: `Insufficient stock: ${shortages.join(", ")}` };

    // Deduct aggregate inventory in a single update + bump totalIssued
    setInventory((inv) =>
      inv.map((i) =>
        needed[i.name] != null
          ? {
              ...i,
              qty: +(i.qty - needed[i.name]).toFixed(3),
              totalIssued: +((i.totalIssued || 0) + needed[i.name]).toFixed(3),
            }
          : i
      )
    );

    const billNo = `B${Date.now().toString().slice(-6)}`;
    const ts = new Date().toISOString();
    const total = resolved.reduce((s, r) => s + r.v.price, 0);

    // One booking record per line item (preserves devotee/nakshatram per line) but all share billNo
    const newBookings = resolved.map((r, idx) => ({
      id: `${ts}-${idx}`,
      billNo,
      lineNo: idx + 1,
      vazhipaduId: r.v.id,
      vazhipaduName: r.v.name,
      vazhipaduMalayalam: r.v.malayalam,
      devoteeName: r.devoteeName.trim(),
      nakshatram: r.nakshatram?.trim() || "",
      preferredDate: r.preferredDate || ts.slice(0, 10),
      price: r.v.price,
      time: ts,
      area: r.v.area,
    }));
    setBookings((b) => [...newBookings, ...b]);

    // Group issuances by area: items going to same area combined into one issuance row
    const byArea = {};
    for (const { v } of resolved) {
      if (!byArea[v.area]) byArea[v.area] = {};
      for (const [name, qty] of v.items) byArea[v.area][name] = (byArea[v.area][name] || 0) + qty;
    }
    const newIssuances = Object.entries(byArea).map(([area, items], idx) => ({
      id: `${ts}-iss-${idx}`,
      billNo,
      area,
      items: Object.entries(items).map(([n, q]) => [n, +q.toFixed(3)]),
      time: ts,
      status: "Issued",
    }));
    setIssuances((iss) => [...newIssuances, ...iss]);

    return { ok: true, msg: `Bill ${billNo} created · ₹${total} · ${cart.length} item${cart.length > 1 ? "s" : ""}`, billNo, ts, total, lines: newBookings };
  };

  // ===== RETAIL SALES =====
  // sellRetail: cart of { itemId, qty }. Atomic stock check across the cart.
  const sellRetail = (cart, paymentMode = "Cash", customerName = "") => {
    if (!cart || cart.length === 0) return { ok: false, msg: "Cart is empty." };

    // Aggregate qty needed per item (cart can have duplicates)
    const needed = {};
    for (const c of cart) {
      if (!c.itemId || !c.qty || c.qty <= 0) return { ok: false, msg: "Each line needs a positive qty." };
      needed[c.itemId] = (needed[c.itemId] || 0) + c.qty;
    }

    // Stock check
    const shortages = [];
    for (const [itemId, qty] of Object.entries(needed)) {
      const item = retailItems.find((r) => r.id === itemId);
      if (!item) return { ok: false, msg: `Unknown item.` };
      if (item.counterQty < qty) {
        shortages.push(`${item.name} (${item.brand}) — need ${qty}, counter has ${item.counterQty}`);
      }
    }
    if (shortages.length) {
      return { ok: false, msg: `Counter stock short: ${shortages.join(", ")}. Raise a counter requisition to refill.` };
    }

    // Deduct from counter stock
    setRetailItems((rs) =>
      rs.map((r) => (needed[r.id] != null ? { ...r, counterQty: r.counterQty - needed[r.id] } : r))
    );

    const billNo = `S${Date.now().toString().slice(-6)}`;
    const ts = new Date().toISOString();

    // Build line items with snapshot of MRP at time of sale (in case price changes later)
    const lineItems = cart.map((c) => {
      const item = retailItems.find((r) => r.id === c.itemId);
      const lineTotal = c.qty * item.mrp;
      return {
        itemId: c.itemId,
        name: item.name,
        brand: item.brand,
        category: item.category,
        packSize: item.packSize,
        qty: c.qty,
        mrp: item.mrp,
        costPrice: item.costPrice,
        lineTotal,
      };
    });
    const total = lineItems.reduce((s, l) => s + l.lineTotal, 0);
    const totalCost = lineItems.reduce((s, l) => s + l.qty * l.costPrice, 0);
    const margin = total - totalCost;

    setRetailSales((ss) => [
      { id: ts, billNo, time: ts, items: lineItems, total, totalCost, margin, paymentMode, customerName: customerName?.trim() || "" },
      ...ss,
    ]);

    return { ok: true, msg: `Sale ${billNo} · ₹${total}`, billNo, ts, total, lines: lineItems, paymentMode, customerName };
  };

  // ===== COUNTER STOCK REQUISITION =====
  // The counter raises a requisition to the store for retail items running low.
  // This goes into the EXISTING requisitions queue (Pending Queue) so the store keeper handles it
  // through the normal flow. When approved, the issuance dialog will deduct from the store side
  // and the counter staff will then bump counterQty manually upon receipt.
  // Items here are kind: "retail" — distinguished from consumables/capital.
  const raiseCounterRequisition = ({ items, purpose }) => {
    if (!items?.length) return { ok: false, msg: "No items to requisition." };
    const reqNo = `R${Date.now().toString().slice(-6)}`;
    setRequisitions((rs) => [
      {
        id: `req-${Date.now()}`,
        reqNo,
        requestedBy: "Counter",
        forArea: "Counter",
        purpose: purpose || "Counter retail stock refill",
        raisedAt: new Date().toISOString(),
        requiredBy: null,
        items: items.map((i) => {
          const ri = retailItems.find((r) => r.id === i.itemId);
          return {
            kind: "retail",
            itemId: i.itemId,
            name: ri?.name || "Unknown",
            brand: ri?.brand || "",
            packSize: ri?.packSize || "",
            qtyRequested: i.qty,
            unit: "pkt", // packets/pieces — generic for retail
          };
        }),
        status: "Pending",
        isCounterRefill: true,
      },
      ...rs,
    ]);
    return { ok: true, msg: `Counter requisition ${reqNo} raised.`, reqNo };
  };

  // Receive items into counter stock (after store keeper has issued them via the normal requisition flow)
  // Counter staff acknowledges receipt and bumps counterQty.
  const receiveCounterStock = (itemId, qty, source = "Store transfer") => {
    if (!qty || qty <= 0) return { ok: false, msg: "Qty must be positive." };
    setRetailItems((rs) =>
      rs.map((r) => (r.id === itemId ? { ...r, counterQty: r.counterQty + qty } : r))
    );
    return { ok: true, msg: `${qty} added to counter stock.` };
  };

  // ===== KIOSK ORDERS =====
  // Devotee pays directly at the kiosk. Atomic: validate stock → take payment → book vazhipadu → sell retail → create dispatch record.
  // payment: { mode: "UPI"|"Card"|"NETC", txnRef: string }
  // Returns { ok, msg, bill, order } — bill is the printable structure, order is the kiosk record for queue tracking.
  const payAtKiosk = (order, payment) => {
    const vCart = order.vazhipaduCart || [];
    const rCart = order.retailCart || [];
    if (vCart.length === 0 && rCart.length === 0) return { ok: false, msg: "Nothing to pay for." };
    if (!payment?.mode) return { ok: false, msg: "Payment mode required." };
    if (!payment?.txnRef) return { ok: false, msg: "Transaction reference required." };

    // Pre-validate retail stock (atomic check before charging anything)
    const retailNeeded = {};
    for (const c of rCart) retailNeeded[c.itemId] = (retailNeeded[c.itemId] || 0) + c.qty;
    for (const [itemId, qty] of Object.entries(retailNeeded)) {
      const item = retailItems.find((r) => r.id === itemId);
      if (!item) return { ok: false, msg: `Item not found.` };
      if (item.counterQty < qty) {
        return { ok: false, msg: `${item.name} out of stock at counter — please choose a different item.` };
      }
    }

    // Vazhipadu booking — uses existing bookVazhipadu (handles main inventory deduction)
    let vazhipaduResult = null;
    if (vCart.length > 0) {
      const cart = vCart.map((l) => ({
        vazhipaduId: l.vazhipaduId,
        devoteeName: (l.devoteeName || order.primaryName || "").trim(),
        nakshatram: (l.nakshatram || order.primaryNakshatram || "").trim(),
      }));
      vazhipaduResult = bookVazhipadu(cart);
      if (!vazhipaduResult.ok) {
        // Inventory short for pooja items — refund payment in real life; here just refuse
        return { ok: false, msg: `Pooja items not available: ${vazhipaduResult.msg}. Payment will be refunded.` };
      }
    }

    // Retail sale — uses existing sellRetail (handles counter stock deduction)
    let retailResult = null;
    if (rCart.length > 0) {
      retailResult = sellRetail(rCart, payment.mode, order.primaryName);
      if (!retailResult.ok) {
        // Should not happen because we validated above, but guard anyway
        return { ok: false, msg: `Retail items not available: ${retailResult.msg}. Payment will be refunded.` };
      }
    }

    const ts = new Date().toISOString();
    const totalPaid = (vazhipaduResult?.total || 0) + (retailResult?.total || 0);
    const billNo = vazhipaduResult?.billNo || retailResult?.billNo;

    // Token is per-day sequential
    const today = new Date().toDateString();
    const todayCount = kioskOrders.filter((o) => new Date(o.createdAt).toDateString() === today).length;
    const tokenNo = `T${String(todayCount + 1).padStart(3, "0")}`;

    const kioskRecord = {
      id: `ko-${Date.now()}`,
      tokenNo,
      createdAt: ts,
      primaryName: order.primaryName?.trim() || "",
      primaryNakshatram: order.primaryNakshatram?.trim() || "",
      phone: order.phone?.trim() || "",
      vazhipaduLines: vazhipaduResult?.lines || [],
      retailLines: retailResult?.lines || [],
      total: totalPaid,
      status: "AwaitingDispatch", // payment done; counter staff just hands over items
      paymentMode: payment.mode,
      paymentTxnRef: payment.txnRef,
      paidAt: ts,
      billNo,
    };
    setKioskOrders((ks) => [kioskRecord, ...ks]);

    return {
      ok: true,
      msg: `Paid ₹${totalPaid} via ${payment.mode}`,
      bill: {
        billNo,
        time: ts,
        total: totalPaid,
        lines: vazhipaduResult?.lines || [],
        retailLines: retailResult?.lines || [],
        paymentMode: payment.mode,
        paymentTxnRef: payment.txnRef,
        primaryName: order.primaryName,
        primaryNakshatram: order.primaryNakshatram,
        tokenNo,
        fromKiosk: true,
        paid: true,
      },
      order: kioskRecord,
    };
  };

  // Counter staff confirms all items have been handed over to the devotee.
  const dispatchKioskOrder = (orderId, staffName = "") => {
    setKioskOrders((ks) =>
      ks.map((o) =>
        o.id === orderId
          ? { ...o, status: "Dispatched", dispatchedAt: new Date().toISOString(), dispatchedBy: staffName }
          : o
      )
    );
    return { ok: true };
  };

  const cancelKioskOrder = (orderId, reason = "") => {
    setKioskOrders((ks) =>
      ks.map((o) => (o.id === orderId ? { ...o, status: "Cancelled", cancelledAt: new Date().toISOString(), cancelReason: reason } : o))
    );
  };

  // ===== REQUISITION HANDLERS =====

  // Raise: an area requests items from the store. Doesn't deduct anything yet — just a request.
  const raiseRequisition = ({ requestedBy, forArea, purpose, items, requiredBy }) => {
    if (!requestedBy || !items?.length) return { ok: false, msg: "Need a requester and at least one item." };
    if (items.some((i) => !i.qtyRequested || i.qtyRequested <= 0)) return { ok: false, msg: "Each item needs a positive quantity." };

    const reqNo = `R${Date.now().toString().slice(-6)}`;
    setRequisitions((rs) => [
      {
        id: `req-${Date.now()}`,
        reqNo,
        requestedBy,
        forArea: forArea || requestedBy,
        purpose: purpose || "",
        raisedAt: new Date().toISOString(),
        requiredBy: requiredBy || null,
        items: items.map((i) => ({ ...i })),
        status: "Pending",
      },
      ...rs,
    ]);
    return { ok: true, msg: `Requisition ${reqNo} raised.`, reqNo };
  };

  // Issue: store keeper approves and dispatches. Issues whatever is available.
  // Any shortfall is recorded on the requisition AND auto-added to the purchase indent register.
  // details: { issuedBy, receivedBy, issuedAt, remark }
  const issueRequisition = (reqId, details = {}) => {
    const req = requisitions.find((r) => r.id === reqId);
    if (!req) return { ok: false, msg: "Requisition not found." };
    if (req.status !== "Pending") return { ok: false, msg: `Already ${req.status}.` };

    const issuedBy = details.issuedBy?.trim();
    const receivedBy = details.receivedBy?.trim();
    if (!issuedBy) return { ok: false, msg: "Issued-by name is required." };
    if (!receivedBy) return { ok: false, msg: "Received-by name is required." };

    // Compute per-item issued vs short, based on current inventory.
    // Capital items are all-or-nothing.
    // Retail items come from a separate retail pool — assumed available; counter bumps its own stock on receipt.
    const itemResults = req.items.map((it) => {
      if (it.kind === "capital" || it.kind === "retail") {
        return { ...it, qtyIssued: it.qtyRequested, qtyShort: 0 };
      }
      const inv = inventory.find((x) => x.id === it.itemId);
      const available = inv?.qty ?? 0;
      const qtyIssued = Math.min(available, it.qtyRequested);
      const qtyShort = +(it.qtyRequested - qtyIssued).toFixed(3);
      return { ...it, qtyIssued: +qtyIssued.toFixed(3), qtyShort };
    });

    const issuedItems = itemResults.filter((i) => i.qtyIssued > 0);
    const shortItems = itemResults.filter((i) => i.qtyShort > 0);

    if (issuedItems.length === 0) {
      // Nothing in stock at all — store keeper should reject or wait for purchase
      return { ok: false, msg: "Nothing available in stock. Reject the request or wait for purchase to complete." };
    }

    // Deduct what's actually issued from inventory + bump totalIssued
    setInventory((inv) =>
      inv.map((i) => {
        const issuedRow = issuedItems.find((c) => c.kind === "consumable" && c.itemId === i.id);
        return issuedRow
          ? {
              ...i,
              qty: +(i.qty - issuedRow.qtyIssued).toFixed(3),
              totalIssued: +((i.totalIssued || 0) + issuedRow.qtyIssued).toFixed(3),
            }
          : i;
      })
    );

    const issuedAt = details.issuedAt || new Date().toISOString();
    const recordedAt = new Date().toISOString();
    const finalStatus = shortItems.length > 0 ? "PartiallyIssued" : "Issued";

    setRequisitions((rs) =>
      rs.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status: finalStatus,
              issuedAt,
              recordedAt,
              issuedBy,
              receivedBy,
              issueRemark: details.remark?.trim() || "",
              items: itemResults, // overwrite items with the per-line issued/short breakdown
            }
          : r
      )
    );

    // Add to issuance feed (only the actually issued portion)
    setIssuances((iss) => [
      {
        id: `${issuedAt}-req-${req.reqNo}`,
        billNo: req.reqNo,
        area: req.forArea,
        items: issuedItems.map((i) => [i.name, i.qtyIssued]),
        time: issuedAt,
        status: finalStatus,
        kind: "requisition",
        requestedBy: req.requestedBy,
        issuedBy,
        receivedBy,
      },
      ...iss,
    ]);

    // Push shortages into the purchase indent register, consolidating with any existing Open entry
    if (shortItems.length > 0) {
      setPurchaseIndents((pis) => {
        const updated = [...pis];
        for (const s of shortItems) {
          if (s.kind !== "consumable") continue; // capital items handled differently
          const existingIdx = updated.findIndex(
            (p) => p.itemId === s.itemId && p.status === "Open"
          );
          if (existingIdx >= 0) {
            // Add to existing open indent
            const ex = updated[existingIdx];
            updated[existingIdx] = {
              ...ex,
              qtyNeeded: +(ex.qtyNeeded + s.qtyShort).toFixed(3),
              sources: [...ex.sources, { reqNo: req.reqNo, requestedBy: req.requestedBy, qty: s.qtyShort, raisedAt: req.raisedAt }],
              updatedAt: new Date().toISOString(),
            };
          } else {
            // Create a new open indent entry
            updated.unshift({
              id: `pi-${Date.now()}-${s.itemId}`,
              indentNo: `P${Date.now().toString().slice(-6)}-${s.itemId.replace("i", "")}`,
              itemId: s.itemId,
              itemName: s.name,
              unit: s.unit,
              qtyNeeded: s.qtyShort,
              status: "Open",
              source: "shortage",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              sources: [{ reqNo: req.reqNo, requestedBy: req.requestedBy, qty: s.qtyShort, raisedAt: req.raisedAt }],
            });
          }
        }
        return updated;
      });
    }

    const msg = shortItems.length === 0
      ? `Issued in full to ${req.forArea}.`
      : `Partially issued. ${shortItems.length} item${shortItems.length > 1 ? "s" : ""} added to purchase indent.`;
    return { ok: true, msg, partial: shortItems.length > 0 };
  };

  // Mark a purchase indent as Ordered (purchase order placed with vendor)
  const markIndentOrdered = (indentId, details = {}) => {
    setPurchaseIndents((pis) =>
      pis.map((p) =>
        p.id === indentId
          ? {
              ...p,
              status: "Ordered",
              orderedAt: new Date().toISOString(),
              orderedBy: details.orderedBy?.trim() || "Store Keeper",
              vendor: details.vendor?.trim() || "",
              expectedBy: details.expectedBy || null,
              estCost: details.estCost ? parseFloat(details.estCost) : null,
            }
          : p
      )
    );
  };

  // Mark a purchase indent as Received → restock inventory using weighted-average cost
  const markIndentReceived = (indentId, details = {}) => {
    const indent = purchaseIndents.find((p) => p.id === indentId);
    if (!indent) return { ok: false, msg: "Indent not found." };
    const qtyReceived = parseFloat(details.qtyReceived);
    const costPerUnit = parseFloat(details.costPerUnit);
    if (isNaN(qtyReceived) || qtyReceived <= 0) return { ok: false, msg: "Received qty must be positive." };
    if (isNaN(costPerUnit) || costPerUnit < 0) return { ok: false, msg: "Cost must be a number." };

    setInventory((inv) =>
      inv.map((i) => {
        if (i.id !== indent.itemId) return i;
        const oldValue = i.qty * i.unitCost;
        const newValue = qtyReceived * costPerUnit;
        const newQty = +(i.qty + qtyReceived).toFixed(3);
        const newAvgCost = newQty > 0 ? +((oldValue + newValue) / newQty).toFixed(2) : costPerUnit;
        return {
          ...i,
          qty: newQty,
          unitCost: newAvgCost,
          totalReceived: +((i.totalReceived || 0) + qtyReceived).toFixed(3),
        };
      })
    );

    setPurchaseIndents((pis) =>
      pis.map((p) =>
        p.id === indentId
          ? {
              ...p,
              status: "Received",
              receivedAt: new Date().toISOString(),
              receivedBy: details.receivedBy?.trim() || "Store Keeper",
              qtyReceived,
              costPerUnit,
              vendor: details.vendor?.trim() || p.vendor || "",
            }
          : p
      )
    );

    return { ok: true, msg: `Received ${formatQty(qtyReceived, indent.unit)} of ${indent.itemName}. Inventory updated.` };
  };

  const cancelIndent = (indentId, reason = "") => {
    setPurchaseIndents((pis) =>
      pis.map((p) => (p.id === indentId ? { ...p, status: "Cancelled", cancelledAt: new Date().toISOString(), cancelReason: reason } : p))
    );
  };

  // Generate Open indents for every consumable at or below reorder level that doesn't already have one Open.
  // Suggested qty = (reorder * 2) − current qty, so we restock to roughly twice the reorder threshold.
  const generateReorderIndents = (createdBy = "Auto-reorder") => {
    const ts = new Date().toISOString();
    let created = 0;
    setPurchaseIndents((pis) => {
      const updated = [...pis];
      const lowItems = inventory.filter((i) => i.qty <= i.reorder);
      for (const item of lowItems) {
        // Skip if already an Open indent for this item
        if (updated.some((p) => p.itemId === item.id && p.status === "Open")) continue;
        const suggestedQty = Math.max(+(item.reorder * 2 - item.qty).toFixed(3), item.reorder);
        updated.unshift({
          id: `pi-reorder-${Date.now()}-${item.id}`,
          indentNo: `P${Date.now().toString().slice(-6)}-${item.id.replace("i", "")}`,
          itemId: item.id,
          itemName: item.name,
          unit: item.unit,
          qtyNeeded: suggestedQty,
          status: "Open",
          source: "reorder", // distinguishes from shortage-driven indents
          createdAt: ts,
          updatedAt: ts,
          createdBy,
          sources: [{ reqNo: "—", requestedBy: "Reorder rule", qty: suggestedQty, raisedAt: ts, note: `Below reorder (${formatQty(item.reorder, item.unit)})` }],
        });
        created++;
      }
      return updated;
    });
    return { ok: true, created };
  };

  const rejectRequisition = (reqId, reason = "") => {
    setRequisitions((rs) =>
      rs.map((r) => (r.id === reqId ? { ...r, status: "Rejected", rejectedAt: new Date().toISOString(), rejectReason: reason } : r))
    );
  };

  // Return capital items: only valid for Issued requisitions that contain capital items.
  // details: { returnedBy, verifiedBy, returnedAt, returnRemark }
  const returnRequisition = (reqId, details = {}) => {
    setRequisitions((rs) =>
      rs.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status: "Returned",
              returnedAt: details.returnedAt || new Date().toISOString(),
              returnedBy: details.returnedBy?.trim() || "",
              verifiedBy: details.verifiedBy?.trim() || "",
              returnRemark: details.returnRemark?.trim() || "",
            }
          : r
      )
    );
  };

  // ===== PROCUREMENT HANDLERS =====

  const saveVendor = (vendor) => {
    if (!vendor.name?.trim()) return { ok: false, msg: "Vendor name required." };
    if (vendor.id) {
      setVendors((vs) => vs.map((v) => (v.id === vendor.id ? { ...v, ...vendor } : v)));
      return { ok: true, msg: "Vendor updated." };
    }
    const newId = `ven-${Date.now()}`;
    const code = `V${String(vendors.length + 1).padStart(3, "0")}`;
    setVendors((vs) => [
      ...vs,
      {
        id: newId, code, ...vendor,
        ratings: { quality: 0, timeliness: 0, accuracy: 0 }, totalOrders: 0, ordersOnTime: 0, billsAccurate: 0,
      },
    ]);
    return { ok: true, msg: "Vendor added.", id: newId };
  };

  const deleteVendor = (id) => setVendors((vs) => vs.filter((v) => v.id !== id));

  // Create a quotation request: indent + list of vendors to quote
  const createQuotation = (indentId, vendorIds) => {
    if (!vendorIds?.length) return { ok: false, msg: "Pick at least one vendor." };
    const indent = purchaseIndents.find((p) => p.id === indentId);
    if (!indent) return { ok: false, msg: "Indent not found." };
    const newId = `q-${Date.now()}`;
    setQuotations((qs) => [
      {
        id: newId,
        quoteNo: `Q${Date.now().toString().slice(-6)}`,
        indentId,
        itemId: indent.itemId,
        itemName: indent.itemName,
        qtyNeeded: indent.qtyNeeded,
        unit: indent.unit,
        requestedAt: new Date().toISOString(),
        status: "Open",
        quotes: vendorIds.map((vid) => {
          const vendor = vendors.find((v) => v.id === vid);
          // Pre-fill with vendor's default rate if known
          const defaultRate = vendor?.defaultRates?.[indent.itemId] ?? null;
          return { vendorId: vid, ratePerUnit: defaultRate, deliveryDays: null, notes: "", receivedAt: null };
        }),
      },
      ...qs,
    ]);
    return { ok: true, msg: `Quotation ${newId} created.`, id: newId };
  };

  // Update a single vendor's quote
  const updateQuote = (quotationId, vendorId, patch) => {
    setQuotations((qs) =>
      qs.map((q) =>
        q.id === quotationId
          ? {
              ...q,
              quotes: q.quotes.map((qu) =>
                qu.vendorId === vendorId
                  ? { ...qu, ...patch, receivedAt: patch.ratePerUnit ? (qu.receivedAt || new Date().toISOString()) : qu.receivedAt }
                  : qu
              ),
            }
          : q
      )
    );
  };

  // Finalize a vendor → create a Purchase Order, mark indent as Ordered, close quotation
  const createPurchaseOrder = (quotationId, vendorId, details = {}) => {
    const q = quotations.find((x) => x.id === quotationId);
    if (!q) return { ok: false, msg: "Quotation not found." };
    const quote = q.quotes.find((x) => x.vendorId === vendorId);
    if (!quote || !quote.ratePerUnit) return { ok: false, msg: "This vendor has no rate quoted." };
    const vendor = vendors.find((v) => v.id === vendorId);
    if (!vendor) return { ok: false, msg: "Vendor not found." };

    const totalAmount = q.qtyNeeded * quote.ratePerUnit;
    const poNo = `PO${Date.now().toString().slice(-6)}`;
    const ts = new Date().toISOString();

    setPurchaseOrders((pos) => [
      {
        id: `po-${Date.now()}`,
        poNo,
        indentId: q.indentId,
        quotationId,
        vendorId,
        vendorName: vendor.name,
        items: [{ itemId: q.itemId, name: q.itemName, qty: q.qtyNeeded, ratePerUnit: quote.ratePerUnit, unit: q.unit, amount: totalAmount }],
        totalAmount,
        status: "Issued",
        issuedAt: ts,
        issuedBy: details.issuedBy || "Store Keeper",
        expectedBy: details.expectedBy || (quote.deliveryDays ? new Date(Date.now() + quote.deliveryDays * 86400000).toISOString().split("T")[0] : null),
        paymentTerms: vendor.paymentTerms || "",
        notes: details.notes || "",
      },
      ...pos,
    ]);

    // Close the quotation
    setQuotations((qs) => qs.map((x) => (x.id === quotationId ? { ...x, status: "Closed", awardedTo: vendorId, closedAt: ts } : x)));

    // Mark indent as Ordered (consistent with the existing flow)
    setPurchaseIndents((pis) =>
      pis.map((p) =>
        p.id === q.indentId
          ? { ...p, status: "Ordered", orderedAt: ts, orderedBy: details.issuedBy || "Store Keeper", vendor: vendor.name, expectedBy: details.expectedBy, estCost: quote.ratePerUnit, poNo, poId: `po-${Date.now()}` }
          : p
      )
    );

    return { ok: true, msg: `PO ${poNo} created.`, poNo };
  };

  // GRN: receive goods against a PO (full or partial); update PO status; add stock; update vendor reliability
  const createGRN = (poId, details = {}) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return { ok: false, msg: "PO not found." };
    const items = details.items || []; // [{ itemId, qtyReceived, condition, remark }]
    if (items.some((i) => i.qtyReceived == null || i.qtyReceived < 0)) return { ok: false, msg: "Each line needs a received qty." };

    const grnNo = `GRN${Date.now().toString().slice(-6)}`;
    const ts = new Date().toISOString();

    // Compute discrepancies and inventory deltas
    const grnItems = po.items.map((poItem) => {
      const recv = items.find((x) => x.itemId === poItem.itemId);
      const qtyReceived = recv?.qtyReceived ?? 0;
      const variance = +(qtyReceived - poItem.qty).toFixed(3);
      return { ...poItem, qtyOrdered: poItem.qty, qtyReceived, variance, condition: recv?.condition || "Good", remark: recv?.remark || "" };
    });
    const hasShort = grnItems.some((i) => i.variance < 0);

    // Add stock + bump totalReceived using weighted-avg cost (only for items with qtyReceived > 0)
    setInventory((inv) =>
      inv.map((i) => {
        const grnRow = grnItems.find((g) => g.itemId === i.id && g.qtyReceived > 0);
        if (!grnRow) return i;
        const oldValue = i.qty * i.unitCost;
        const newValue = grnRow.qtyReceived * grnRow.ratePerUnit;
        const newQty = +(i.qty + grnRow.qtyReceived).toFixed(3);
        const newAvgCost = newQty > 0 ? +((oldValue + newValue) / newQty).toFixed(2) : grnRow.ratePerUnit;
        return { ...i, qty: newQty, unitCost: newAvgCost, totalReceived: +((i.totalReceived || 0) + grnRow.qtyReceived).toFixed(3) };
      })
    );

    setGrns((gs) => [
      {
        id: `grn-${Date.now()}`,
        grnNo, poId, poNo: po.poNo, vendorId: po.vendorId, vendorName: po.vendorName,
        receivedAt: ts, receivedBy: details.receivedBy || "Store Keeper",
        items: grnItems,
        hasShort,
        remark: details.remark || "",
      },
      ...gs,
    ]);

    // Update PO status
    const allReceivedFully = grnItems.every((i) => i.qtyReceived >= i.qtyOrdered);
    setPurchaseOrders((pos) =>
      pos.map((p) => (p.id === poId ? { ...p, status: allReceivedFully ? "Received" : "PartiallyReceived", lastGrnAt: ts } : p))
    );

    // Mark indent as Received if PO fully received
    if (allReceivedFully) {
      setPurchaseIndents((pis) =>
        pis.map((p) => (p.id === po.indentId ? { ...p, status: "Received", receivedAt: ts, receivedBy: details.receivedBy || "Store Keeper" } : p))
      );
    }

    // Update vendor reliability: timeliness based on expected vs actual delivery
    if (po.expectedBy) {
      const wasOnTime = new Date(ts) <= new Date(po.expectedBy + "T23:59:59");
      setVendors((vs) =>
        vs.map((v) => {
          if (v.id !== po.vendorId) return v;
          const totalOrders = (v.totalOrders || 0) + 1;
          const ordersOnTime = (v.ordersOnTime || 0) + (wasOnTime ? 1 : 0);
          const timeliness = +(((ordersOnTime / totalOrders) * 5).toFixed(1));
          const quality = grnItems.every((i) => i.condition === "Good" || i.condition === "Excellent")
            ? Math.min(5, +(((v.ratings.quality * (totalOrders - 1)) + (grnItems.every((i) => i.condition === "Excellent") ? 5 : 4.3)) / totalOrders).toFixed(1))
            : Math.max(0, +(((v.ratings.quality * (totalOrders - 1)) + 3) / totalOrders).toFixed(1));
          return {
            ...v,
            totalOrders,
            ordersOnTime,
            ratings: { ...v.ratings, timeliness, quality },
          };
        })
      );
    }

    return { ok: true, msg: `GRN ${grnNo} recorded.${hasShort ? " Some items short — will need follow-up." : ""}`, grnNo };
  };

  // Bill: record vendor's invoice, optionally with scan + OCR text. Reconcile against PO.
  const createBill = (billData) => {
    if (!billData.vendorId || !billData.totalAmount) return { ok: false, msg: "Vendor and amount required." };
    const billNo = `BILL${Date.now().toString().slice(-6)}`;
    const newBill = {
      id: `bill-${Date.now()}`,
      billNo,
      ...billData,
      createdAt: new Date().toISOString(),
      status: "Pending",
    };
    setBills((bs) => [newBill, ...bs]);
    return { ok: true, msg: "Bill recorded.", billNo, id: newBill.id };
  };

  const verifyBill = (billId, status, remark = "") => {
    setBills((bs) =>
      bs.map((b) => (b.id === billId ? { ...b, status, verifiedAt: new Date().toISOString(), verifyRemark: remark } : b))
    );
    // Update vendor accuracy if verified
    const bill = bills.find((b) => b.id === billId);
    if (bill && (status === "Verified" || status === "Paid")) {
      setVendors((vs) =>
        vs.map((v) => {
          if (v.id !== bill.vendorId) return v;
          const totalOrders = v.totalOrders || 1;
          const billsAccurate = (v.billsAccurate || 0) + (status === "Verified" || status === "Paid" ? 1 : 0);
          const accuracy = +(((billsAccurate / totalOrders) * 5).toFixed(1));
          return { ...v, billsAccurate, ratings: { ...v.ratings, accuracy } };
        })
      );
    }
  };

  const markBillPaid = (billId, paymentDetails = {}) => {
    setBills((bs) =>
      bs.map((b) =>
        b.id === billId
          ? { ...b, status: "Paid", paidAt: new Date().toISOString(), paymentMode: paymentDetails.mode || "Cash", paymentRef: paymentDetails.ref || "" }
          : b
      )
    );
  };

  const totalRevenue = bookings.reduce((s, b) => s + b.price, 0);
  const lowStock = inventory.filter((i) => i.qty <= i.reorder);
  const pendingReqCount = requisitions.filter((r) => r.status === "Pending").length;
  const openIndentCount = purchaseIndents.filter((p) => p.status === "Open").length;
  const storeBadge = pendingReqCount + openIndentCount;
  const pendingBills = bills.filter((b) => b.status === "Pending").length;
  const openPOs = purchaseOrders.filter((p) => p.status === "Issued" || p.status === "PartiallyReceived").length;
  const purchaseBadge = openPOs + pendingBills;

  const TABS = [
    { id: "daily", label: "Daily Routine", icon: Sun },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "store", label: "Store / Requisition", icon: ClipboardList, badge: storeBadge },
    { id: "purchase", label: "Purchase", icon: ShoppingCart, badge: purchaseBadge },
    { id: "counter", label: "Vazhipadu Counter", icon: Receipt },
    { id: "events", label: "Uthsavam", icon: Calendar },
    { id: "data", label: "Data Entry", icon: FileSpreadsheet },
  ];

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg, #fdf6e8 0%, #f5e9cf 100%)",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Noto+Sans+Malayalam:wght@400;600&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <header className="border-b-2 border-amber-900/30 bg-gradient-to-b from-amber-50 to-transparent">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-amber-800/70 mb-1">
                ✦ Nelliakattu Oushadheeswari Temple · Kizhakombu ✦
              </div>
              <h1
                className="text-3xl md:text-4xl font-bold text-amber-950"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "0.02em" }}
              >
                DEVASARVAM
              </h1>
              <p className="text-sm text-amber-800/80 italic mt-1" style={{ fontFamily: "'Noto Sans Malayalam', serif" }}>
                ക്ഷേത്ര നടത്തിപ്പ് സംവിധാനം · ദേവസർവം
              </p>
            </div>
            <div className="text-right text-sm text-amber-900">
              <div className="font-semibold">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
              <div className="text-amber-800/70 text-xs mt-0.5">
                Today: ₹{totalRevenue} · {bookings.length} bookings · {lowStock.length} low-stock alerts
              </div>
            </div>
          </div>
        </div>

        {/* Tab nav */}
        <nav className="max-w-6xl mx-auto px-2 flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? "border-amber-900 text-amber-950 font-semibold"
                    : "border-transparent text-amber-800/70 hover:text-amber-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                {t.badge > 0 && (
                  <span className="bg-red-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Backup reminder — shows when last backup is older than 24h or never */}
        <BackupReminder lastBackupAt={lastBackupAt} setTab={setTab} />

        {/* Low stock alert banner */}
        {lowStock.length > 0 && tab !== "inventory" && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-700 px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-900">
              <strong>Low stock:</strong> {lowStock.map((i) => `${i.name} (${formatQty(i.qty, i.unit)})`).join(", ")}
            </div>
          </div>
        )}

        {tab === "daily" && (
          <DailyRoutine />
        )}
        {tab === "inventory" && (
          <Inventory />
        )}
        {tab === "store" && (
          <Store
            inventory={inventory}
            requisitions={requisitions}
            purchaseIndents={purchaseIndents}
            raiseRequisition={raiseRequisition}
            issueRequisition={issueRequisition}
            rejectRequisition={rejectRequisition}
            returnRequisition={returnRequisition}
            markIndentOrdered={markIndentOrdered}
            markIndentReceived={markIndentReceived}
            cancelIndent={cancelIndent}
          />
        )}
        {tab === "purchase" && (
          <Purchase
            inventory={inventory}
            vendors={vendors}
            quotations={quotations}
            purchaseOrders={purchaseOrders}
            grns={grns}
            bills={bills}
            purchaseIndents={purchaseIndents}
            saveVendor={saveVendor}
            deleteVendor={deleteVendor}
            createQuotation={createQuotation}
            updateQuote={updateQuote}
            createPurchaseOrder={createPurchaseOrder}
            createGRN={createGRN}
            createBill={createBill}
            verifyBill={verifyBill}
            markBillPaid={markBillPaid}
          />
        )}
        {tab === "counter" && (
          <Counter
            bookVazhipadu={bookVazhipadu}
            bookings={bookings}
            totalRevenue={totalRevenue}
            retailItems={retailItems}
            retailSales={retailSales}
            sellRetail={sellRetail}
            raiseCounterRequisition={raiseCounterRequisition}
            receiveCounterStock={receiveCounterStock}
            kioskOrders={kioskOrders}
            payAtKiosk={payAtKiosk}
            dispatchKioskOrder={dispatchKioskOrder}
            cancelKioskOrder={cancelKioskOrder}
          />
        )}
        {tab === "events" && (
          <Uthsavam />
        )}
        {tab === "data" && (
          <DataEntry
            allState={{
              inventory, bookings, issuances, openLog, poojaLog, housekeeping, events,
              requisitions, purchaseIndents, vendors, quotations, purchaseOrders, grns, bills,
              retailItems, retailSales, kioskOrders,
            }}
            loadAllState={(s) => {
              if (s.inventory) setInventory(s.inventory);
              if (s.bookings) setBookings(s.bookings);
              if (s.issuances) setIssuances(s.issuances);
              if (s.openLog) setOpenLog(s.openLog);
              if (s.poojaLog) setPoojaLog(s.poojaLog);
              if (s.housekeeping) setHousekeeping(s.housekeeping);
              if (s.events) setEvents(s.events);
              if (s.requisitions) setRequisitions(s.requisitions);
              if (s.purchaseIndents) setPurchaseIndents(s.purchaseIndents);
              if (s.vendors) setVendors(s.vendors);
              if (s.quotations) setQuotations(s.quotations);
              if (s.purchaseOrders) setPurchaseOrders(s.purchaseOrders);
              if (s.grns) setGrns(s.grns);
              if (s.bills) setBills(s.bills);
              if (s.retailItems) setRetailItems(s.retailItems);
              if (s.retailSales) setRetailSales(s.retailSales);
              if (s.kioskOrders) setKioskOrders(s.kioskOrders);
            }}
            lastBackupAt={lastBackupAt}
            setLastBackupAt={setLastBackupAt}
          />
        )}
      </main>

      <footer className="border-t border-amber-900/20 mt-12 py-4 text-center text-xs text-amber-800/60 italic">
        Prototype · Data persists in your browser
      </footer>
    </div>
  );
}
