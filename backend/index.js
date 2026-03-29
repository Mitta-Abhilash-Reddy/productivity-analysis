// index.js
// ─────────────────────────────────────────────────────────────────────────────
// WorkTracker Backend — Express server entry point.
// ─────────────────────────────────────────────────────────────────────────────

require("dotenv").config();
const express = require("express");
const trackRouter = require("./routes/track");
const {
  getActivity,
  getScreenshots,
  getCamera,
  getDevices,
  getHeartbeats,
} = require("./controllers/trackController");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  "http://localhost:4173,http://localhost:5173"
)
  .split(",")
  .map((x) => x.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    if (origin) res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  return next();
});

app.use((req, res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
});
// Add this after your existing route mounts
app.use("/dashboard", require("./routes/dashboard"));
// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Read endpoints for dashboard
app.get("/activity",   getActivity);
app.get("/screenshots", getScreenshots);
app.get("/camera",     getCamera);
app.get("/devices",    getDevices);     // ← NEW: device profiles
app.get("/heartbeats", getHeartbeats);  // ← NEW: heartbeat history

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
  console.log(`[Server] Health check:  GET  http://localhost:${PORT}/health`);
  console.log(`[Server] Track:         POST http://localhost:${PORT}/track`);
  console.log(`[Server] Activity:      GET  http://localhost:${PORT}/activity`);
  console.log(`[Server] Screenshots:   GET  http://localhost:${PORT}/screenshots`);
  console.log(`[Server] Camera:        GET  http://localhost:${PORT}/camera`);
  console.log(`[Server] Devices:       GET  http://localhost:${PORT}/devices`);
  console.log(`[Server] Heartbeats:    GET  http://localhost:${PORT}/heartbeats`);
});