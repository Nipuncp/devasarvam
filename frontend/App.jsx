import { useState, useEffect, useRef } from "react";
import {
  Sun, Moon, Bell, Package, Receipt, Calendar, FileSpreadsheet,
  Plus, Check, X, AlertTriangle, Download, Clock, Users, IndianRupee,
  TrendingDown, Sparkles, Printer, Trash2, ClipboardList, ArrowRight, RotateCcw, Inbox, ShoppingCart, Truck,
  Star, Phone, Building2, FileText, Upload, Loader, Award, Scan, FileCheck
} from "lucide-react";
import initSqlJs from "sql.js";
// The wasm file lives in node_modules/sql.js/dist. Vite handles the URL via its asset import system.
import sqlWasmUrl from "sql.js/dist/sql-wasm.wasm?url";

// =================== SAMPLE DATA ===================
const VAZHIPADU_CATALOG = [
  { id: "v1", name: "Ganapathi Homam", malayalam: "ഗണപതി ഹോമം", price: 501, area: "Homakundam", items: [["Coconut", 5], ["Ghee", 0.5], ["Camphor", 0.05], ["Kumkum", 0.02], ["Akshatam", 0.1]] },
  { id: "v2", name: "Archana", malayalam: "അർച്ചന", price: 21, area: "Sreekovil", items: [["Flowers", 0.05], ["Camphor", 0.005], ["Kumkum", 0.005], ["Agarbathi", 2]] },
  { id: "v3", name: "Pushpanjali", malayalam: "പുഷ്പാഞ്ജലി", price: 51, area: "Sreekovil", items: [["Flowers", 0.15], ["Tulasi", 0.05], ["Camphor", 0.01]] },
  { id: "v4", name: "Neyyabhishekam", malayalam: "നെയ്യഭിഷേകം", price: 151, area: "Sreekovil", items: [["Ghee", 0.25], ["Flowers", 0.1], ["Camphor", 0.02]] },
  { id: "v5", name: "Bhagavathi Seva", malayalam: "ഭഗവതി സേവ", price: 751, area: "Namaskara Mandapam", items: [["Coconut", 3], ["Flowers", 0.5], ["Ghee", 0.3], ["Plantain", 6], ["Camphor", 0.05]] },
  { id: "v6", name: "Niramala", malayalam: "നിറമാല", price: 1101, area: "Sreekovil", items: [["Flowers", 2], ["Tulasi", 0.5], ["Camphor", 0.05]] },
  { id: "v7", name: "Annadanam (per plate)", malayalam: "അന്നദാനം", price: 25, area: "Oottupura", items: [["Rice", 0.15], ["Vegetables", 0.2], ["Ghee", 0.02]] },
];

const INITIAL_INVENTORY = [
  { id: "i1", name: "Coconut", malayalam: "നാളികേരം", unit: "nos", qty: 240, opening: 240, totalReceived: 0, totalIssued: 0, reorder: 50, unitCost: 35, type: "consumable" },
  { id: "i2", name: "Ghee", malayalam: "നെയ്യ്", unit: "kg", qty: 18.5, opening: 18.5, totalReceived: 0, totalIssued: 0, reorder: 5, unitCost: 620, type: "consumable" },
  { id: "i3", name: "Camphor", malayalam: "കർപ്പൂരം", unit: "kg", qty: 2.4, opening: 2.4, totalReceived: 0, totalIssued: 0, reorder: 0.5, unitCost: 850, type: "consumable" },
  { id: "i4", name: "Kumkum", malayalam: "കുങ്കുമം", unit: "kg", qty: 1.8, opening: 1.8, totalReceived: 0, totalIssued: 0, reorder: 0.3, unitCost: 480, type: "consumable" },
  { id: "i5", name: "Akshatam", malayalam: "അക്ഷതം", unit: "kg", qty: 3.2, opening: 3.2, totalReceived: 0, totalIssued: 0, reorder: 0.5, unitCost: 90, type: "consumable" },
  { id: "i6", name: "Flowers", malayalam: "പുഷ്പം", unit: "kg", qty: 6.5, opening: 6.5, totalReceived: 0, totalIssued: 0, reorder: 2, unitCost: 220, type: "consumable" },
  { id: "i7", name: "Tulasi", malayalam: "തുളസി", unit: "kg", qty: 1.2, opening: 1.2, totalReceived: 0, totalIssued: 0, reorder: 0.3, unitCost: 180, type: "consumable" },
  { id: "i8", name: "Agarbathi", malayalam: "ചന്ദന തിരി", unit: "sticks", qty: 480, opening: 480, totalReceived: 0, totalIssued: 0, reorder: 100, unitCost: 1.5, type: "consumable" },
  { id: "i9", name: "Plantain", malayalam: "നേന്ത്രപ്പഴം", unit: "nos", qty: 36, opening: 36, totalReceived: 0, totalIssued: 0, reorder: 12, unitCost: 12, type: "consumable" },
  { id: "i10", name: "Rice", malayalam: "അരി", unit: "kg", qty: 85, opening: 85, totalReceived: 0, totalIssued: 0, reorder: 20, unitCost: 55, type: "consumable" },
  { id: "i11", name: "Vegetables", malayalam: "പച്ചക്കറി", unit: "kg", qty: 22, opening: 22, totalReceived: 0, totalIssued: 0, reorder: 8, unitCost: 60, type: "consumable" },
];

