// api.js
// ─────────────────────────────────────────────────────────────────────────────
// API communication module — production version.
// Changes from v1:
//   - Auth token injected per-request from store (not hardcoded)
//   - 4xx errors (bad request, unauthorized) are NOT retried — they won't recover
//   - Uses logger for all output instead of console
//   - getClient() factory ensures token is always fresh per request
// ─────────────────────────────────────────────────────────────────────────────

const axios = require("axios");
const config = require("./config");
const store = require("./store");
const logger = require("./logger");

// ── Offline queue ─────────────────────────────────────────────────────────────
let offlineQueue = [];
let isFlushing = false;

// ── Axios client factory ──────────────────────────────────────────────────────
// Called per-request so the auth token is always fresh (no stale closure).
function getClient() {
  const token = store.getAuthToken();
  return axios.create({
    baseURL: config.API_URL,
    timeout: config.API_TIMEOUT_MS,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

// ── Core send ─────────────────────────────────────────────────────────────────

/**
 * Sends a single event to the backend.
 * On failure, queues the event for retry.
 *
 * @param {object} event - The structured event object (activity or screenshot)
 */
async function sendEvent(event) {
  // Try to flush queued events first (fire-and-forget)
  flushQueue().catch(() => {});

  try {
    await sendWithRetry(event, 3);
  } catch (err) {
    logger.warn(
      "API",
      `Failed after retries — queuing. Reason: ${err.message}`
    );
    enqueue(event);
  }
}

// ── Retry with exponential backoff ────────────────────────────────────────────

/**
 * Attempts to POST an event up to maxAttempts times with exponential backoff.
 * Does NOT retry 4xx errors — they indicate a client error that won't self-resolve.
 *
 * @param {object} event
 * @param {number} maxAttempts
 */
async function sendWithRetry(event, maxAttempts) {
  let lastError;
  const client = getClient(); // Fresh client with latest auth token

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await client.post("", event);
      logger.info("API", `✓ Sent [${event.type}] — HTTP ${res.status}`);
      return; // Success
    } catch (err) {
      lastError = err;
      const status = err.response?.status;

      // Don't retry 4xx — bad request or auth error won't self-resolve
      const isRetryable = !status || status >= 500;
      if (!isRetryable || attempt === maxAttempts) break;

      // Exponential backoff: 500ms → 1000ms → 2000ms
      const delay = Math.pow(2, attempt - 1) * 500;
      logger.warn(
        "API",
        `Attempt ${attempt} failed (${status ?? "network"}). Retrying in ${delay}ms`
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

// ── Offline queue ─────────────────────────────────────────────────────────────

/**
 * Adds an event to the offline queue.
 * Drops the oldest if queue exceeds MAX_QUEUE_SIZE.
 *
 * @param {object} event
 */
function enqueue(event) {
  if (offlineQueue.length >= config.MAX_QUEUE_SIZE) {
    const dropped = offlineQueue.shift();
    logger.warn(
      "API",
      `Queue full — dropped oldest: ${dropped.type} @ ${dropped.timestamp}`
    );
  }
  offlineQueue.push(event);
  logger.info("API", `Queued. Queue size: ${offlineQueue.length}`);
}

/**
 * Flushes the offline queue.
 * Runs serially to avoid hammering the server.
 * Safe to call concurrently — guarded by isFlushing flag.
 */
async function flushQueue() {
  if (isFlushing || offlineQueue.length === 0) return;
  isFlushing = true;
  logger.info("API", `Flushing ${offlineQueue.length} queued events...`);

  const snapshot = [...offlineQueue];
  offlineQueue = [];

  for (const event of snapshot) {
    try {
      await sendWithRetry(event, 2); // Fewer retries for queued events
    } catch {
      offlineQueue.push(event); // Re-queue failures for next flush
    }
  }

  isFlushing = false;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

/** @param {number} ms */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Returns current offline queue length — useful for status display */
function getQueueLength() {
  return offlineQueue.length;
}

module.exports = { sendEvent, getQueueLength };
