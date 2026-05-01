import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

export function useRequisitions() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("requisitions")
      .select("*, requisition_items(*)")
      .order("raised_at", { ascending: false });
    if (error) setError(error);
    else { setRows(data ?? []); setError(null); }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const ch = supabase
      .channel("requisitions-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "requisitions" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "requisition_items" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refresh]);

  // input: { req_no, requester_area, reason, required_by, items: [{ item_id, item_name, qty_requested }] }
  const raise = useCallback(async (input) => {
    const { items, ...req } = input;
    const { data, error } = await supabase.from("requisitions").insert(req).select("id").single();
    if (error) throw error;
    if (items?.length) {
      const { error: ie } = await supabase.from("requisition_items").insert(
        items.map((it) => ({ ...it, requisition_id: data.id })),
      );
      if (ie) throw ie;
    }
    return data.id;
  }, []);

  const issue = useCallback(async (id, items) => {
    // items: [{ id, qty_issued }]
    for (const it of items ?? []) {
      const { error } = await supabase.from("requisition_items")
        .update({ qty_issued: it.qty_issued }).eq("id", it.id);
      if (error) throw error;
    }
    const { error } = await supabase.from("requisitions")
      .update({ status: "issued", issued_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
  }, []);

  const reject = useCallback(async (id, reason) => {
    const { error } = await supabase.from("requisitions").update({
      status: "rejected", rejected_at: new Date().toISOString(), rejection_reason: reason,
    }).eq("id", id);
    if (error) throw error;
  }, []);

  const markReturned = useCallback(async (id) => {
    const { error } = await supabase.from("requisitions").update({
      status: "returned", returned_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) throw error;
  }, []);

  return { rows, loading, error, refresh, raise, issue, reject, markReturned };
}
