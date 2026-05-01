import { useCallback } from "react";
import { supabase } from "../lib/supabase.js";

// Append-only ledger writer. Records a stock movement for an inventory item.
// `delta`: positive = received, negative = issued.
// `reason`: 'opening' | 'purchase' | 'requisition' | 'adjustment'
// `sourceType` / `sourceId`: optional link back to the originating row
//   (e.g. requisition.id).
//
// Phase 4 makes inventory_items.qty a view over these rows; Phase 1 keeps
// `qty` as a stored column updated separately. Until then, recording a
// movement is informational — the caller still has to update qty.
export function useInventoryMovements() {
  const record = useCallback(
    async ({ itemId, delta, reason, sourceType = null, sourceId = null, notes = null }) => {
      const { error } = await supabase.from("inventory_movements").insert({
        item_id: itemId,
        delta,
        reason,
        source_type: sourceType,
        source_id: sourceId,
        notes,
      });
      if (error) throw error;
    },
    [],
  );

  return { record };
}
