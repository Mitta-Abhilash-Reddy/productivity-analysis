// heartbeat.js
// Sends a lightweight alive signal on a fixed interval while tracking is active.

const store = require("./store");
const { sendEvent } = require("./api");
const logger = require("./logger");

const HEARTBEAT_MS = 10_000;
let intervalId = null;

function startHeartbeat() {
  if (intervalId) return;

  intervalId = setInterval(() => {
    const user = store.getUserId();
    if (!user) return;

    const event = {
      type: "heartbeat",
      user,
      timestamp: new Date().toISOString(),
    };

    sendEvent(event).catch(() => {});
  }, HEARTBEAT_MS);

  logger.info("Heartbeat", `Started (${HEARTBEAT_MS / 1000}s interval).`);
}

function stopHeartbeat() {
  if (!intervalId) return;
  clearInterval(intervalId);
  intervalId = null;
  logger.info("Heartbeat", "Stopped.");
}

module.exports = { startHeartbeat, stopHeartbeat, HEARTBEAT_MS };
