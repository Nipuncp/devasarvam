import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

// Build a read-only hook for a single Supabase table.
// All hooks return the same shape: { rows, loading, error, refresh }.
//
// Usage:
//   export const useFooBar = createTableHook("foo_bar", { orderBy: "name" });
//
// Phase 4: this implementation gets swapped to read from IndexedDB; the
// public hook shape is preserved.
export function createTableHook(table, { orderBy, ascending = true, select = "*" } = {}) {
  return function useTable() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refresh = useCallback(async () => {
      let q = supabase.from(table).select(select);
      if (orderBy) q = q.order(orderBy, { ascending });
      const { data, error } = await q;
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
        .channel(`${table}-changes`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          () => refresh(),
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }, [refresh]);

    return { rows, loading, error, refresh };
  };
}
