import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

export function usePurchaseOrders() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("purchase_orders")
      .select("*, purchase_order_items(*)")
      .order("created_at", { ascending: false });
    if (error) setError(error);
    else { setRows(data ?? []); setError(null); }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const ch = supabase.channel("purchase_orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "purchase_orders" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "purchase_order_items" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refresh]);

  const create = useCallback(async ({ items, ...po }) => {
    const { data, error } = await supabase.from("purchase_orders").insert(po).select("id").single();
    if (error) throw error;
    if (items?.length) {
      const { error: ie } = await supabase.from("purchase_order_items").insert(
        items.map((it) => ({ ...it, po_id: data.id })),
      );
      if (ie) throw ie;
    }
    return data.id;
  }, []);

  const updateStatus = useCallback(async (id, status) => {
    const patch = { status };
    if (status === "sent") patch.sent_at = new Date().toISOString();
    if (status === "closed") patch.closed_at = new Date().toISOString();
    const { error } = await supabase.from("purchase_orders").update(patch).eq("id", id);
    if (error) throw error;
  }, []);

  return { rows, loading, error, refresh, create, updateStatus };
}
