import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

export function useGRNs() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("grns").select("*, grn_items(*)").order("received_at", { ascending: false });
    if (error) setError(error);
    else { setRows(data ?? []); setError(null); }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const ch = supabase.channel("grns-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "grns" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "grn_items" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refresh]);

  const create = useCallback(async ({ items, ...grn }) => {
    const { data, error } = await supabase.from("grns").insert(grn).select("id").single();
    if (error) throw error;
    if (items?.length) {
      const { error: ie } = await supabase.from("grn_items").insert(
        items.map((it) => ({ ...it, grn_id: data.id })),
      );
      if (ie) throw ie;
    }
    return data.id;
  }, []);

  return { rows, loading, error, refresh, create };
}
