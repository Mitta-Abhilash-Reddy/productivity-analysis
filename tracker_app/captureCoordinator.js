// captureCoordinator.js
// ─────────────────────────────────────────────────────────────────────────────
// Synchronized capture coordinator.
// Owns the single shared timer that fires both screenshot.js and camera.js
// at EXACTLY the same moment. This guarantees that every screen capture has
// a corresponding webcam frame with the same timestamp.
//
// Architecture:
//   captureCoordinator  ──(setTimeout loop)──▶  fires at T
//                                                  ├─ screenshot.captureAndSend()
//                                                  └─ camera.captureAndSend()
//
// Both captures are launched with Promise.allSettled() so one failing does
// NOT block or cancel the other. After both settle, the next interval is
// scheduled — this prevents drift from accumulating over time.
//
// This module REPLACES the individual scheduling loops that previously lived
// inside screenshot.js. The screenshot.js and camera.js modules are now
// "dumb" capture workers — they only implement captureAndSend() and
// start/stop guards. All timing logic lives here.
// ─────────────────────────────────────────────────────────────────────────────

const config = require("./config");
const logger = require("./logger");

// ── Lazy imports — avoids circular dep issues at module load time ─────────────
// Both modules export { startX, stopX, captureAndSend }
let screenshotModule = null;
let cameraModule = null;

// ── State ─────────────────────────────────────────────────────────────────────
let coordinatorTimeout = null;
let isRunning = false;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Starts the synchronized capture loop.
 * Initializes both screenshot and camera modules, then begins scheduling.
 *
 * @param {{ withCamera?: boolean }} options
 *   withCamera: set to false to run screenshot-only mode (camera unavailable)
 */
function startCaptures({ withCamera = true } = {}) {
  if (isRunning) return;

  // Load modules lazily to avoid circular dependencies
  screenshotModule = require("./screenshot");
  if (withCamera) {
    cameraModule = require("./camera");
  }

  isRunning = true;

  // Arm the individual modules (sets their isRunning flags)
  screenshotModule.startScreenshots();
  if (cameraModule) cameraModule.startCamera();

  logger.info(
    "Coordinator",
    `Started. Camera: ${withCamera ? "enabled" : "disabled"}. ` +
    `Interval: ${(config.SCREENSHOT_MIN_MS / 1000).toFixed(0)}–` +
    `${(config.SCREENSHOT_MAX_MS / 1000).toFixed(0)} s.`
  );

  scheduleNext(withCamera);
}

/**
 * Stops the synchronized capture loop and disarms both modules.
 */
function stopCaptures() {
  if (!isRunning) return;
  isRunning = false;

  if (coordinatorTimeout) {
    clearTimeout(coordinatorTimeout);
    coordinatorTimeout = null;
  }

  // Disarm individual modules
  if (screenshotModule) screenshotModule.stopScreenshots();
  if (cameraModule)     cameraModule.stopCamera();

  logger.info("Coordinator", "Stopped. All capture modules disarmed.");
}

// ── Internal scheduling loop ──────────────────────────────────────────────────

/**
 * Schedules the next synchronized capture after a random delay.
 * Self-scheduling: fires next interval only AFTER both captures settle.
 * This prevents timer drift when captures take longer than expected.
 *
 * @param {boolean} withCamera
 */
function scheduleNext(withCamera) {
  if (!isRunning) return;

  const delay = randomBetween(config.SCREENSHOT_MIN_MS, config.SCREENSHOT_MAX_MS);
  const delaySec = (delay / 1000).toFixed(1);

  logger.info("Coordinator", `Next synchronized capture in ${delaySec} s.`);

  coordinatorTimeout = setTimeout(async () => {
    await fireSynchronized(withCamera);
    scheduleNext(withCamera); // Schedule next AFTER both captures complete
  }, delay);
}

/**
 * Fires both screenshot and camera captures simultaneously using
 * Promise.allSettled() — ensures one failure cannot cancel the other.
 *
 * @param {boolean} withCamera
 */
async function fireSynchronized(withCamera) {
  if (!isRunning) return;

  const captureTime = new Date().toISOString();
  logger.info("Coordinator", `Firing synchronized capture @ ${captureTime}`);

  const tasks = [
    screenshotModule.captureAndSend(),
  ];

  if (withCamera && cameraModule) {
    tasks.push(cameraModule.captureAndSend());
  }

  // allSettled — both run in parallel; a failure in one does not stop the other
  const results = await Promise.allSettled(tasks);

  // Log any unexpected rejections (each module also logs its own errors,
  // but this gives a coordinator-level summary)
  results.forEach((result, i) => {
    const label = i === 0 ? "screenshot" : "camera";
    if (result.status === "rejected") {
      logger.error(
        "Coordinator",
        `${label} capture rejected (unhandled): ${result.reason}`
      );
    }
  });

  logger.info("Coordinator", "Synchronized capture cycle complete.");
}

// ── Utility ───────────────────────────────────────────────────────────────────

/**
 * Returns a random integer between min and max (both inclusive).
 */
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = { startCaptures, stopCaptures };