const CAPITAL_ITEMS = [
  { id: "c1", name: "Thiruvabharanam — Crown", malayalam: "തിരുവാഭരണം", custodian: "Melsanthi", lastVerified: "2026-04-20", condition: "Excellent", material: "Gold", weightGrams: 1850, acquiredYear: 1987, bookValue: 450000, currentValue: 18500000 },
  { id: "c2", name: "Silver Lamp Set (5)", malayalam: "വെള്ളി വിളക്ക്", custodian: "Kazhakam", lastVerified: "2026-04-15", condition: "Good", material: "Silver", weightGrams: 4200, acquiredYear: 2003, bookValue: 85000, currentValue: 480000 },
  { id: "c3", name: "Brass Uruli (large)", malayalam: "ഉരുളി", custodian: "Oottupura", lastVerified: "2026-04-22", condition: "Good", material: "Brass", weightGrams: 12000, acquiredYear: 1995, bookValue: 18000, currentValue: 35000 },
  { id: "c4", name: "Kalasham (silver)", malayalam: "കലശം", custodian: "Melsanthi", lastVerified: "2026-04-20", condition: "Excellent", material: "Silver", weightGrams: 850, acquiredYear: 2010, bookValue: 42000, currentValue: 98000 },
  { id: "c5", name: "Thidambu (deity carrier)", malayalam: "തിടമ്പ്", custodian: "Kazhakam", lastVerified: "2026-04-10", condition: "Good", material: "Wood + Gold leaf", weightGrams: 8500, acquiredYear: 1972, bookValue: 25000, currentValue: 180000 },
];

// Retail items sold at the counter — pre-packaged goods, branded items, souvenirs.
// counterQty = current stock at the counter. counterReorder = level at which counter requests a refill from store.
// MRP = sale price. costPrice = what the store paid (used for margin reporting).
const INITIAL_RETAIL_ITEMS = [
  // Pooja consumables — branded
  { id: "r1", name: "Camphor Packet 50g", malayalam: "കർപ്പൂരം", brand: "Mangalam", category: "Pooja Items", packSize: "50 g", barcode: "8901234567001", mrp: 45, costPrice: 38, counterQty: 60, counterReorder: 15, hsn: "33074100" },
  { id: "r2", name: "Camphor Tablet 100g", malayalam: "കർപ്പൂരം", brand: "Cycle", category: "Pooja Items", packSize: "100 g", barcode: "8901234567002", mrp: 80, costPrice: 68, counterQty: 35, counterReorder: 10, hsn: "33074100" },
  { id: "r3", name: "Sandal Agarbathi", malayalam: "ചന്ദന തിരി", brand: "Cycle Pure", category: "Pooja Items", packSize: "30 sticks", barcode: "8901234567003", mrp: 60, costPrice: 50, counterQty: 80, counterReorder: 20, hsn: "33074100" },
  { id: "r4", name: "Sambrani Cups", malayalam: "സാംബ്രാണി", brand: "Mysore Sandal", category: "Pooja Items", packSize: "12 pcs", barcode: "8901234567004", mrp: 50, costPrice: 42, counterQty: 45, counterReorder: 12, hsn: "33074100" },
  { id: "r5", name: "Rose Agarbathi", malayalam: "ചന്ദന തിരി", brand: "Mangalam", category: "Pooja Items", packSize: "20 sticks", barcode: "8901234567005", mrp: 30, costPrice: 24, counterQty: 70, counterReorder: 20, hsn: "33074100" },
  // Charadu / sacred thread items
  { id: "r6", name: "Charadu (Yellow)", malayalam: "മഞ്ഞ ചരട്", brand: "—", category: "Charadu", packSize: "1 nos", barcode: "", mrp: 10, costPrice: 6, counterQty: 200, counterReorder: 50, hsn: "" },
  { id: "r7", name: "Charadu (Red)", malayalam: "ചുവന്ന ചരട്", brand: "—", category: "Charadu", packSize: "1 nos", barcode: "", mrp: 10, costPrice: 6, counterQty: 180, counterReorder: 50, hsn: "" },
  { id: "r8", name: "Rudraksha Mala", malayalam: "രുദ്രാക്ഷം", brand: "Devi Stores", category: "Charadu", packSize: "108 beads", barcode: "8901234567008", mrp: 250, costPrice: 180, counterQty: 25, counterReorder: 5, hsn: "71179090" },
  // Souvenirs
  { id: "r9", name: "Brass Lamp (Small)", malayalam: "വിളക്ക്", brand: "Kerala Crafts", category: "Souvenirs", packSize: "1 nos", barcode: "8901234567009", mrp: 350, costPrice: 220, counterQty: 12, counterReorder: 3, hsn: "74199100" },
  { id: "r10", name: "Devi Photo Frame (8x10)", malayalam: "ഫോട്ടോ", brand: "Sree Arts", category: "Souvenirs", packSize: "1 nos", barcode: "8901234567010", mrp: 180, costPrice: 110, counterQty: 18, counterReorder: 5, hsn: "44140000" },
  { id: "r11", name: "Sree Yantra (Copper)", malayalam: "ശ്രീ യന്ത്രം", brand: "Vedic Crafts", category: "Souvenirs", packSize: "1 nos", barcode: "8901234567011", mrp: 450, costPrice: 290, counterQty: 8, counterReorder: 2, hsn: "74199900" },
  { id: "r12", name: "Prasadam Box (Med)", malayalam: "പ്രസാദ പെട്ടി", brand: "—", category: "Souvenirs", packSize: "1 nos", barcode: "", mrp: 25, costPrice: 12, counterQty: 100, counterReorder: 25, hsn: "48191010" },
];

