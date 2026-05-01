import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

// Daily log entries — open log, pooja log, housekeeping notes.
// Filterable by date; defaults to today if no `date` arg.
//
// kind: 'open' | 'pooja' | 'housekeeping' | 'note'
// payload: jsonb — shape depends on kind, defined by the writing module.
export function useDailyLog({ date } = {}) {
  const targetDate = date ?? new Date().toISOString().slice(0, 10);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("daily_log_entries")
      .select("*")
      .eq("log_date", targetDate)
      .order("created_at", { ascending: true });
    if (error) setError(error);
    else {
      setRows(data ?? []);
      setError(null);
    }
    setLoading(false);
  }, [targetDate]);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel(`daily_log_entries-${targetDate}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_log_entries",
          filter: `log_date=eq.${targetDate}`,
        },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh, targetDate]);

  const addEntry = useCallback(
    async ({ kind, payload }) => {
      const { error } = await supabase.from("daily_log_entries").insert({
        log_date: targetDate,
        kind,
        payload,
      });
      if (error) throw error;
    },
    [targetDate],
  );

  return { rows, loading, error, refresh, addEntry };
}
