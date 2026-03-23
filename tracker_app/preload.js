// preload.js
// ─────────────────────────────────────────────────────────────────────────────
// Preload script — runs in a sandboxed context with access to both
// Node.js APIs and the renderer's window object.
// Exposes a minimal, explicit API surface to the renderer via contextBridge.
// This is the Electron security best practice — renderer never touches Node.js.
// ─────────────────────────────────────────────────────────────────────────────

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("tracker", {
  /**
   * Submit the setup form.
   * @param {{ userId: string, enableAutoStart: boolean }} data
   */
  submitSetup: (data) => ipcRenderer.send("setup:submit", data),

  /**
   * Validate a userId field.
   * @param {string} userId
   * @returns {Promise<boolean>}
   */
  validateUserId: (userId) => {
    return new Promise((resolve) => {
      ipcRenderer.once("setup:validation-result", (_, isValid) =>
        resolve(isValid)
      );
      ipcRenderer.send("setup:validate", userId);
    });
  },
});
