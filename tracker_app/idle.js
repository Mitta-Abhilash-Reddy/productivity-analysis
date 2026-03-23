// idle.js
// ─────────────────────────────────────────────────────────────────────────────
// Idle detection module.
// Tracks last known user input time and determines idle state.
// Does NOT hook raw input — relies on aggregated signals from mouse.js and
// active-win polling (app focus changes imply activity).
// ─────────────────────────────────────────────────────────────────────────────

const config = require("./config");

// Timestamp of the last recorded user activity
let lastActivityTime = Date.now();

/**
 * Resets the idle timer.
 * Call this whenever any user input (click, keypress, movement) is detected.
 */
function resetIdleTimer() {
  lastActivityTime = Date.now();
}

/**
 * Returns true if the user has been idle beyond the configured threshold.
 * @returns {boolean}
 */
function isIdle() {
  const elapsed = Date.now() - lastActivityTime;
  return elapsed >= config.IDLE_THRESHOLD_MS;
}

/**
 * Returns how many milliseconds the user has been idle.
 * Useful for reporting or progressive thresholds.
 * @returns {number}
 */
function getIdleDurationMs() {
  return Date.now() - lastActivityTime;
}

module.exports = {
  resetIdleTimer,
  isIdle,
  getIdleDurationMs,
};