const POOJA_SCHEDULE = [
  { time: "04:30", name: "Palli Unarthal", malayalam: "പള്ളിയുണർത്തൽ" },
  { time: "05:00", name: "Nirmalyam", malayalam: "നിർമ്മാല്യം" },
  { time: "05:30", name: "Abhishekam", malayalam: "അഭിഷേകം" },
  { time: "06:30", name: "Usha Pooja", malayalam: "ഉഷ പൂജ" },
  { time: "08:00", name: "Pantheeradi Pooja", malayalam: "പന്തീരടി പൂജ" },
  { time: "11:00", name: "Ucha Pooja", malayalam: "ഉച്ച പൂജ" },
  { time: "17:30", name: "Deeparadhana", malayalam: "ദീപാരാധന" },
  { time: "19:30", name: "Athazha Pooja", malayalam: "അത്താഴ പൂജ" },
  { time: "20:30", name: "Thripuka", malayalam: "തൃപ്പുക" },
];

// Operational areas of the temple — used as requester / destination
const AREAS = [
  "Sreekovil",
  "Namaskara Mandapam",
  "Homakundam",
  "Oottupura",
  "Kazhakam",
  "Prakaram",
  "Office",
  "Auditorium",
];

// Authorized personnel who can verify capital item returns.
// Listed in approximate hierarchy — most senior first.
const VERIFIERS = [
  { role: "Thantri", malayalam: "തന്ത്രി" },
  { role: "Melsanthi", malayalam: "മേൽശാന്തി" },
  { role: "Keezhsanthi", malayalam: "കീഴ്ശാന്തി" },
  { role: "Trustee", malayalam: "ട്രസ്റ്റി" },
  { role: "Secretary", malayalam: "സെക്രട്ടറി" },
  { role: "Store Keeper", malayalam: "സ്റ്റോർ കീപ്പർ" },
  { role: "Asst. Store Keeper", malayalam: "സഹ. സ്റ്റോർ കീപ്പർ" },
  { role: "Office In-charge", malayalam: "ഓഫീസ് ഇൻ-ചാർജ്" },
  { role: "Kazhakam Lead", malayalam: "കഴകം മേലാളൻ" },
];

