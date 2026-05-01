import { useAuth } from "../lib/auth.jsx";
import { useVazhipaduCatalog } from "../data/useVazhipaduCatalog.js";

// Phase 3 smoke test — proves the live Supabase round-trip works end to end.
// Once we're confident, this gets replaced by the real shell + module router.

export function SmokeTest({ onContinueToPrototype }) {
  const { session, profile, signOut } = useAuth();
  const { rows, loading, error } = useVazhipaduCatalog();

  return (
    <div className="min-h-screen bg-amber-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-baseline justify-between border-b border-amber-900/20 pb-4">
          <div>
            <h1
              className="text-3xl text-amber-950"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Devasarvam — Phase 3 smoke test
            </h1>
            <div className="text-xs text-amber-800/70">
              Confirms the React app talks to Supabase under your role.
            </div>
          </div>
          <button
            onClick={signOut}
            className="text-xs text-amber-900 underline hover:text-amber-950"
          >
            Sign out
          </button>
        </header>

        <section className="bg-white border border-amber-900/20 p-5 space-y-2">
          <h2 className="font-semibold text-amber-950">Session</h2>
          <div className="text-sm grid grid-cols-[120px_1fr] gap-y-1">
            <div className="text-amber-900/70">Email</div>
            <div className="font-mono">{session?.user?.email ?? "—"}</div>
            <div className="text-amber-900/70">Role</div>
            <div>
              {profile?.role ? (
                <span className="bg-amber-900 text-amber-50 px-2 py-0.5 text-xs">
                  {profile.role}
                </span>
              ) : (
                <span className="text-amber-700">loading…</span>
              )}
            </div>
            <div className="text-amber-900/70">User ID</div>
            <div className="font-mono text-xs text-amber-800/70 break-all">
              {session?.user?.id}
            </div>
          </div>
        </section>

        <section className="bg-white border border-amber-900/20 p-5 space-y-2">
          <h2 className="font-semibold text-amber-950">
            vazhipadu_catalog (live from Supabase)
          </h2>
          {loading && <div className="text-sm text-amber-700">Loading…</div>}
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2">
              {error.message}
            </div>
          )}
          {!loading && !error && (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-amber-900/70 text-left">
                <tr>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Malayalam</th>
                  <th className="py-2 pr-4 text-right">Price</th>
                  <th className="py-2 pr-4">Area</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-amber-900/10">
                    <td className="py-1.5 pr-4">{r.name}</td>
                    <td
                      className="py-1.5 pr-4"
                      style={{ fontFamily: "'Noto Sans Malayalam', serif" }}
                    >
                      {r.malayalam}
                    </td>
                    <td className="py-1.5 pr-4 text-right tabular-nums">
                      ₹{r.price}
                    </td>
                    <td className="py-1.5 pr-4 text-amber-800/80">{r.area}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-3 text-amber-700 italic">
                      No rows. RLS may be blocking your role, or seed didn't load.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>

        <section className="bg-white border border-amber-900/20 p-5">
          <h2 className="font-semibold text-amber-950 mb-2">Continue to prototype</h2>
          <p className="text-sm text-amber-800/80 mb-3">
            The legacy prototype (~7,300 lines, still uses localStorage + seed JSON)
            is still rendered when you click below. Phase 3's bulk module rewrite
            replaces it tab-by-tab.
          </p>
          <button
            onClick={onContinueToPrototype}
            className="bg-amber-900 text-amber-50 px-4 py-2 text-sm font-semibold"
          >
            Open prototype →
          </button>
        </section>
      </div>
    </div>
  );
}
