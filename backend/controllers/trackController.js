// controllers/trackController.js
// ─────────────────────────────────────────────────────────────────────────────
// Request handler for POST /track.
// Routes incoming events to the correct handler based on event type.
// Validates required fields before any database operation.
// ─────────────────────────────────────────────────────────────────────────────

const supabase = require("../supabaseClient");
const { resolveImageUrl } = require("../utils/upload");

// ── Main handler ──────────────────────────────────────────────────────────────

/**
 * POST /track
 * Accepts both "activity" and "screenshot" events.
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
    } else {
      return res.status(400).json({
        success: false,
        error: `Unknown event type: "${event.type}". Expected "activity" or "screenshot".`,
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
  // Validate activity-specific required fields
  if (!event.app || !event.title) {
    throw new Error("Activity event missing required fields: app, title.");
  }

  const row = {
    user_id:   event.user,
    app:       event.app,
    title:     event.title,
    idle:      event.idle   ?? false,
    clicks:    event.mouse?.clicks   ?? 0,
    movement:  event.mouse?.movement ?? false,
    switch:    event.switch ?? false,
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

  // Resolve final URL — uploads to storage if base64, passes through if URL
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

module.exports = { handleTrack };
