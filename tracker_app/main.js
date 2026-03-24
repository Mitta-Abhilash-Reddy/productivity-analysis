// main.js
// ─────────────────────────────────────────────────────────────────────────────
// Electron main process — production version.
// Changes from v1:
//   - First-run setup flow integrated (awaits setup before tracking)
//   - logger.initLogger() called immediately on ready
//   - setTrackingState() synced with tray on every state change
//   - auto-start preference applied on every launch from store
//   - window-all-closed does not quit the app (tray-only)
// Changes for camera + coordinator sync:
//   - startScreenshots/stopScreenshots replaced by captureCoordinator
//   - captureCoordinator fires screenshot + camera simultaneously
//   - Set withCamera: false below to run screenshot-only if no webcam present
// ─────────────────────────────────────────────────────────────────────────────

const { app, powerMonitor } = require("electron");
const logger = require("./logger");
const store = require("./store");
const { setupTray, setTrackingState } = require("./tray");
const { startTracking, stopTracking } = require("./tracker");
const { startCaptures, stopCaptures } = require("./captureCoordinator"); // ← replaces screenshot import
const { openSetupWindow } = require("./setup");

// ── Single instance lock ──────────────────────────────────────────────────────
if (!app.requestSingleInstanceLock()) {
  console.log("[Main] Already running. Exiting.");
  app.quit();
}

// ── Tracking state ────────────────────────────────────────────────────────────
let isTracking = false;

function startAllTracking() {
  if (isTracking) return;
  isTracking = true;
  startTracking();
  // Coordinator fires screenshot + camera in sync at each interval.
  // To disable camera (e.g. no webcam available), set withCamera: false.
  startCaptures({ withCamera: true });
  setTrackingState(true); // Sync tray menu
  logger.info("Main", "▶ Tracking started.");
}

function stopAllTracking() {
  if (!isTracking) return;
  isTracking = false;
  stopTracking();
  stopCaptures(); // Stops coordinator — disarms both screenshot + camera
  setTrackingState(false); // Sync tray menu
  logger.info("Main", "⏸ Tracking paused.");
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // 1. Init file logger first so all subsequent logs are captured
  logger.initLogger();
  logger.info("Main", `App starting. Version: ${app.getVersion()}`);

  // 2. Hide from Dock/taskbar — tray-only app
  if (app.dock) app.dock.hide();

  // 3. First-run setup — blocks until user completes form
  if (!store.isSetupComplete()) {
    logger.info("Main", "First run detected — opening setup window.");
    await openSetupWindow(); // Awaits IPC 'setup:submit' event internally
    logger.info("Main", `Setup done. USER_ID=${store.getUserId()}`);
  } else {
    logger.info("Main", `Returning user: ${store.getUserId()}`);
  }

  // 4. Apply stored auto-start preference on every launch
  app.setLoginItemSettings({ openAtLogin: store.getAutoStart() });

  // 5. Setup tray (now safe — USER_ID is guaranteed to exist)
  setupTray({
    onStart: startAllTracking,
    onPause: stopAllTracking,
    onExit: () => {
      stopAllTracking();
      app.quit();
    },
  });

  // 6. System sleep/wake handling
  powerMonitor.on("suspend", () => {
    logger.info("Main", "System suspended — stopping tracking.");
    stopAllTracking();
  });
  powerMonitor.on("resume", () => {
    logger.info("Main", "System resumed — starting tracking.");
    startAllTracking();
  });

  // 7. Begin tracking
  startAllTracking();
});

// ── Keep app alive when all windows close (setup window closes after submit) ──
app.on("window-all-closed", (e) => e.preventDefault());

// ── Graceful shutdown ─────────────────────────────────────────────────────────
app.on("before-quit", () => {
  logger.info("Main", "Quitting — cleaning up.");
  stopAllTracking();
});