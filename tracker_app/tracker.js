// tracker.js
// ─────────────────────────────────────────────────────────────────────────────
// Core activity tracking module — production version.
// Changes from v1:
//   - USER_ID loaded from store at runtime (not hardcoded in config)
//   - All console.* replaced with logger calls
//   - interval guard (double-start prevention) verified and retained
// ─────────────────────────────────────────────────────────────────────────────

const activeWin = require("active-win");
const config = require("./config");
const store = require("./store");
const { isIdle, resetIdleTimer } = require("./idle");
const {
  startMouseTracking,
  stopMouseTracking,
  flushMouseData,
} = require("./mouse");
const { sendEvent } = require("./api");
const logger = require("./logger");

// ── Internal state ────────────────────────────────────────────────────────────
let trackingInterval = null;
let lastAppName = null;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Starts the activity tracking interval.
 * Guard prevents duplicate intervals if called multiple times.
 */
function startTracking() {
  if (trackingInterval) return; // Duplicate-start guard

  startMouseTracking();
  logger.info(
    "Tracker",
    `Started. Polling every ${config.ACTIVITY_INTERVAL_MS}ms.`
  );

  trackingInterval = setInterval(async () => {
    try {
      await collectAndSend();
    } catch (err) {
      // Never let interval throw — log and continue
      logger.error("Tracker", "Interval error", err);
    }
  }, config.ACTIVITY_INTERVAL_MS);
}

/**
 * Stops the activity tracking interval and mouse tracking.
 */
function stopTracking() {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
  stopMouseTracking();
  lastAppName = null;
  logger.info("Tracker", "Stopped.");
}

// ── Core collection ───────────────────────────────────────────────────────────

/**
 * Collects one activity snapshot and dispatches it to the API.
 */
async function collectAndSend() {
  // 1. Get currently focused window
  const win = await getActiveWindow();

  // 2. Extract app name and window title safely
  const appName = win?.owner?.name ?? "Unknown";
  const windowTitle = win?.title ?? "Unknown";

  // 3. Detect app switch
  const appSwitched = lastAppName !== null && lastAppName !== appName;
  lastAppName = appName;

  // 4. App switch = user is active — reset idle timer
  if (appSwitched) resetIdleTimer();
// 5. Check idle state
const idleState = isIdle();

// 6. Flush aggregated mouse data using idle state
const mouseData = flushMouseData(idleState);


  // 7. Assemble event — USER_ID from store (dynamic, not config)
  const event = {
    type: "activity",
    user: store.getUserId(),
    app: appName,
    title: windowTitle,
    timestamp: new Date().toISOString(),
    idle: idleState,
    mouse: mouseData,
    switch: appSwitched,
  };

  logger.info(
    "Tracker",
    `${appName} | idle=${idleState} | switch=${appSwitched} | clicks=${mouseData.clicks}`
  );

  // 8. Send to API
  await sendEvent(event);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Wraps active-win with a 3s timeout to prevent hangs on unresponsive windows.
 * @returns {Promise<object|null>}
 */
async function getActiveWindow() {
  try {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("active-win timeout")), 3000)
    );
    return await Promise.race([activeWin(), timeout]);
  } catch (err) {
    logger.warn("Tracker", `Could not get active window: ${err.message}`);
    return null;
  }
}

module.exports = { startTracking, stopTracking };
