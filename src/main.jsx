import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./lib/auth.jsx";
import { Shell } from "./Shell.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <Shell />
    </AuthProvider>
  </React.StrictMode>
);
