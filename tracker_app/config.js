// config.js
// ─────────────────────────────────────────────────────────────────────────────
// Central configuration. All values are either:
//   (a) Static constants defined here
//   (b) Overridable via environment variables (for CI/deployment)
//   (c) Dynamic values loaded from store.js at runtime (USER_ID, AUTH_TOKEN)
//
// NOTE: Do NOT import store.js here — circular dep risk.
//       Dynamic values (userId, token) are injected at call sites.
// ─────────────────────────────────────────────────────────────────────────────

const path = require("path");

module.exports = {
  // ── Activity tracking ──────────────────────────────────────────────────────
  ACTIVITY_INTERVAL_MS: 7000,       // Poll every 7s (within 5–10s spec)
  IDLE_THRESHOLD_MS: 60_000,        // 1 minute idle threshold

  // ── Screenshot ────────────────────────────────────────────────────────────
  SCREENSHOT_MIN_MS: 10000,   // 10 sec minimum
  SCREENSHOT_MAX_MS: 15000,   // 15 sec maximum

  // ── API ───────────────────────────────────────────────────────────────────
  // Override via: API_URL=https://api.company.com/track npm start
  API_URL: process.env.API_URL || "http://localhost:3000/track",
  // API_URL :"https://productivity-analysis.onrender.com/track",
  API_TIMEOUT_MS: 8000,
  MAX_QUEUE_SIZE: 50,

  // ── Logging ───────────────────────────────────────────────────────────────
  // Set LOG_TO_FILE=true in environment to enable file logging
  LOG_TO_FILE: process.env.LOG_TO_FILE === "true",

  // ── Setup window ──────────────────────────────────────────────────────────
  SETUP_WINDOW_WIDTH: 420,
  SETUP_WINDOW_HEIGHT: 320,

  // ── Tray icon ─────────────────────────────────────────────────────────────
  // Use __dirname-relative path — safe in both dev and packaged builds.
  // In packaged builds, __dirname points to the asar-extracted location.
  get TRAY_ICON_PATH() {
    return path.join(__dirname, "assets", "tray-icon.png");
  },

  // ── Setup HTML ────────────────────────────────────────────────────────────
  get SETUP_HTML_PATH() {
    return path.join(__dirname, "setup.html");
  },
};
