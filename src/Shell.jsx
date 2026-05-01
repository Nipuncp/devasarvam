import { useState } from "react";
import { useAuth } from "./lib/auth.jsx";
import { Login } from "./components/Login.jsx";
import { SmokeTest } from "./components/SmokeTest.jsx";
import App from "./App.jsx";

// Top-level routing for Phase 3.
// - signed out → Login
// - signed in → SmokeTest (default), with an opt-in to the legacy prototype.
// In Phase 3 the SmokeTest gets replaced by the real module router and App.jsx
// gets dismantled into src/modules/*.jsx.

export function Shell() {
  const { session } = useAuth();
  const [showPrototype, setShowPrototype] = useState(false);

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50 text-amber-800/70">
        Loading…
      </div>
    );
  }
  if (!session) return <Login />;
  if (showPrototype) return <App />;
  return <SmokeTest onContinueToPrototype={() => setShowPrototype(true)} />;
}
