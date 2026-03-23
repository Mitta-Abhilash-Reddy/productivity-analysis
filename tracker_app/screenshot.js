// screenshot.js
// ─────────────────────────────────────────────────────────────────────────────
// Screenshot capture module — fully decoupled from activity tracking.
// Captures the screen at randomized intervals (within configured min/max),
// encodes to base64, and dispatches a separate "screenshot" event to the API.
// Changes from v1:
//   - Uses logger instead of console
//   - USER_ID loaded from store at capture time
// ─────────────────────────────────────────────────────────────────────────────

const screenshot = require("screenshot-desktop");
const config = require("./config");
const store = require("./store");
const { sendEvent } = require("./api");
const logger = require("./logger");

// ── State ─────────────────────────────────────────────────────────────────────
let screenshotTimeout = null;
let isRunning = false;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Starts the screenshot capture loop.
 * Uses randomized intervals between SCREENSHOT_MIN_MS and SCREENSHOT_MAX_MS.
 */
function startScreenshots() {
  if (isRunning) return;
  isRunning = true;
  logger.info("Screenshot", "Module started.");
  scheduleNext();
}

/**
 * Stops the screenshot capture loop and cancels any pending capture.
 */
function stopScreenshots() {
  isRunning = false;
  if (screenshotTimeout) {
    clearTimeout(screenshotTimeout);
    screenshotTimeout = null;
  }
  logger.info("Screenshot", "Module stopped.");
}

// ── Internal logic ────────────────────────────────────────────────────────────

/**
 * Schedules the next screenshot capture after a random delay.
 * Self-scheduling: each capture schedules the next one on completion.
 */
function scheduleNext() {
  if (!isRunning) return;

  const delay = randomBetween(
    config.SCREENSHOT_MIN_MS,
    config.SCREENSHOT_MAX_MS
  );
  const delayMinutes = (delay / 60000).toFixed(1);
  logger.info("Screenshot", `Next capture in ${delayMinutes} minutes.`);

  screenshotTimeout = setTimeout(async () => {
    await captureAndSend();
    scheduleNext();
  }, delay);
}

/**
 * Captures the screen, encodes it to base64, and sends as a screenshot event.
 */
async function captureAndSend() {
  logger.info("Screenshot", "Capturing screen...");

  try {
    const imgBuffer = await screenshot({ format: "png" });
    const base64Image = `data:image/png;base64,${imgBuffer.toString("base64")}`;

    const event = {
      type: "screenshot",
      user: store.getUserId(), // Dynamic from store
      image_url: base64Image,
      timestamp: new Date().toISOString(),
    };

    logger.info(
      "Screenshot",
      `Captured ${(imgBuffer.length / 1024).toFixed(1)}KB — sending...`
    );
    await sendEvent(event);
  } catch (err) {
    // Screenshot failures are non-fatal — log and continue scheduling
    logger.error("Screenshot", "Capture failed", err);
  }
}

// ── Utility ───────────────────────────────────────────────────────────────────

/**
 * Returns a random integer between min and max (both inclusive).
 */
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = { startScreenshots, stopScreenshots };
