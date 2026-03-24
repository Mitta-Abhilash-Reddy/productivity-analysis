// logger.js
// ─────────────────────────────────────────────────────────────────────────────
// Centralized logging module.
// - Always logs to console with timestamps
// - Optionally writes to file when LOG_TO_FILE=true
// - Log file location: <userData>/logs/tracker.log
// - Keeps last 500 lines to prevent unbounded growth
// ─────────────────────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");
const { app } = require("electron");
const config = require("./config");

// ── Log file setup ────────────────────────────────────────────────────────────
let logFilePath = null;
let logFileReady = false;

/**
 * Initializes the file logger.
 * Must be called AFTER app.whenReady() so app.getPath() works.
 */
function initLogger() {
  // Packaged apps have no DevTools console; always persist logs unless opted out.
  const enableFile =
    config.LOG_TO_FILE ||
    (app.isPackaged && process.env.LOG_TO_FILE !== "false");

  if (!enableFile) return;

  try {
    const logsDir = path.join(app.getPath("userData"), "logs");
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

    logFilePath = path.join(logsDir, "tracker.log");
    logFileReady = true;
    info("Logger", `File logging enabled → ${logFilePath}`);
  } catch (err) {
    console.error("[Logger] Failed to initialize file logging:", err.message);
  }
}

// ── Log levels ────────────────────────────────────────────────────────────────

/**
 * @param {string} module - The calling module name (e.g. "Tracker", "API")
 * @param {string} message
 */
function info(module, message) {
  write("INFO ", module, message);
}

function warn(module, message) {
  write("WARN ", module, message);
}

function error(module, message, err = null) {
  const detail = err ? ` | ${err.stack || err.message}` : "";
  write("ERROR", module, message + detail);
}

// ── Internal writer ───────────────────────────────────────────────────────────

function write(level, module, message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] [${module}] ${message}`;

  // Always print to console
  if (level === "ERROR") console.error(line);
  else if (level === "WARN ") console.warn(line);
  else console.log(line);

  // Optionally write to file
  if (logFileReady && logFilePath) {
    try {
      fs.appendFileSync(logFilePath, line + "\n", "utf8");
      trimLogFile(); // Keep file size bounded
    } catch {
      // Silently fail — don't crash the app over logging
    }
  }
}

/**
 * Trims the log file to the last 500 lines if it exceeds 600 lines.
 */
function trimLogFile() {
  try {
    const content = fs.readFileSync(logFilePath, "utf8");
    const lines = content.split("\n").filter(Boolean);
    if (lines.length > 600) {
      const trimmed = lines.slice(-500).join("\n") + "\n";
      fs.writeFileSync(logFilePath, trimmed, "utf8");
    }
  } catch {
    // Non-critical — ignore
  }
}

module.exports = { initLogger, info, warn, error };
