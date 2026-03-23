// tray.js
// ─────────────────────────────────────────────────────────────────────────────
// System tray module — production version.
// Changes from v1:
//   - Auto-start toggle added to menu (reads/writes store + applies to OS)
//   - setTrackingState() exported so main.js can sync menu on state change
//   - Uses logger instead of console
//   - Menu correctly shows userId from store
//   - Notification helper hardened with try/catch
// ─────────────────────────────────────────────────────────────────────────────

const { Tray, Menu, nativeImage, Notification, app } = require("electron");
const path = require("path");
const config = require("./config");
const store = require("./store");
const logger = require("./logger");

// ── Module state ──────────────────────────────────────────────────────────────
let tray = null;
let isCurrentlyTracking = false;
let menuCallbacks = null; // Stored for menu rebuilds triggered by auto-start toggle

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Creates and configures the system tray icon and menu.
 * @param {{ onStart: Function, onPause: Function, onExit: Function }} callbacks
 */
function setupTray({ onStart, onPause, onExit }) {
  menuCallbacks = { onStart, onPause, onExit };

  const icon = loadIcon(config.TRAY_ICON_PATH);
  tray = new Tray(icon);
  tray.setToolTip("WorkTracker");

  tray.on("click", () => tray.popUpContextMenu());

  rebuildMenu();

  logger.info("Tray", "System tray initialized.");
  showNotification(
    "WorkTracker",
    "Running in the background. Right-click tray to control."
  );
}

/**
 * Updates the tray's tracking state and rebuilds the menu.
 * Called from main.js when tracking starts/stops.
 * @param {boolean} tracking
 */
function setTrackingState(tracking) {
  isCurrentlyTracking = tracking;
  tray?.setToolTip(`WorkTracker — ${tracking ? "Active" : "Paused"}`);
  rebuildMenu();
}

// ── Internal ──────────────────────────────────────────────────────────────────

function rebuildMenu() {
  if (!tray || !menuCallbacks) return;
  const { onStart, onPause, onExit } = menuCallbacks;
  const autoStartEnabled = store.getAutoStart();
  const userId = store.getUserId();

  const menu = Menu.buildFromTemplate([
    // ── Status display (non-interactive) ──
    {
      label: `● Status: ${isCurrentlyTracking ? "Tracking" : "Paused"}`,
      enabled: false,
    },
    {
      label: `  User: ${userId || "Unknown"}`,
      enabled: false,
    },
    { type: "separator" },

    // ── Tracking controls ──
    {
      label: "▶  Start Tracking",
      enabled: !isCurrentlyTracking,
      click: () => {
        onStart();
        // Note: setTrackingState called inside onStart via main.js
        showNotification("WorkTracker", "Tracking resumed.");
      },
    },
    {
      label: "⏸  Pause Tracking",
      enabled: isCurrentlyTracking,
      click: () => {
        onPause();
        // Note: setTrackingState called inside onPause via main.js
        showNotification("WorkTracker", "Tracking paused.");
      },
    },

    { type: "separator" },

    // ── Auto-start toggle ──
    {
      label: `${autoStartEnabled ? "✓" : "○"}  Launch at Login`,
      click: () => {
        const newVal = !store.getAutoStart();
        store.setAutoStart(newVal);
        app.setLoginItemSettings({ openAtLogin: newVal });
        logger.info("Tray", `Auto-start ${newVal ? "enabled" : "disabled"}.`);
        showNotification(
          "WorkTracker",
          `Auto-start ${newVal ? "enabled" : "disabled"}.`
        );
        rebuildMenu(); // Reflect checkbox state change immediately
      },
    },

    { type: "separator" },

    // ── Exit ──
    {
      label: "✕  Exit WorkTracker",
      click: () => {
        showNotification("WorkTracker", "Shutting down...");
        setTimeout(onExit, 600);
      },
    },
  ]);

  tray.setContextMenu(menu);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadIcon(iconPath) {
  try {
    const img = nativeImage.createFromPath(iconPath);
    if (!img.isEmpty()) return img;
    throw new Error("Empty image");
  } catch (err) {
    logger.warn("Tray", `Icon not found at ${iconPath}. Using empty icon.`);
    return nativeImage.createEmpty();
  }
}

function showNotification(title, body) {
  try {
    if (Notification.isSupported()) {
      new Notification({ title, body, silent: true }).show();
    }
  } catch {
    // Notifications can fail on some Linux DEs — non-fatal
  }
}

module.exports = { setupTray, setTrackingState };
