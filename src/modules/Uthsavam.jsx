import { useState } from "react";
import { Plus } from "lucide-react";
import { useUthsavamEvents } from "../data/useUthsavamEvents.js";
import { useRole } from "../lib/auth.jsx";

// Reference module for Phase 3: the smallest tab, self-contained.
// Reads + writes via Supabase; no localStorage. RLS enforces that only
// melsanthi/admin can mutate.

const STATUS_BADGE = {
  Completed: "bg-stone-200 text-stone-800",
  Active: "bg-amber-900 text-amber-50",
  Cancelled: "bg-red-100 text-red-800",
};

export function Uthsavam() {
  const { rows, loading, error, addEvent, updateEvent } = useUthsavamEvents();
  const role = useRole();
  const canEdit = role === "admin" || role === "melsanthi";

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", event_date: "", budget: "" });
  const [busy, setBusy] = useState(false);

  const onAdd = async () => {
    if (!draft.name) return;
    setBusy(true);
    try {
      await addEvent({
        name: draft.name,
        event_date: draft.event_date || null,
        budget: parseFloat(draft.budget) || 0,
        raised: 0,
        status: "Active",
      });
      setDraft({ name: "", event_date: "", budget: "" });
      setAdding(false);
    } finally {
      setBusy(false);
    }
  };

  const bumpRaised = (e, amt) =>
    updateEvent(e.id, { raised: Number(e.raised || 0) + amt });

  if (loading) return <div className="text-sm text-amber-700">Loading…</div>;
  if (error)
    return (
      <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2">
        {error.message}
      </div>
    );

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2
            className="text-2xl font-bold text-amber-950"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Uthsavam &amp; Special Events
          </h2>
          <p
            className="text-sm text-amber-800/70 italic"
            style={{ fontFamily: "'Noto Sans Malayalam', serif" }}
          >
            ഉത്സവ പരിപാടികൾ
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setAdding(!adding)}
            className="bg-amber-900 text-amber-50 px-4 py-2 text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Event
          </button>
        )}
      </div>

      {adding && canEdit && (
        <div className="bg-amber-50 border border-amber-900/20 p-4 mb-5 grid sm:grid-cols-4 gap-3">
          <Field
            label="Event Name"
            value={draft.name}
            onChange={(v) => setDraft({ ...draft, name: v })}
          />
          <Field
            label="Date"
            value={draft.event_date}
            onChange={(v) => setDraft({ ...draft, event_date: v })}
            placeholder="YYYY-MM-DD"
          />
          <Field
            label="Budget (₹)"
            value={draft.budget}
            onChange={(v) => setDraft({ ...draft, budget: v })}
          />
          <div className="flex items-end gap-2">
            <button
              onClick={onAdd}
              disabled={busy}
              className="bg-amber-900 text-amber-50 px-4 py-2 text-sm flex-1 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setAdding(false)}
              className="border border-amber-900/40 px-3 py-2 text-sm"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {rows.map((e) => {
          const raised = Number(e.raised || 0);
          const budget = Number(e.budget || 0);
          const pct = budget ? Math.min(100, (raised / budget) * 100) : 0;
          return (
            <div
              key={e.id}
              className="bg-amber-50/40 border border-amber-900/20 p-5"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3
                    className="text-xl font-bold text-amber-950"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {e.name}
                  </h3>
                  <div className="text-sm text-amber-800/70">{e.event_date}</div>
                </div>
                <span
                  className={`text-xs px-2 py-1 ${
                    STATUS_BADGE[e.status] ?? "bg-amber-100 text-amber-900"
                  }`}
                >
                  {e.status}
                </span>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-xs text-amber-800/70 mb-1">
                  <span>Raised: ₹{raised.toLocaleString("en-IN")}</span>
                  <span>Goal: ₹{budget.toLocaleString("en-IN")}</span>
                </div>
                <div className="h-2 bg-amber-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-900"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-xs text-amber-700 mt-1">
                  {pct.toFixed(0)}% of goal
                </div>
              </div>

              {e.status === "Active" && canEdit && (
                <div className="flex gap-2 mt-4">
                  {[1000, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => bumpRaised(e, amt)}
                      className="flex-1 text-xs border border-amber-900/40 hover:bg-amber-100 py-1.5"
                    >
                      + ₹{amt.toLocaleString("en-IN")}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="text-amber-700 italic col-span-2">
            No events yet. {canEdit ? "Click 'New Event' to add one." : ""}
          </div>
        )}
      </div>
    </div>
  );
}

// Tiny labeled input duplicated from App.jsx's UI helpers so this module is
// self-contained. Once the rest of App.jsx is split, the shared one moves to
// src/components/ui/.
function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/60 border border-amber-900/30 focus:border-amber-900 focus:outline-none px-3 py-2 text-sm"
      />
    </div>
  );
}
