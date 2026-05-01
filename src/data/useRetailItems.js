import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

export function useRetailItems() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("retail_items")
      .select("*")
      .order("name");
    if (error) setError(error);
    else { setRows(data ?? []); setError(null); }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("retail_items-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "retail_items" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  const addItem = useCallback(async (input) => {
    const { error } = await supabase.from("retail_items").insert(input);
    if (error) throw error;
  }, []);

  const updateItem = useCallback(async (id, patch) => {
    const { error } = await supabase.from("retail_items").update(patch).eq("id", id);
    if (error) throw error;
  }, []);

  // Decrement counter_qty by `qty` (e.g. on retail sale).
  const decrementStock = useCallback(async (id, qty) => {
    const item = rows.find((r) => r.id === id);
    if (!item) throw new Error(`unknown retail item ${id}`);
    const next = Number(item.counter_qty || 0) - Number(qty);
    const { error } = await supabase.from("retail_items").update({ counter_qty: next }).eq("id", id);
    if (error) throw error;
  }, [rows]);

  return { rows, loading, error, refresh, addItem, updateItem, decrementStock };
}
