import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

export function usePurchaseIndents() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("purchase_indents")
      .select("*, purchase_indent_items(*)")
      .order("raised_at", { ascending: false });
    if (error) setError(error);
    else { setRows(data ?? []); setError(null); }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const ch = supabase
      .channel("purchase_indents-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "purchase_indents" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "purchase_indent_items" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refresh]);

  const raise = useCallback(async ({ items, ...indent }) => {
    const { data, error } = await supabase.from("purchase_indents").insert(indent).select("id").single();
    if (error) throw error;
    if (items?.length) {
      const { error: ie } = await supabase.from("purchase_indent_items").insert(
        items.map((it) => ({ ...it, indent_id: data.id })),
      );
      if (ie) throw ie;
    }
    return data.id;
  }, []);

  const markOrdered = useCallback(async (id, { vendor_id, ordered_po_no }) => {
    const { error } = await supabase.from("purchase_indents").update({
      status: "ordered",
      ordered_at: new Date().toISOString(),
      vendor_id, ordered_po_no,
    }).eq("id", id);
    if (error) throw error;
  }, []);

  const markReceived = useCallback(async (id, items) => {
    // items: [{ id, qty_received, unit_cost }]
    for (const it of items ?? []) {
      const { error } = await supabase.from("purchase_indent_items").update({
        qty_received: it.qty_received,
        unit_cost: it.unit_cost,
      }).eq("id", it.id);
      if (error) throw error;
    }
    const { error } = await supabase.from("purchase_indents").update({
      status: "received",
      received_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) throw error;
  }, []);

  const cancel = useCallback(async (id) => {
    const { error } = await supabase.from("purchase_indents").update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) throw error;
  }, []);

  return { rows, loading, error, refresh, raise, markOrdered, markReceived, cancel };
}
