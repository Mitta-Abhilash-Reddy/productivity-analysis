// systemInfo.js
// One-time (per process launch) device profile sent after the user is known.

const os = require("os");
const store = require("./store");
const { sendEvent } = require("./api");
const logger = require("./logger");

let sentThisLaunch = false;

/**
 * Sends system info once per app process (not repeated on sleep/resume).
 */
function sendSystemInfoOnLaunch() {
  if (sentThisLaunch) return;
  sentThisLaunch = true;

  const user = store.getUserId();
  if (!user) {
    logger.warn("SystemInfo", "Skipping — no user id.");
    return;
  }

  const event = {
    type: "system",
    user,
    device_id: store.getOrCreateDeviceId(),
    os: process.platform,
    hostname: os.hostname(),
    timestamp: new Date().toISOString(),
  };

  sendEvent(event).catch(() => {});
  logger.info("SystemInfo", `Dispatched (device=${event.device_id}).`);
}

module.exports = { sendSystemInfoOnLaunch };
