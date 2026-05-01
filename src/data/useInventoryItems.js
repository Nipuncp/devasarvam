import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

export function useInventoryItems() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("inventory_items")
      .select("*")
      .order("name");
    if (error) setError(error);
    else { setRows(data ?? []); setError(null); }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("inventory_items-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_items" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  const addItem = useCallback(async (input) => {
    const { error } = await supabase.from("inventory_items").insert(input);
    if (error) throw error;
  }, []);

  const updateItem = useCallback(async (id, patch) => {
    const { error } = await supabase.from("inventory_items").update(patch).eq("id", id);
    if (error) throw error;
  }, []);

  const deleteItem = useCallback(async (id) => {
    const { error } = await supabase.from("inventory_items").delete().eq("id", id);
    if (error) throw error;
  }, []);

  // Adjust qty AND log a movement in one shot. Caller picks `reason`.
  // (Phase 4 makes qty derived from movements; this dual-write goes away then.)
  const adjustQty = useCallback(async (id, delta, reason = "adjustment", extras = {}) => {
    const item = rows.find((r) => r.id === id);
    if (!item) throw new Error(`unknown item ${id}`);
    const next = Number(item.qty || 0) + Number(delta);
    const totalReceivedDelta = delta > 0 ? delta : 0;
    const totalIssuedDelta = delta < 0 ? -delta : 0;
    const { error: u } = await supabase.from("inventory_items").update({
      qty: next,
      total_received: Number(item.total_received || 0) + totalReceivedDelta,
      total_issued: Number(item.total_issued || 0) + totalIssuedDelta,
    }).eq("id", id);
    if (u) throw u;
    const { error: m } = await supabase.from("inventory_movements").insert({
      item_id: id,
      delta,
      reason,
      source_type: extras.sourceType ?? null,
      source_id: extras.sourceId ?? null,
      notes: extras.notes ?? null,
    });
    if (m) throw m;
  }, [rows]);

  return { rows, loading, error, refresh, addItem, updateItem, deleteItem, adjustQty };
}
