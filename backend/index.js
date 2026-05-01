// Devasarvam Backend — minimal "hello world" server
// This file runs in Node.js, NOT in the browser.
// It listens on port 3001 and responds to HTTP requests.

import express from "express";
import cors from "cors";

const app = express();
const PORT = 3001;

// Allow the frontend at localhost:5173 to talk to us.
// In real production we'd lock this down further, but for local development this is fine.
app.use(cors());

// Express's built-in JSON parser — lets us read JSON bodies sent by the frontend later.
app.use(express.json({ limit: "50mb" })); // 50mb because backups can get large

// The simplest possible endpoint: a GET request to / returns plain text.
app.get("/", (req, res) => {
  res.send("Hello from Devasarvam Backend\n\nIf you can see this, the backend is running correctly.");
});

// A simple health-check endpoint — useful for the frontend to verify the backend is alive.
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Start listening for requests on port 3001.
app.listen(PORT, () => {
  console.log(`✦ Devasarvam Backend running at http://localhost:${PORT}`);
  console.log(`  Try visiting that URL in your browser.`);
  console.log(`  Press Ctrl+C in this window to stop the server.`);
});
