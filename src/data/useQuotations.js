import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

export function useQuotations() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("quotations").select("*, quotation_items(*)").order("created_at", { ascending: false });
    if (error) setError(error);
    else { setRows(data ?? []); setError(null); }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const ch = supabase.channel("quotations-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "quotations" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "quotation_items" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refresh]);

  const create = useCallback(async ({ items, ...q }) => {
    const { data, error } = await supabase.from("quotations").insert(q).select("id").single();
    if (error) throw error;
    if (items?.length) {
      const { error: ie } = await supabase.from("quotation_items").insert(
        items.map((it) => ({ ...it, quotation_id: data.id })),
      );
      if (ie) throw ie;
    }
    return data.id;
  }, []);

  return { rows, loading, error, refresh, create };
}
