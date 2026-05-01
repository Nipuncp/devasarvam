import { useMemo } from "react";
import { Sun, Bell, Sparkles, Package, Check } from "lucide-react";
import { useAppMeta } from "../data/useAppMeta.js";
import { usePoojaSchedule } from "../data/usePoojaSchedule.js";

// Daily checklist & log. Three pieces of state, all keyed by today's date in
// `app_meta` so multiple devices share the same checklist for the day, and
// yesterday's state is preserved for audit:
//   daily.YYYY-MM-DD.openLog       { opened, closed, note }
//   daily.YYYY-MM-DD.poojaLog      { [time]: "HH:MM" }
//   daily.YYYY-MM-DD.housekeeping  [{ id, task, area, done }]
//
// `issuances` (the live feed of inventory items issued by counter sales) is
// rendered empty for now — wired up in Phase 3 once VazhipaduCounter migrates.

const DEFAULT_HOUSEKEEPING = [
  { id: "hk1", task: "Sweep prakaram", area: "Prakaram", done: false },
  { id: "hk2", task: "Wash sreekovil floor", area: "Sreekovil", done: false },
  { id: "hk3", task: "Clean lamps", area: "Sreekovil", done: false },
  { id: "hk4", task: "Wash vessels", area: "Oottupura", done: false },
  { id: "hk5", task: "Refill water vessels", area: "Prakaram", done: false },
];

const todayKey = () => new Date().toISOString().slice(0, 10);

export function DailyRoutine() {
  const today = useMemo(todayKey, []);
  const { rows: poojaSchedule } = usePoojaSchedule();

  const openLog = useAppMeta(`daily.${today}.openLog`, {
    opened: "",
    closed: "",
    note: "",
  });
  const poojaLog = useAppMeta(`daily.${today}.poojaLog`, {});
  const housekeeping = useAppMeta(
    `daily.${today}.housekeeping`,
    DEFAULT_HOUSEKEEPING,
  );

  // TODO Phase 3: pull issuances from inventory_movements once VazhipaduCounter is wired.
  const issuances = [];

  const togglePooja = (time) => {
    const next = { ...(poojaLog.value ?? {}) };
    if (next[time]) delete next[time];
    else
      next[time] = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    poojaLog.setValue(next);
  };

  const toggleHk = (id) => {
    const list = housekeeping.value ?? DEFAULT_HOUSEKEEPING;
    housekeeping.setValue(
      list.map((x) => (x.id === id ? { ...x, done: !x.done } : x)),
    );
  };

  const setOpenField = (key, val) =>
    openLog.setValue({ ...(openLog.value ?? {}), [key]: val });

  if (openLog.loading || poojaLog.loading || housekeeping.loading) {
    return <div className="text-sm text-amber-700">Loading…</div>;
  }

  const open = openLog.value ?? { opened: "", closed: "", note: "" };
  const pLog = poojaLog.value ?? {};
  const hk = housekeeping.value ?? DEFAULT_HOUSEKEEPING;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card title="Temple Opening / Closing" subtitle="നടതുറപ്പ് — നടയടപ്പ്" icon={Sun}>
        <div className="space-y-3">
          <Field
            label="Opened at"
            value={open.opened}
            onChange={(v) => setOpenField("opened", v)}
            placeholder="e.g. 04:30"
          />
          <Field
            label="Closed at"
            value={open.closed}
            onChange={(v) => setOpenField("closed", v)}
            placeholder="e.g. 21:00"
          />
          <Field
            label="Note"
            value={open.note}
            onChange={(v) => setOpenField("note", v)}
            placeholder="Any remarks…"
          />
        </div>
      </Card>

      <Card title="Pooja Timing Log" subtitle="പൂജാ സമയ രേഖ" icon={Bell}>
        <div className="space-y-1.5 text-sm">
          {poojaSchedule.map((p) => (
            <div
              key={p.time}
              className="flex items-center justify-between gap-3 py-1.5 border-b border-amber-900/10 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-amber-950">{p.name}</div>
                <div
                  className="text-xs text-amber-800/70"
                  style={{ fontFamily: "'Noto Sans Malayalam', serif" }}
                >
                  {p.malayalam}
                </div>
              </div>
              <span className="text-xs text-amber-800/60 tabular-nums">{p.time}</span>
              <button
                onClick={() => togglePooja(p.time)}
                className={`text-xs px-2.5 py-1 border ${
                  pLog[p.time]
                    ? "bg-amber-900 text-amber-50 border-amber-900"
                    : "border-amber-900/40 text-amber-900 hover:bg-amber-100"
                }`}
              >
                {pLog[p.time] ? `✓ ${pLog[p.time]}` : "Log"}
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Housekeeping" subtitle="വൃത്തിയാക്കൽ" icon={Sparkles}>
        <div className="space-y-2">
          {hk.map((h) => (
            <button
              key={h.id}
              onClick={() => toggleHk(h.id)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-amber-50 text-left border border-amber-900/10"
            >
              <div
                className={`w-5 h-5 border-2 border-amber-900 flex items-center justify-center flex-shrink-0 ${
                  h.done ? "bg-amber-900" : ""
                }`}
              >
                {h.done && <Check className="w-3 h-3 text-amber-50" strokeWidth={3} />}
              </div>
              <span
                className={`flex-1 text-sm ${
                  h.done ? "line-through text-amber-800/40" : "text-amber-950"
                }`}
              >
                {h.task}
              </span>
              <span className="text-xs text-amber-800/60">{h.area}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Items Issued (Live)" subtitle="നൽകിയ സാധനങ്ങൾ" icon={Package}>
        {issuances.length === 0 ? (
          <p className="text-sm text-amber-800/60 italic">
            No issuances yet today. When a vazhipadu is booked at the counter,
            items will be auto-issued and shown here.
          </p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {/* TODO Phase 3: render from inventory_movements */}
          </div>
        )}
      </Card>
    </div>
  );
}

// Local copies of the prototype's tiny UI helpers. Will get hoisted into
// `src/components/ui/` once the rest of `App.jsx` is split.
function Card({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="bg-amber-50/40 border border-amber-900/20 p-5">
      <div className="flex items-start gap-3 mb-4 pb-3 border-b border-amber-900/15">
        {Icon && (
          <div className="bg-amber-900 text-amber-50 p-2">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div>
          <h3
            className="text-lg font-bold text-amber-950"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {title}
          </h3>
          {subtitle && (
            <div
              className="text-xs text-amber-800/70 italic"
              style={{ fontFamily: "'Noto Sans Malayalam', serif" }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-amber-900 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/60 border border-amber-900/30 focus:border-amber-900 focus:outline-none px-3 py-2 text-sm"
      />
    </div>
  );
}
