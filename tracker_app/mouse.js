// mouse.js
// ─────────────────────────────────────────────────────────
// Clean version WITHOUT iohook
// Uses movement + idle to simulate engagement (clicks)
// ─────────────────────────────────────────────────────────

const { screen } = require("electron");
const { resetIdleTimer } = require("./idle");

let movementDetected = false;
let lastCursorPos = null;
let cursorPollInterval = null;

/**
 * Start tracking mouse movement
 */
function startMouseTracking() {
  lastCursorPos = screen.getCursorScreenPoint();

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
}

/**
 * Stop tracking
 */
function stopMouseTracking() {
  if (cursorPollInterval) {
    clearInterval(cursorPollInterval);
    cursorPollInterval = null;
  }

  movementDetected = false;
  lastCursorPos = null;
}

/**
 * Return aggregated mouse data
 */
function flushMouseData(idle) {
  // 🔥 Simulated click logic
  const clicks = movementDetected && !idle ? 1 : 0;

  const snapshot = {
    clicks,
    movement: movementDetected,
  };

  movementDetected = false;
  return snapshot;
}

module.exports = {
  startMouseTracking,
  stopMouseTracking,
  flushMouseData,
};