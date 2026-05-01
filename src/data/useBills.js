import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

// Today's bills + create-bill orchestration. createBill() inserts the bill,
// its line items, decrements retail counter_qty for retail lines, and writes
// inventory_movements for vazhipadu ingredient consumption.
export function useBills({ date } = {}) {
  const dayStart = date
    ? `${date}T00:00:00Z`
    : new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z").toISOString();
  const dayEnd = new Date(new Date(dayStart).getTime() + 86400000).toISOString();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("bills")
      .select("*, bill_items(*)")
      .gte("created_at", dayStart)
      .lt("created_at", dayEnd)
      .order("created_at", { ascending: false });
    if (error) setError(error);
    else { setRows(data ?? []); setError(null); }
    setLoading(false);
  }, [dayStart, dayEnd]);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("bills-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "bills" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "bill_items" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  // input: { id (uuid), bill_no?, bill_type, devotee_name, devotee_phone,
  //          devotee_nakshatram, total_amount, lines: [{ item_kind, item_id,
  //          item_name, qty, unit_price, line_total, devotee_name?, nakshatram?,
  //          ingredients?: [[name, qty]] }] }
  const createBill = useCallback(async (input) => {
    const { lines, ...bill } = input;
    const { error: be } = await supabase.from("bills").insert(bill);
    if (be) throw be;

    const itemRows = (lines ?? []).map((l, i) => ({
      bill_id: bill.id,
      line_no: i + 1,
      item_kind: l.item_kind,
      item_id: l.item_id,
      item_name: l.item_name,
      qty: l.qty,
      unit_price: l.unit_price,
      line_total: l.line_total,
      devotee_name: l.devotee_name ?? null,
      nakshatram: l.nakshatram ?? null,
    }));
    if (itemRows.length) {
      const { error: ie } = await supabase.from("bill_items").insert(itemRows);
      if (ie) throw ie;
    }

    // Best-effort movements + counter decrements.
    // Failures here don't undo the bill — the bill is the source of truth and
    // these are derived state. Phase 4 makes them transactional via an RPC.
    for (const l of lines ?? []) {
      if (l.item_kind === "retail") {
        try {
          const { data: r } = await supabase.from("retail_items").select("counter_qty").eq("id", l.item_id).single();
          if (r) {
            await supabase.from("retail_items")
              .update({ counter_qty: Number(r.counter_qty || 0) - Number(l.qty) })
              .eq("id", l.item_id);
          }
        } catch { /* ignore */ }
      } else if (l.item_kind === "vazhipadu" && Array.isArray(l.ingredients)) {
        for (const [name, qty] of l.ingredients) {
          try {
            const { data: inv } = await supabase
              .from("inventory_items").select("id, qty, total_issued").eq("name", name).maybeSingle();
            if (!inv) continue;
            await supabase.from("inventory_items").update({
              qty: Number(inv.qty || 0) - Number(qty),
              total_issued: Number(inv.total_issued || 0) + Number(qty),
            }).eq("id", inv.id);
            await supabase.from("inventory_movements").insert({
              item_id: inv.id,
              delta: -Number(qty),
              reason: "requisition",
              source_type: "bill",
              source_id: bill.id,
              notes: `Vazhipadu: ${l.item_name}`,
            });
          } catch { /* ignore */ }
        }
      }
    }
  }, []);

  return { rows, loading, error, refresh, createBill };
}
