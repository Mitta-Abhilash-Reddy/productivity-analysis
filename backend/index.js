// index.js
// ─────────────────────────────────────────────────────────────────────────────
// WorkTracker Backend — Express server entry point.
// Handles: middleware setup, route mounting, health check, and startup.
// ─────────────────────────────────────────────────────────────────────────────

require("dotenv").config();
const express = require("express");
const trackRouter = require("./routes/track");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────

// Parse incoming JSON bodies
// Limit set to 10mb to handle base64-encoded screenshots
app.use(express.json({ limit: "10mb" }));

// Request logger — logs every incoming request with timestamp
app.use((req, res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────

// Health check — used by Render to verify the service is alive
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Main tracking endpoint — handles all events from the Electron agent
app.use("/track", trackRouter);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found." });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[Server] Unhandled error:", err.message);
  res.status(500).json({ success: false, error: "Unexpected server error." });
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Server] WorkTracker backend running on port ${PORT}`);
  console.log(`[Server] Health check: http://localhost:${PORT}/health`);
  console.log(`[Server] Track endpoint: POST http://localhost:${PORT}/track`);
});
