// camera.js
// ─────────────────────────────────────────────────────────────────────────────
// Webcam capture via Electron/Chromium getUserMedia (hidden BrowserWindow).
// Replaces node-webcam so packaged .exe works without CommandCam.exe and
// matches normal desktop camera permission flows on Windows/macOS.
// ─────────────────────────────────────────────────────────────────────────────

const { BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const store = require("./store");
const { sendEvent } = require("./api");
const logger = require("./logger");

let camWindow = null;
let isRunning = false;

function getCamWindow() {
  if (camWindow && !camWindow.isDestroyed()) return camWindow;
  camWindow = new BrowserWindow({
    show: false,
    width: 1280,
    height: 720,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, "camera-preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  return camWindow;
}

function destroyCamWindow() {
  if (camWindow && !camWindow.isDestroyed()) {
    camWindow.destroy();
  }
  camWindow = null;
}

/**
 * Loads camera-capture.html; page calls getUserMedia and posts one JPEG data URL.
 * @returns {Promise<string>}
 */
function captureOneFrame() {
  return new Promise((resolve, reject) => {
    const win = getCamWindow();
    const timeoutMs = 25_000;

    const onOk = (_evt, dataUrl) => {
      clearTimeout(timer);
      ipcMain.removeListener("camera-capture-success", onOk);
      ipcMain.removeListener("camera-capture-failure", onFail);
      resolve(dataUrl);
    };

    const onFail = (_evt, msg) => {
      clearTimeout(timer);
      ipcMain.removeListener("camera-capture-success", onOk);
      ipcMain.removeListener("camera-capture-failure", onFail);
      reject(new Error(msg || "Camera capture failed"));
    };

    const timer = setTimeout(() => {
      ipcMain.removeListener("camera-capture-success", onOk);
      ipcMain.removeListener("camera-capture-failure", onFail);
      reject(new Error("Camera capture timed out"));
    }, timeoutMs);

    ipcMain.on("camera-capture-success", onOk);
    ipcMain.on("camera-capture-failure", onFail);

    const htmlPath = path.join(__dirname, "camera-capture.html");
    win.loadFile(htmlPath).catch((err) => {
      clearTimeout(timer);
      ipcMain.removeListener("camera-capture-success", onOk);
      ipcMain.removeListener("camera-capture-failure", onFail);
      reject(err);
    });
  });
}

function startCamera() {
  if (isRunning) return;
  isRunning = true;
  logger.info("Camera", "Module started (Electron getUserMedia).");
}

function stopCamera() {
  if (!isRunning) return;
  isRunning = false;
  destroyCamWindow();
  logger.info("Camera", "Module stopped.");
}

async function captureAndSend() {
  if (!isRunning) return;

  logger.info("Camera", "Capturing webcam frame...");

  try {
    const base64Image = await captureOneFrame();

    if (!base64Image || typeof base64Image !== "string") {
      throw new Error("Empty camera frame");
    }

    const event = {
      type: "camera",
      user: store.getUserId(),
      image_url: base64Image,
      timestamp: new Date().toISOString(),
      face_present: null,
      gaze_on_screen: null,
      multiple_faces: null,
    };

    const approxLen = base64Image.length;
    logger.info("Camera", `Captured frame (~${approxLen} chars) — sending...`);

    await sendEvent(event);
  } catch (err) {
    logger.error("Camera", "Capture failed", err);
  }
}

module.exports = {
  startCamera,
  stopCamera,
  captureAndSend,
};
