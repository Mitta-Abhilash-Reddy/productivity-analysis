// store.js
// ─────────────────────────────────────────────────────────────────────────────
// Persistent storage module using electron-store.
// Handles all local config: USER_ID, autoStart, authToken.
// electron-store automatically resolves to the correct OS path:
//   - Windows: %APPDATA%/tracker-app/config.json
//   - macOS:   ~/Library/Application Support/tracker-app/config.json
//   - Linux:   ~/.config/tracker-app/config.json
// ─────────────────────────────────────────────────────────────────────────────

const Store = require("electron-store");

// ── Schema — validates types and sets defaults ────────────────────────────────
const schema = {
  userId: {
    type: "string",
    default: "",
  },
  autoStart: {
    type: "boolean",
    default: false,
  },
  authToken: {
    type: "string",
    default: "",
  },
  setupComplete: {
    type: "boolean",
    default: false,
  },
};

const store = new Store({ schema, name: "config" });

// ── Typed accessors — never access store.get/set directly outside this file ──

function getUserId() {
  return store.get("userId");
}

function setUserId(id) {
  store.set("userId", id.trim());
}

function isSetupComplete() {
  return store.get("setupComplete") === true && store.get("userId") !== "";
}

function markSetupComplete() {
  store.set("setupComplete", true);
}

function getAutoStart() {
  return store.get("autoStart");
}

function setAutoStart(enabled) {
  store.set("autoStart", enabled);
}

function getAuthToken() {
  return store.get("authToken");
}

function setAuthToken(token) {
  store.set("authToken", token);
}

/** For debugging — prints current store state */
function debugDump() {
  return store.store; // Returns full config object
}

module.exports = {
  getUserId,
  setUserId,
  isSetupComplete,
  markSetupComplete,
  getAutoStart,
  setAutoStart,
  getAuthToken,
  setAuthToken,
  debugDump,
};