// 27 nakshatrams in traditional order, with Malayalam names
const NAKSHATRAMS = [
  { name: "Ashwathi",       malayalam: "അശ്വതി" },
  { name: "Bharani",        malayalam: "ഭരണി" },
  { name: "Karthika",       malayalam: "കാർത്തിക" },
  { name: "Rohini",         malayalam: "രോഹിണി" },
  { name: "Makayiram",      malayalam: "മകയിരം" },
  { name: "Thiruvathira",   malayalam: "തിരുവാതിര" },
  { name: "Punartham",      malayalam: "പുണർതം" },
  { name: "Pooyam",         malayalam: "പൂയം" },
  { name: "Ayilyam",        malayalam: "ആയില്യം" },
  { name: "Makam",          malayalam: "മകം" },
  { name: "Pooram",         malayalam: "പൂരം" },
  { name: "Uthram",         malayalam: "ഉത്രം" },
  { name: "Atham",          malayalam: "അത്തം" },
  { name: "Chithira",       malayalam: "ചിത്തിര" },
  { name: "Chothi",         malayalam: "ചോതി" },
  { name: "Vishakham",      malayalam: "വിശാഖം" },
  { name: "Anizham",        malayalam: "അനിഴം" },
  { name: "Thrikketta",     malayalam: "തൃക്കേട്ട" },
  { name: "Moolam",         malayalam: "മൂലം" },
  { name: "Pooradam",       malayalam: "പൂരാടം" },
  { name: "Uthradam",       malayalam: "ഉത്രാടം" },
  { name: "Thiruvonam",     malayalam: "തിരുവോണം" },
  { name: "Avittam",        malayalam: "അവിട്ടം" },
  { name: "Chathayam",      malayalam: "ചതയം" },
  { name: "Pooruruttathi",  malayalam: "പൂരുരുട്ടാതി" },
  { name: "Uthrattathi",    malayalam: "ഉത്രട്ടാതി" },
  { name: "Revathi",        malayalam: "രേവതി" },
];

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
  // cart: [{ vazhipaduId, devoteeName, nakshatram }, ...]
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
          <DailyRoutine
            openLog={openLog} setOpenLog={setOpenLog}
            poojaLog={poojaLog} setPoojaLog={setPoojaLog}
            housekeeping={housekeeping} setHousekeeping={setHousekeeping}
            issuances={issuances}
          />
        )}
        {tab === "inventory" && (
          <Inventory
            inventory={inventory}
            setInventory={setInventory}
            purchaseIndents={purchaseIndents}
            generateReorderIndents={generateReorderIndents}
          />
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
          <Uthsavam events={events} setEvents={setEvents} />
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

// =================== DAILY ROUTINE ===================
function DailyRoutine({ openLog, setOpenLog, poojaLog, setPoojaLog, housekeeping, setHousekeeping, issuances }) {
  const togglePooja = (time) => setPoojaLog((p) => ({ ...p, [time]: p[time] ? null : new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) }));
  const toggleHk = (id) => setHousekeeping((h) => h.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Open/close */}
      <Card title="Temple Opening / Closing" subtitle="നടതുറപ്പ് — നടയടപ്പ്" icon={Sun}>
        <div className="space-y-3">
          <Field label="Opened at" value={openLog.opened} onChange={(v) => setOpenLog({ ...openLog, opened: v })} placeholder="e.g. 04:30" />
          <Field label="Closed at" value={openLog.closed} onChange={(v) => setOpenLog({ ...openLog, closed: v })} placeholder="e.g. 21:00" />
          <Field label="Note" value={openLog.note} onChange={(v) => setOpenLog({ ...openLog, note: v })} placeholder="Any remarks…" />
        </div>
      </Card>

      {/* Pooja timing */}
      <Card title="Pooja Timing Log" subtitle="പൂജാ സമയ രേഖ" icon={Bell}>
        <div className="space-y-1.5 text-sm">
          {POOJA_SCHEDULE.map((p) => (
            <div key={p.time} className="flex items-center justify-between gap-3 py-1.5 border-b border-amber-900/10 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-amber-950">{p.name}</div>
                <div className="text-xs text-amber-800/70" style={{ fontFamily: "'Noto Sans Malayalam', serif" }}>{p.malayalam}</div>
              </div>
              <span className="text-xs text-amber-800/60 tabular-nums">{p.time}</span>
              <button
                onClick={() => togglePooja(p.time)}
                className={`text-xs px-2.5 py-1 border ${
                  poojaLog[p.time] ? "bg-amber-900 text-amber-50 border-amber-900" : "border-amber-900/40 text-amber-900 hover:bg-amber-100"
                }`}
              >
                {poojaLog[p.time] ? `✓ ${poojaLog[p.time]}` : "Log"}
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Housekeeping */}
      <Card title="Housekeeping" subtitle="വൃത്തിയാക്കൽ" icon={Sparkles}>
        <div className="space-y-2">
          {housekeeping.map((h) => (
            <button
              key={h.id}
              onClick={() => toggleHk(h.id)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-amber-50 text-left border border-amber-900/10"
            >
              <div className={`w-5 h-5 border-2 border-amber-900 flex items-center justify-center flex-shrink-0 ${h.done ? "bg-amber-900" : ""}`}>
                {h.done && <Check className="w-3 h-3 text-amber-50" strokeWidth={3} />}
              </div>
              <span className={`flex-1 text-sm ${h.done ? "line-through text-amber-800/40" : "text-amber-950"}`}>{h.task}</span>
              <span className="text-xs text-amber-800/60">{h.area}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Auto-issuance feed */}
      <Card title="Items Issued (Live)" subtitle="നൽകിയ സാധനങ്ങൾ" icon={Package}>
        {issuances.length === 0 ? (
          <p className="text-sm text-amber-800/60 italic">No issuances yet today. When a vazhipadu is booked at the counter, items will be auto-issued and shown here.</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {issuances.slice(0, 20).map((i) => (
              <div key={i.id} className="border-l-2 border-amber-700 pl-3 py-1 text-sm">
                <div className="flex justify-between text-xs text-amber-800/70">
                  <span>{i.billNo} → <strong>{i.area}</strong></span>
                  <span>{new Date(i.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="text-amber-900">
                  {i.items.map(([n, q]) => `${n} (${q})`).join(", ")}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// =================== INVENTORY ===================
function Inventory({ inventory, setInventory, purchaseIndents = [], generateReorderIndents }) {
  const [section, setSection] = useState("register");
  const [restocking, setRestocking] = useState(null); // item being restocked
  const [restockQty, setRestockQty] = useState("");
  const [restockCost, setRestockCost] = useState("");
  const [reorderFeedback, setReorderFeedback] = useState(null);

  // Look up indent state per item — used in the register
  const indentStatusFor = (itemId) => {
    const open = purchaseIndents.find((p) => p.itemId === itemId && p.status === "Open");
    if (open) return { status: "Open", indentNo: open.indentNo, qty: open.qtyNeeded, source: open.source };
    const ordered = purchaseIndents.find((p) => p.itemId === itemId && p.status === "Ordered");
    if (ordered) return { status: "Ordered", indentNo: ordered.indentNo, qty: ordered.qtyNeeded, source: ordered.source, vendor: ordered.vendor };
    return null;
  };

  const handleGenerateReorder = () => {
    if (!generateReorderIndents) return;
    const r = generateReorderIndents();
    setReorderFeedback(r.created > 0
      ? { ok: true, msg: `Created ${r.created} new indent${r.created > 1 ? "s" : ""} for items below reorder level. View them in Store / Purchase Indent.` }
      : { ok: true, msg: "No new indents needed — every below-reorder item already has an Open indent." }
    );
    setTimeout(() => setReorderFeedback(null), 5000);
  };

  const adjustQty = (id, delta) => {
    setInventory((inv) => inv.map((i) => (i.id === id ? { ...i, qty: +(i.qty + delta).toFixed(3) } : i)));
  };

  // Restock with weighted-average cost: new average cost reflects both old and new stock
  const submitRestock = (item) => {
    const q = parseFloat(restockQty);
    const c = parseFloat(restockCost);
    if (isNaN(q) || q <= 0 || isNaN(c) || c < 0) return;

    setInventory((inv) =>
      inv.map((i) => {
        if (i.id !== item.id) return i;
        const oldValue = i.qty * i.unitCost;
        const newValue = q * c;
        const newQty = +(i.qty + q).toFixed(3);
        const newAvgCost = newQty > 0 ? +((oldValue + newValue) / newQty).toFixed(2) : c;
        return {
          ...i,
          qty: newQty,
          unitCost: newAvgCost,
          totalReceived: +((i.totalReceived || 0) + q).toFixed(3),
        };
      })
    );
    setRestocking(null);
    setRestockQty("");
    setRestockCost("");
  };

  // Totals
  const consumableValue = inventory.reduce((s, i) => s + i.qty * i.unitCost, 0);
  const lowStockCount = inventory.filter((i) => i.qty <= i.reorder).length;
  const capitalBookValue = CAPITAL_ITEMS.reduce((s, c) => s + c.bookValue, 0);
  const capitalCurrentValue = CAPITAL_ITEMS.reduce((s, c) => s + c.currentValue, 0);

  const fmt = (n) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

  return (
    <div>
      {/* Valuation header */}
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
          {/* Action bar */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-bold text-amber-950" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Stock Register</h3>
              <p className="text-xs text-amber-800/70 italic">Opening + Received − Issued = Closing. Items at or below reorder level can flow to the Purchase Indent automatically.</p>
            </div>
            <button
              onClick={handleGenerateReorder}
              className="bg-amber-900 hover:bg-amber-950 text-amber-50 px-4 py-2 text-sm flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" /> Generate Indents for Below-Reorder
            </button>
          </div>

          {reorderFeedback && (
            <div className="mb-3 px-3 py-2 text-sm border-l-4 border-amber-700 bg-amber-50 text-amber-900">
              {reorderFeedback.msg}
            </div>
          )}

          {/* CONSUMABLES REGISTER */}
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
                  const opening = i.opening ?? i.qty;
                  const received = i.totalReceived || 0;
                  const issued = i.totalIssued || 0;
                  const closing = i.qty;
                  const isLow = closing <= i.reorder;
                  const isCritical = closing <= i.reorder * 0.5;
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
                      <td className="px-3 py-3 text-right tabular-nums text-amber-800/80">{formatQty(i.reorder, i.unit)}</td>
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
                            <div className="text-[10px] text-amber-700 mt-0.5">
                              {indent.indentNo} · {formatQty(indent.qty, i.unit)}
                              {indent.vendor && <> · {indent.vendor}</>}
                            </div>
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

          {/* CAPITAL REGISTER */}
          <h4 className="text-xs uppercase tracking-wider text-amber-900 font-semibold mb-2 mt-4">Capital Items</h4>
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
                  <th className="text-center px-3 py-3">Condition</th>
                </tr>
              </thead>
              <tbody>
                {CAPITAL_ITEMS.map((c) => {
                  // For capital items, "reorder level" doesn't apply the same way; instead we flag stale audits.
                  const daysSinceVerify = Math.round((Date.now() - new Date(c.lastVerified).getTime()) / 86400000);
                  const auditStale = daysSinceVerify > 90;
                  return (
                    <tr key={c.id} className={`border-t border-amber-900/10 ${auditStale ? "bg-orange-50" : ""}`}>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-amber-950">{c.name}</div>
                        <div className="text-xs text-amber-800/70" style={{ fontFamily: "'Noto Sans Malayalam', serif" }}>{c.malayalam}</div>
                        <div className="text-[10px] text-amber-700/70">Acq. {c.acquiredYear}</div>
                      </td>
                      <td className="px-3 py-3 text-amber-900">{c.material}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-amber-900">{c.weightGrams.toLocaleString("en-IN")} g</td>
                      <td className="px-3 py-3 text-right tabular-nums text-amber-900">{fmt(c.bookValue)}</td>
                      <td className="px-3 py-3 text-right tabular-nums font-bold text-amber-950">{fmt(c.currentValue)}</td>
                      <td className="px-3 py-3 text-amber-900">{c.custodian}</td>
                      <td className="px-3 py-3 text-xs text-amber-800/80 tabular-nums">
                        {c.lastVerified}
                        <div className={`text-[10px] ${auditStale ? "text-orange-700 font-semibold" : "text-amber-700/70"}`}>
                          {daysSinceVerify} days ago{auditStale ? " · audit due" : ""}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs px-2 py-1 bg-amber-100 text-amber-900">{c.condition}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-amber-800/70 italic px-3 py-2 bg-amber-100/30 border-t border-amber-900/10">
              Capital items are flagged for re-verification if last audit is over 90 days old. Periodic physical verification with custodian sign-off is required.
            </p>
          </div>
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
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((i) => {
                const value = i.qty * i.unitCost;
                const low = i.qty <= i.reorder;
                return (
                  <tr key={i.id} className="border-t border-amber-900/10">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-amber-950">{i.name}</div>
                      <div className="text-xs text-amber-800/70" style={{ fontFamily: "'Noto Sans Malayalam', serif" }}>{i.malayalam}</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-amber-950">{formatQty(i.qty, i.unit)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-900">₹{i.unitCost}<span className="text-xs text-amber-800/60">/{i.unit}</span></td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-amber-950">{fmt(value)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-800/70">{i.reorder}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 ${low ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                        {low ? "Low" : "OK"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setRestocking(i); setRestockQty(""); setRestockCost(String(i.unitCost)); }} className="text-xs px-2 py-1 border border-amber-900/40 hover:bg-amber-100">+ Restock</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-amber-100/40 border-t-2 border-amber-900/30">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right text-xs uppercase tracking-wider text-amber-900 font-semibold">Total Inventory Value</td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-amber-950 text-base">{fmt(consumableValue)}</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Restock dialog */}
      {restocking && (
        <div className="fixed inset-0 bg-stone-900/40 flex items-center justify-center z-50 p-4" onClick={() => setRestocking(null)}>
          <div className="bg-amber-50 border-2 border-amber-900/40 max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-amber-950 mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Restock: {restocking.name}
            </h3>
            <p className="text-xs text-amber-800/70 mb-4">
              Current: {restocking.qty} {restocking.unit} at ₹{restocking.unitCost}/{restocking.unit}.
              New cost will be a weighted average of old and new stock.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Quantity Added ({restocking.unit})</label>
                <input autoFocus type="number" step="0.001" value={restockQty} onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm focus:border-amber-900 focus:outline-none" placeholder="e.g. 10" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">Cost per {restocking.unit} (₹)</label>
                <input type="number" step="0.01" value={restockCost} onChange={(e) => setRestockCost(e.target.value)}
                  className="w-full bg-white border border-amber-900/30 px-3 py-2 text-sm focus:border-amber-900 focus:outline-none" placeholder="e.g. 650" />
              </div>
            </div>
            {restockQty && restockCost && !isNaN(parseFloat(restockQty)) && !isNaN(parseFloat(restockCost)) && (
              <div className="bg-amber-100/50 border border-amber-900/20 p-3 mb-4 text-xs text-amber-900 space-y-1">
                <div className="flex justify-between"><span>Purchase value:</span><span className="tabular-nums font-semibold">{fmt(parseFloat(restockQty) * parseFloat(restockCost))}</span></div>
                <div className="flex justify-between"><span>New stock total:</span><span className="tabular-nums font-semibold">{(restocking.qty + parseFloat(restockQty)).toFixed(3)} {restocking.unit}</span></div>
                <div className="flex justify-between"><span>New average cost:</span><span className="tabular-nums font-semibold">₹{(((restocking.qty * restocking.unitCost) + (parseFloat(restockQty) * parseFloat(restockCost))) / (restocking.qty + parseFloat(restockQty))).toFixed(2)}/{restocking.unit}</span></div>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => submitRestock(restocking)} className="flex-1 bg-amber-900 text-amber-50 py-2 text-sm font-semibold">Confirm Restock</button>
              <button onClick={() => setRestocking(null)} className="px-4 py-2 border border-amber-900/40 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {section === "capital" && (
        <div className="bg-amber-50/40 border border-amber-900/15 overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-amber-100/60 text-amber-900 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Item</th>
                <th className="text-left px-4 py-3">Material</th>
                <th className="text-right px-4 py-3">Weight</th>
                <th className="text-right px-4 py-3">Book Value</th>
                <th className="text-right px-4 py-3">Current Value</th>
                <th className="text-left px-4 py-3">Custodian</th>
                <th className="text-left px-4 py-3">Verified</th>
              </tr>
            </thead>
            <tbody>
              {CAPITAL_ITEMS.map((c) => {
                const appreciation = ((c.currentValue - c.bookValue) / c.bookValue) * 100;
                return (
                  <tr key={c.id} className="border-t border-amber-900/10">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-amber-950">{c.name}</div>
                      <div className="text-xs text-amber-800/70" style={{ fontFamily: "'Noto Sans Malayalam', serif" }}>{c.malayalam}</div>
                      <div className="text-[10px] uppercase tracking-wider text-amber-700/70 mt-0.5">Acquired {c.acquiredYear} · {c.condition}</div>
                    </td>
                    <td className="px-4 py-3 text-amber-900">{c.material}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-900">{c.weightGrams.toLocaleString("en-IN")} <span className="text-xs text-amber-800/60">g</span></td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-900">{fmt(c.bookValue)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="tabular-nums font-bold text-amber-950">{fmt(c.currentValue)}</div>
                      <div className={`text-[10px] tabular-nums ${appreciation >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {appreciation >= 0 ? "↑" : "↓"} {Math.abs(appreciation).toFixed(0)}%
                      </div>
                    </td>
                    <td className="px-4 py-3 text-amber-900">{c.custodian}</td>
                    <td className="px-4 py-3 text-amber-800/70 tabular-nums text-xs">{c.lastVerified}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-amber-100/40 border-t-2 border-amber-900/30">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right text-xs uppercase tracking-wider text-amber-900 font-semibold">Capital Asset Totals</td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-amber-950">{fmt(capitalBookValue)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-amber-950 text-base">{fmt(capitalCurrentValue)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
          <p className="text-xs text-amber-800/70 italic px-4 py-3 bg-amber-100/30 border-t border-amber-900/10">
            Current values for gold/silver items reflect today's bullion rates × weight. Update periodically or link to live market rates.
            Physical verification with custodian sign-off required for audit.
          </p>
        </div>
      )}
    </div>
  );
}

// =================== COUNTER (BILLING) ===================
function Counter({ bookVazhipadu, bookings, totalRevenue, retailItems, retailSales, sellRetail, raiseCounterRequisition, receiveCounterStock, kioskOrders = [], payAtKiosk, dispatchKioskOrder, cancelKioskOrder }) {
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

// =================== KIOSK MODE (Devotee self-service) ===================
function KioskMode({ retailItems, payAtKiosk }) {
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
function DispatchQueueBanner({ orders, onDispatch, setLastBill }) {
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
function KioskSlip({ bill, lang, onClose }) {
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

// =================== RETAIL COUNTER ===================
function RetailCounter({ retailItems, retailSales, sellRetail, raiseCounterRequisition, receiveCounterStock }) {
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
function CounterStockView({ retailItems }) {
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
function CounterRefill({ retailItems, lowStockItems, onRaise, onReceive }) {
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
function RetailReceipt({ sale, onClose }) {
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

// =================== PRINTABLE BILL SLIP ===================
function BillSlip({ bill, onClose }) {
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
function numberToWords(n) {
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

function Store({ inventory, requisitions, purchaseIndents, raiseRequisition, issueRequisition, rejectRequisition, returnRequisition, markIndentOrdered, markIndentReceived, cancelIndent }) {
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

function StoreStat({ label, value, sub, accent }) {
  return (
    <div className={`p-4 border ${accent ? "bg-amber-900 text-amber-50 border-amber-900" : "bg-amber-50/40 border-amber-900/20"}`}>
      <div className={`text-xs uppercase tracking-wider ${accent ? "opacity-80" : "text-amber-800/70"}`}>{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${accent ? "" : "text-amber-950"}`}>{value}</div>
      {sub && <div className={`text-xs mt-0.5 ${accent ? "opacity-80" : "text-amber-800/60"}`}>{sub}</div>}
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

// =================== PURCHASE MODULE ===================
function Purchase({ inventory, vendors, quotations, purchaseOrders, grns, bills, purchaseIndents,
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

// =================== UTHSAVAM ===================
function Uthsavam({ events, setEvents }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", date: "", budget: "", raised: "" });

  const addEvent = () => {
    if (!draft.name) return;
    setEvents((e) => [
      ...e,
      {
        id: `e${Date.now()}`,
        name: draft.name,
        date: draft.date,
        budget: parseFloat(draft.budget) || 0,
        raised: parseFloat(draft.raised) || 0,
        status: "Active",
      },
    ]);
    setDraft({ name: "", date: "", budget: "", raised: "" });
    setAdding(false);
  };

  const updateRaised = (id, amt) => {
    setEvents((es) => es.map((e) => (e.id === id ? { ...e, raised: e.raised + amt } : e)));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-2xl font-bold text-amber-950" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Uthsavam & Special Events
          </h2>
          <p className="text-sm text-amber-800/70 italic" style={{ fontFamily: "'Noto Sans Malayalam', serif" }}>ഉത്സവ പരിപാടികൾ</p>
        </div>
        <button onClick={() => setAdding(!adding)} className="bg-amber-900 text-amber-50 px-4 py-2 text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Event
        </button>
      </div>

      {adding && (
        <div className="bg-amber-50 border border-amber-900/20 p-4 mb-5 grid sm:grid-cols-4 gap-3">
          <Field label="Event Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
          <Field label="Date" value={draft.date} onChange={(v) => setDraft({ ...draft, date: v })} placeholder="YYYY-MM-DD" />
          <Field label="Budget (₹)" value={draft.budget} onChange={(v) => setDraft({ ...draft, budget: v })} />
          <div className="flex items-end gap-2">
            <button onClick={addEvent} className="bg-amber-900 text-amber-50 px-4 py-2 text-sm flex-1">Save</button>
            <button onClick={() => setAdding(false)} className="border border-amber-900/40 px-3 py-2 text-sm">×</button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {events.map((e) => {
          const pct = e.budget ? Math.min(100, (e.raised / e.budget) * 100) : 0;
          return (
            <div key={e.id} className="bg-amber-50/40 border border-amber-900/20 p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-xl font-bold text-amber-950" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{e.name}</h3>
                  <div className="text-sm text-amber-800/70">{e.date}</div>
                </div>
                <span className={`text-xs px-2 py-1 ${
                  e.status === "Completed" ? "bg-stone-200 text-stone-800" :
                  e.status === "Active" ? "bg-amber-900 text-amber-50" : "bg-amber-100 text-amber-900"
                }`}>{e.status}</span>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-xs text-amber-800/70 mb-1">
                  <span>Raised: ₹{e.raised.toLocaleString("en-IN")}</span>
                  <span>Goal: ₹{e.budget.toLocaleString("en-IN")}</span>
                </div>
                <div className="h-2 bg-amber-100 overflow-hidden">
                  <div className="h-full bg-amber-900" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-xs text-amber-700 mt-1">{pct.toFixed(0)}% of goal</div>
              </div>

              {e.status === "Active" && (
                <div className="flex gap-2 mt-4">
                  {[1000, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => updateRaised(e.id, amt)}
                      className="flex-1 text-xs border border-amber-900/40 hover:bg-amber-100 py-1.5"
                    >
                      + ₹{amt.toLocaleString("en-IN")}
                    </button>
                  ))}
                </div>
              )}

              {/* Sample program */}
              <div className="mt-4 pt-3 border-t border-amber-900/15">
                <div className="text-xs uppercase tracking-wider text-amber-900 mb-1">Programs</div>
                <ul className="text-xs text-amber-800 space-y-0.5">
                  <li>• Kodiyettam (Flag hoisting)</li>
                  <li>• Special Pooja & Annadanam</li>
                  <li>• Cultural programs</li>
                  <li>• Aarat & Kodikuthu</li>
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =================== DATA ENTRY (Excel templates) ===================
function DataEntry({ allState = {}, loadAllState = () => {}, lastBackupAt = null, setLastBackupAt = () => {} }) {
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

// =================== BACKUP REMINDER BANNER ===================
// Appears at the top of the page when no backup has been made for >24 hours.
// Provides a "Backup Now" button that jumps the user to the Data Entry tab.
function BackupReminder({ lastBackupAt, setTab }) {
  if (!lastBackupAt) {
    // Never backed up — show urgent banner
    return (
      <div className="bg-red-50 border-l-4 border-red-700 px-4 py-3 mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-red-900">No backup yet</div>
            <div className="text-xs text-red-800/90">Your data lives only in this browser. Click "Backup Now" to save a copy to disk.</div>
          </div>
        </div>
        <button
          onClick={() => setTab("data")}
          className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 text-sm font-semibold whitespace-nowrap"
        >
          Backup Now →
        </button>
      </div>
    );
  }

  // How long since last backup?
  const lastDate = new Date(lastBackupAt);
  const now = new Date();
  const ms = now - lastDate;
  const hours = ms / (1000 * 60 * 60);
  const days = Math.floor(hours / 24);

  let timeAgo;
  if (hours < 1) {
    const mins = Math.max(1, Math.floor(ms / (1000 * 60)));
    timeAgo = `${mins} minute${mins === 1 ? "" : "s"} ago`;
  } else if (hours < 24) {
    const h = Math.floor(hours);
    timeAgo = `${h} hour${h === 1 ? "" : "s"} ago`;
  } else {
    timeAgo = `${days} day${days === 1 ? "" : "s"} ago`;
  }

  // Threshold: 24h = warning, 48h = urgent, <24h = nothing
  if (hours < 24) return null; // recent enough, no banner

  const urgent = hours >= 48;
  const colorClasses = urgent
    ? "bg-red-50 border-red-700 text-red-900"
    : "bg-orange-50 border-orange-600 text-orange-900";
  const buttonClasses = urgent
    ? "bg-red-700 hover:bg-red-800 text-white"
    : "bg-orange-600 hover:bg-orange-700 text-white";

  return (
    <div className={`border-l-4 px-4 py-3 mb-4 flex items-center justify-between gap-3 flex-wrap ${colorClasses}`}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-bold">
            Last backup: {timeAgo}{urgent && " — please back up now"}
          </div>
          <div className="text-xs opacity-90">
            Your latest changes only live in this browser. Click "Backup Now" to save a fresh copy.
          </div>
        </div>
      </div>
      <button
        onClick={() => setTab("data")}
        className={`px-4 py-2 text-sm font-semibold whitespace-nowrap ${buttonClasses}`}
      >
        Backup Now →
      </button>
    </div>
  );
}

// =================== UI HELPERS ===================
function Card({ title, subtitle, icon: Icon, children }) {
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

function Field({ label, value, onChange, placeholder }) {
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
function NakshatramField({ label, value, onChange }) {
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
function NakshatramSelect({ value, onChange, placeholder }) {
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
function QtyInput({ qty, baseUnit, onChange }) {
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
function formatQty(qty, baseUnit) {
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
