// screenshot.js
// ─────────────────────────────────────────────────────────────────────────────
// Screenshot capture module — production version (coordinator-aware).
// Captures the screen on demand, encodes to base64, and dispatches a
// "screenshot" event to the API.
//
// ⚠️  SCHEDULING NOTE:
// As of the coordinator refactor, this module no longer owns its own timer.
// captureCoordinator.js controls WHEN captures happen (shared random interval).
// This module is responsible only for HOW a single screen capture is performed.
//
// startScreenshots() / stopScreenshots() — arm/disarm this module (called by
// coordinator before it starts firing captureAndSend()).
// captureAndSend() — exported for coordinator to call directly.
// ─────────────────────────────────────────────────────────────────────────────

const screenshot = require("screenshot-desktop");
const store = require("./store");
const { sendEvent } = require("./api");
const logger = require("./logger");

// ── State ─────────────────────────────────────────────────────────────────────
let isRunning = false;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Arms the screenshot module.
 * Called by captureCoordinator.js before the capture loop begins.
 */
function startScreenshots() {
  if (isRunning) return;
  isRunning = true;
  logger.info("Screenshot", "Module armed.");
}

/**
 * Disarms the screenshot module.
 * After calling this, captureAndSend() becomes a no-op.
 */
function stopScreenshots() {
  if (!isRunning) return;
  isRunning = false;
  logger.info("Screenshot", "Module disarmed.");
}

// ── Capture logic ─────────────────────────────────────────────────────────────

/**
 * Captures the screen, encodes it to base64, and sends a "screenshot" event.
 * Called by captureCoordinator.js in sync with camera.captureAndSend().
 *
 * @returns {Promise<void>}
 */
async function captureAndSend() {
  // Safety check — do nothing if module was disarmed between schedule and fire
  if (!isRunning) return;

  logger.info("Screenshot", "Capturing screen...");

  try {
    const imgBuffer = await screenshot({ format: "png" });
    const base64Image = `data:image/png;base64,${imgBuffer.toString("base64")}`;

    const event = {
      type:      "screenshot",
      user:      store.getUserId(),
      image_url: base64Image,
      timestamp: new Date().toISOString(),
    };

    logger.info(
      "Screenshot",
      `Captured ${(imgBuffer.length / 1024).toFixed(1)}KB — sending...`
    );
    await sendEvent(event);
  } catch (err) {
    // Screenshot failures are non-fatal — coordinator handles rescheduling
    logger.error("Screenshot", "Capture failed", err);
  }
}

// ── Utility ───────────────────────────────────────────────────────────────────

/**
 * Returns a random integer between min and max (both inclusive).
 * Retained for any standalone use; scheduling is now owned by coordinator.
 */
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
  startScreenshots,
  stopScreenshots,
  captureAndSend, // Exported so captureCoordinator.js can call it directly
};