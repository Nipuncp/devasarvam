import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

// Read/write a single JSON blob keyed by `key` from the `app_meta` table.
// Replaces the prototype's `localStorage` reads for non-tabular state like
// `openLog`, `poojaLog`, last-backup-timestamp, etc.
//
// Returns:
//   { value, loading, error, setValue }
// `setValue(next)` upserts and returns the saved value. The realtime
// subscription keeps `value` fresh across devices.
export function useAppMeta(key, initial = null) {
  const [value, setValue] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("app_meta")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) setError(error);
    else {
      setValue(data?.value ?? initial);
      setError(null);
    }
    setLoading(false);
  }, [key, initial]);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel(`app_meta-${key}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_meta", filter: `key=eq.${key}` },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh, key]);

  const persist = useCallback(
    async (next) => {
      setValue(next); // optimistic
      const { error } = await supabase
        .from("app_meta")
        .upsert({ key, value: next }, { onConflict: "key" });
      if (error) throw error;
      return next;
    },
    [key],
  );

  return { value, loading, error, setValue: persist };
}
