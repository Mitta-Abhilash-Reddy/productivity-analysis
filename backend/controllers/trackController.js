// controllers/trackController.js
// ─────────────────────────────────────────────────────────────────────────────
// Request handler for POST /track.
// Routes incoming events to the correct handler based on event type.
// Validates required fields before any database operation.
//
// Supported event types:
//   "activity"   — keyboard/mouse/app-focus snapshot (from tracker.js)
//   "screenshot" — screen capture (from screenshot.js via captureCoordinator)
//   "camera"     — webcam frame   (from camera.js   via captureCoordinator)
//
// "screenshot" and "camera" are always fired in sync by captureCoordinator.js
// at the same timestamp, so they can be joined on (user_id + timestamp) later.
// ─────────────────────────────────────────────────────────────────────────────

const supabase = require("../supabaseClient");
const { resolveImageUrl } = require("../utils/upload");

// ── Main handler ──────────────────────────────────────────────────────────────

/**
 * POST /track
 * Accepts "activity", "screenshot", and "camera" events.
 */
async function handleTrack(req, res) {
  const event = req.body;

  // ── Top-level validation ──────────────────────────────────────────────────
  if (!event || !event.type || !event.user || !event.timestamp) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: type, user, timestamp.",
    });
  }

  try {
    if (event.type === "activity") {
      await handleActivity(event);
    } else if (event.type === "screenshot") {
      await handleScreenshot(event);
    } else if (event.type === "camera") {
      await handleCamera(event);
    } else {
      return res.status(400).json({
        success: false,
        error: `Unknown event type: "${event.type}". Expected "activity", "screenshot", or "camera".`,
      });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error(`[Controller] Error handling "${event.type}" event:`, err.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error. See server logs.",
    });
  }
}

// ── Activity handler ──────────────────────────────────────────────────────────

/**
 * Validates and inserts an activity event into the activity_logs table.
 * @param {object} event
 */
async function handleActivity(event) {
  if (!event.app || !event.title) {
    throw new Error("Activity event missing required fields: app, title.");
  }

  const row = {
    user_id:   event.user,
    app:       event.app,
    title:     event.title,
    idle:      event.idle        ?? false,
    clicks:    event.mouse?.clicks   ?? 0,
    movement:  event.mouse?.movement ?? false,
    switch:    event.switch      ?? false,
    timestamp: event.timestamp,
  };

  const { error } = await supabase.from("activity_logs").insert(row);

  if (error) {
    throw new Error(`activity_logs insert failed: ${error.message}`);
  }

  console.log(`[Controller] ✓ Activity saved | user=${event.user} | app=${event.app}`);
}

// ── Screenshot handler ────────────────────────────────────────────────────────

/**
 * Uploads screenshot (if base64) and inserts into screenshots table.
 * @param {object} event
 */
async function handleScreenshot(event) {
  if (!event.image_url) {
    throw new Error("Screenshot event missing required field: image_url.");
  }

  // Resolve final URL — uploads to Supabase Storage if base64, passthrough if URL
  const publicUrl = await resolveImageUrl(event.image_url, event.user);

  const row = {
    user_id:   event.user,
    image_url: publicUrl,
    timestamp: event.timestamp,
  };

  const { error } = await supabase.from("screenshots").insert(row);

  if (error) {
    throw new Error(`screenshots insert failed: ${error.message}`);
  }

  console.log(`[Controller] ✓ Screenshot saved | user=${event.user} | url=${publicUrl}`);
}

// ── Camera handler ────────────────────────────────────────────────────────────

/**
 * Uploads webcam frame (if base64) and inserts into camera_captures table.
 *
 * The camera event schema (from camera.js):
 * {
 *   type:           "camera",
 *   user:           string,
 *   image_url:      string,   // base64 data URL (data:image/jpeg;base64,...)
 *   timestamp:      string,   // ISO 8601 — same value as the paired screenshot
 *   face_present:   null,     // reserved for future ML processing
 *   gaze_on_screen: null,     // reserved for future ML processing
 *   multiple_faces: null,     // reserved for future ML processing
 * }
 *
 * The timestamp intentionally matches the paired screenshot event so both
 * captures can be joined on (user_id, timestamp) in analytics queries.
 *
 * @param {object} event
 */
async function handleCamera(event) {
  if (!event.image_url) {
    throw new Error("Camera event missing required field: image_url.");
  }

  // Resolve final URL — re-uses the same upload utility as screenshots.
  // Files are namespaced under the "camera-captures" bucket to keep them
  // separate from desktop screenshots in Supabase Storage.
  const publicUrl = await resolveImageUrl(event.image_url, event.user, "camera-captures");

  const row = {
    user_id:        event.user,
    image_url:      publicUrl,
    timestamp:      event.timestamp,
    // AI/ML fields — null now, populated by a future processing pipeline
    face_present:   event.face_present   ?? null,
    gaze_on_screen: event.gaze_on_screen ?? null,
    multiple_faces: event.multiple_faces ?? null,
  };

  const { error } = await supabase.from("camera_captures").insert(row);

  if (error) {
    throw new Error(`camera_captures insert failed: ${error.message}`);
  }

  console.log(`[Controller] ✓ Camera frame saved | user=${event.user} | url=${publicUrl}`);
}

module.exports = { handleTrack };