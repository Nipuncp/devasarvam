# src/data/

React hooks that wrap Supabase queries. One hook per logical resource. Modules consume these — they don't talk to Supabase directly.

## Pattern (canonical: `useVazhipaduCatalog.js`)

```js
export function useFooBar() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRows = async () => { /* supabase.from(...).select() */ };

  useEffect(() => {
    fetchRows();
    const channel = supabase.channel(`foo_bar-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'foo_bar' },
          () => fetchRows())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  return { rows, loading, error, refresh: fetchRows };
}
```

Every hook returns the same shape: `{ rows, loading, error, refresh }`. Mutation hooks add typed action methods (`addFooBar`, `updateFooBar`, ...) — write results stream back via the realtime subscription, no need to manually update local state on success.

## When to write a new hook

When a module needs data from a new table/view — write the hook in this directory, not inline. One file per resource. Hooks may call other hooks (composition) but should not import module components.

## Phase 4 plan

These hooks become the public read API for the IndexedDB-backed local mirror. The implementation behind them swaps from "live Supabase query + realtime" to "IndexedDB read + sync engine in background." Consumer modules don't notice the change.
