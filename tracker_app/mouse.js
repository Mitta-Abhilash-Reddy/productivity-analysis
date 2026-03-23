// mouse.js
// ─────────────────────────────────────────────────────────────────────────────
// Aggregated mouse activity module.
// Tracks click count and movement detection within each polling interval.
// Raw coordinates are NEVER stored or transmitted — only aggregated signals.
// Uses Electron's screen.getCursorScreenPoint() for lightweight polling.
//
// ⚠️  Production note: For true native mouse click hooks, replace the stub
//     section with `iohook` (https://wilix-team.github.io/iohook/) after
//     confirming your build pipeline supports native modules.
// ─────────────────────────────────────────────────────────────────────────────
const iohook = require("iohook");
const { screen } = require("electron");
const { resetIdleTimer } = require("./idle");

// ── Internal state (reset each interval by flushMouseData) ────────────────────
let clickCount = 0;
let movementDetected = false;
let lastCursorPos = null;

// ── Cursor polling ────────────────────────────────────────────────────────────
let cursorPollInterval = null;

/**
 * Starts the cursor polling loop.
 * Should be called once when tracking begins.
 */
function startMouseTracking() {
  lastCursorPos = screen.getCursorScreenPoint();

  // Cursor movement polling
  cursorPollInterval = setInterval(() => {
    const current = screen.getCursorScreenPoint();

    if (
      lastCursorPos &&
      (current.x !== lastCursorPos.x || current.y !== lastCursorPos.y)
    ) {
      movementDetected = true;
      resetIdleTimer();
    }

    lastCursorPos = current;
  }, 1000);

  // 🔥 ADD THIS: click listener
  iohook.on("mousedown", () => {
    clickCount++;
    resetIdleTimer();
    console.log("CLICK DETECTED"); // debug
  });

  iohook.start();
}

/**
 * Stops the cursor polling loop.
 */
function stopMouseTracking() {
  if (cursorPollInterval) {
    clearInterval(cursorPollInterval);
    cursorPollInterval = null;
  }
  clickCount = 0;
  movementDetected = false;
  lastCursorPos = null;
}

/**
 * Records a mouse click event.
 * Call this from a native hook or iohook integration.
 */
function registerClick() {
  clickCount++;
  resetIdleTimer();
}

/**
 * Returns the aggregated mouse data for the current interval,
 * then resets counters for the next interval.
 *
 * @returns {{ clicks: number, movement: boolean }}
 */
function flushMouseData() {
  const snapshot = {
    clicks: clickCount,
    movement: movementDetected,
  };

  clickCount = 0;
  movementDetected = false;

  return snapshot;
}

module.exports = {
  startMouseTracking,
  stopMouseTracking,
  registerClick,
  flushMouseData,
};
