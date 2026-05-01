import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

// Read + write hook for `uthsavam_events`. Returns:
//   { rows, loading, error, refresh, addEvent, updateEvent, deleteEvent }
// Mutation methods throw on error so the caller can decide how to surface it.
//
// Phase 4 will route writes through the offline outbox; the public API stays.
export function useUthsavamEvents() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("uthsavam_events")
      .select("*")
      .order("event_date", { ascending: false });
    if (error) setError(error);
    else {
      setRows(data ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("uthsavam_events-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "uthsavam_events" },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const addEvent = useCallback(async (input) => {
    const { error } = await supabase.from("uthsavam_events").insert(input);
    if (error) throw error;
  }, []);

  const updateEvent = useCallback(async (id, patch) => {
    const { error } = await supabase
      .from("uthsavam_events")
      .update(patch)
      .eq("id", id);
    if (error) throw error;
  }, []);

  const deleteEvent = useCallback(async (id) => {
    const { error } = await supabase.from("uthsavam_events").delete().eq("id", id);
    if (error) throw error;
  }, []);

  return { rows, loading, error, refresh, addEvent, updateEvent, deleteEvent };
}
