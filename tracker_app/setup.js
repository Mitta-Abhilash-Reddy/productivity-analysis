// setup.js
// ─────────────────────────────────────────────────────────────────────────────
// First-run setup window module.
// Shows a small window on first launch to collect Employee ID and auto-start
// preference. Communicates with the renderer via contextBridge + ipcMain.
// ─────────────────────────────────────────────────────────────────────────────

const { BrowserWindow, ipcMain, app } = require("electron");
const path = require("path");

const config = require("./config");
const store = require("./store");
const logger = require("./logger");

let setupWindow = null;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Opens the setup window.
 * Returns a Promise that resolves when the user completes setup.
 *
 * @returns {Promise<void>}
 */
function openSetupWindow() {
  return new Promise((resolve) => {
    setupWindow = new BrowserWindow({
      width: config.SETUP_WINDOW_WIDTH,
      height: config.SETUP_WINDOW_HEIGHT,
      resizable: false,
      maximizable: false,
      minimizable: false,
      fullscreenable: false,
      title: "WorkTracker Setup",
      center: true,
      show: false, // Show after content loads to avoid white flash
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,  // Security: renderer can't access Node.js
        nodeIntegration: false,  // Security best practice
      },
    });

    setupWindow.loadFile(config.SETUP_HTML_PATH);

    // Show window once DOM is ready — prevents white flash
    setupWindow.once("ready-to-show", () => {
      setupWindow.show();
      logger.info("Setup", "Setup window opened.");
    });

    // Prevent window from being closed without completing setup
    setupWindow.on("close", (e) => {
      if (!store.isSetupComplete()) {
        e.preventDefault(); // Block close — setup is mandatory
        logger.warn("Setup", "User attempted to close setup window.");
      }
    });

    // ── IPC: Renderer submits setup form ─────────────────────────────────────
    ipcMain.once("setup:submit", (event, { userId, enableAutoStart }) => {
      logger.info(
        "Setup",
        `Received setup: userId=${userId}, autoStart=${enableAutoStart}`
      );

      // Persist to store
      store.setUserId(userId);
      store.setAutoStart(enableAutoStart);
      store.markSetupComplete();

      // Apply auto-start immediately
      app.setLoginItemSettings({ openAtLogin: enableAutoStart });

      // Close window and resolve promise
      setupWindow.destroy();
      setupWindow = null;

      logger.info("Setup", "Setup complete. Tracking will begin.");
      resolve();
    });

    // ── IPC: Renderer requests validation ────────────────────────────────────
    ipcMain.on("setup:validate", (event, userId) => {
      const isValid = typeof userId === "string" && userId.trim().length >= 2;
      event.reply("setup:validation-result", isValid);
    });
  });
}

module.exports = { openSetupWindow };
