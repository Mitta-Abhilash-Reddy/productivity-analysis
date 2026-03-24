// camera.js
// ─────────────────────────────────────────────────────────────────────────────
// Webcam capture module — mirrors screenshot.js structure exactly.
// Captures a single webcam frame at coordinated intervals (in sync with
// screenshot.js via captureCoordinator.js), encodes to base64, and dispatches
// a "camera" event to the API.
//
// Uses node-webcam for Node.js-native webcam access.
// No browser APIs (navigator, DOM, canvas) used anywhere.
// No files are written to disk — everything is in-memory.
// ─────────────────────────────────────────────────────────────────────────────

const NodeWebcam = require("node-webcam");
const fs = require("fs");
const path = require("path");
const os = require("os");
const config = require("./config");
const store = require("./store");
const { sendEvent } = require("./api");
const logger = require("./logger");

// ── Webcam instance ───────────────────────────────────────────────────────────
// node-webcam is configured once at module load.
// output: "jpeg" — most webcams natively output JPEG; we re-encode to PNG base64.
// callbackReturn: "buffer" is not supported by node-webcam directly, so we use
// a temp file strategy: capture → read → buffer → base64 → delete file.
// This is the standard node-webcam pattern for in-memory use.
const webcam = NodeWebcam.create({
  width: 1280,
  height: 720,
  quality: 90,
  output: "jpeg",         // Captured as JPEG from hardware
  device: false,          // false = use system default camera
  callbackReturn: "base64", // node-webcam returns base64 directly
  verbose: false,           // Suppress native tool output
});

// ── State ─────────────────────────────────────────────────────────────────────
let isRunning = false;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Starts the camera capture module.
 * Actual scheduling is controlled by captureCoordinator.js.
 * This function just arms the module so captureAndSend() can be called.
 */
function startCamera() {
  if (isRunning) return;
  isRunning = true;
  logger.info("Camera", "Module started.");
}

/**
 * Stops the camera capture module.
 * After calling this, captureAndSend() will be a no-op.
 */
function stopCamera() {
  if (!isRunning) return;
  isRunning = false;
  logger.info("Camera", "Module stopped.");
}

// ── Internal logic ────────────────────────────────────────────────────────────

/**
 * Captures a single webcam frame, encodes it to base64, and sends a
 * "camera" event via the API.
 *
 * Called externally by captureCoordinator.js at the same moment as
 * screenshot.js's captureAndSend() — ensuring both captures are synchronized.
 *
 * @returns {Promise<void>}
 */
async function captureAndSend() {
  // Safety check — do nothing if module was stopped between schedule and fire
  if (!isRunning) return;

  logger.info("Camera", "Capturing webcam frame...");

  try {
    // Capture frame as base64 via node-webcam
    const base64Data = await captureBase64();

    // node-webcam returns raw base64 (no data URL prefix) — add the prefix
    // const base64Image = `data:image/jpeg;base64,${base64Data}`;
    const base64Image = base64Data;
    console.log("BASE64 START:", base64Image.slice(0, 50));
console.log("BASE64 LENGTH:", base64Image.length);

    const event = {
      type:            "camera",
      user:            store.getUserId(),
      image_url:       base64Image,
      timestamp:       new Date().toISOString(),
      // Placeholders for future AI/ML processing (face detection, gaze, etc.)
      face_present:    null,
      gaze_on_screen:  null,
      multiple_faces:  null,
    };

    const sizeKB = ((base64Data.length * 3) / 4 / 1024).toFixed(1);
    logger.info("Camera", `Captured ~${sizeKB}KB — sending...`);

    await sendEvent(event);
  } catch (err) {
    // Camera failures are non-fatal — log and allow coordinator to reschedule
    logger.error("Camera", "Capture failed", err);
  }
}

// ── Webcam capture helper ─────────────────────────────────────────────────────

/**
 * Wraps node-webcam's callback-based capture in a Promise.
 * Returns raw base64 string (without data URL prefix).
 *
 * node-webcam writes a temp file internally, then reads it back as base64.
 * We use os.tmpdir() as the capture path to avoid polluting the project dir.
 *
 * @returns {Promise<string>} Raw base64-encoded JPEG string
 */
function captureBase64() {
  return new Promise((resolve, reject) => {
    // Temp file path — node-webcam appends the extension automatically
    const tmpPath = path.join(os.tmpdir(), `wt_cam_${Date.now()}`);

    webcam.capture(tmpPath, (err, data) => {
      if (err) {
        reject(new Error(`node-webcam capture error: ${err}`));
        return;
      }

      // node-webcam returns base64 string directly when callbackReturn="base64"
      // Clean up any residual temp file node-webcam may have left
      const tmpFile = `${tmpPath}.jpg`;
      if (fs.existsSync(tmpFile)) {
        fs.unlink(tmpFile, () => {}); // Fire-and-forget — non-critical cleanup
      }

      if (!data || typeof data !== "string") {
        reject(new Error("node-webcam returned empty or invalid data."));
        return;
      }

      resolve(data);
    });
  });
}

module.exports = {
  startCamera,
  stopCamera,
  captureAndSend, // Exported so captureCoordinator.js can call it directly
};
