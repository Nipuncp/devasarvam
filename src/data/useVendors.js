import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

export function useVendors() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.from("vendors").select("*").order("name");
    if (error) setError(error);
    else { setRows(data ?? []); setError(null); }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("vendors-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "vendors" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  const addVendor = useCallback(async (input) => {
    const { error } = await supabase.from("vendors").insert(input);
    if (error) throw error;
  }, []);

  const updateVendor = useCallback(async (id, patch) => {
    const { error } = await supabase.from("vendors").update(patch).eq("id", id);
    if (error) throw error;
  }, []);

  return { rows, loading, error, refresh, addVendor, updateVendor };
}
