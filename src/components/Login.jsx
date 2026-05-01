import { useState } from "react";
import { supabase } from "../lib/supabase.js";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white border border-amber-900/20 p-8 space-y-4"
      >
        <h1
          className="text-3xl text-center text-amber-950"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Devasarvam
        </h1>
        <div className="text-xs text-center text-amber-800/70 italic -mt-3">
          Nelliakattu Oushadheeswari Temple
        </div>

        <div className="space-y-1">
          <label className="block text-xs uppercase tracking-wider text-amber-900">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-amber-50/60 border border-amber-900/30 focus:border-amber-900 focus:outline-none px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs uppercase tracking-wider text-amber-900">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-amber-50/60 border border-amber-900/30 focus:border-amber-900 focus:outline-none px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-amber-900 text-amber-50 px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
