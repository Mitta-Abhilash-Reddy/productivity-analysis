const supabase = require("../supabaseClient");
const { resolveImageUrl } = require("../utils/upload");

// ── Main handler ──────────────────────────────────────────────────────────────
async function handleTrack(req, res) {
  const event = req.body;

  // Top-level validation
  if (!event || !event.type || !event.user || !event.timestamp) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: type, user, timestamp.",
    });
  }

  console.log("📩 EVENT RECEIVED:", event.type);

  try {
    switch (event.type) {
      case "activity":
        await handleActivity(event);
        break;

      case "screenshot":
        await handleScreenshot(event);
        break;

      case "camera":
        await handleCamera(event);
        break;

      default:
        console.warn("⚠️ Unknown event type:", event.type);
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
async function handleActivity(event) {
  // 🔥 FIX: Do NOT throw error — just skip bad events
  if (!event.app || !event.title) {
    console.warn("⚠️ Skipping invalid activity event:", event);
    return;
  }

  const row = {
    user_id: event.user,
    app: event.app,
    title: event.title,
    idle: event.idle ?? false,
    clicks: event.mouse?.clicks ?? 0,
    movement: event.mouse?.movement ?? false,
    switch: event.switch ?? false,
    timestamp: event.timestamp,
  };

  const { error } = await supabase.from("activity_logs").insert(row);

  if (error) {
    throw new Error(`activity_logs insert failed: ${error.message}`);
  }

  console.log(`✅ Activity saved | user=${event.user} | app=${event.app}`);
}

// ── Screenshot handler ────────────────────────────────────────────────────────
async function handleScreenshot(event) {
  if (!event.image_url) {
    console.warn("⚠️ Screenshot skipped (no image_url)");
    return;
  }

  console.log("📸 Uploading screenshot...");

  const publicUrl = await resolveImageUrl(event.image_url, event.user);

  const row = {
    user_id: event.user,
    image_url: publicUrl,
    timestamp: event.timestamp,
  };

  const { error } = await supabase.from("screenshots").insert(row);

  if (error) {
    throw new Error(`screenshots insert failed: ${error.message}`);
  }

  console.log(`✅ Screenshot saved | user=${event.user}`);
}

// ── Camera handler ────────────────────────────────────────────────────────────
async function handleCamera(event) {
  if (!event.image_url) {
    console.warn("⚠️ Camera skipped (no image_url)");
    return;
  }

  console.log("📷 Uploading camera frame...");

  const publicUrl = await resolveImageUrl(
    event.image_url,
    event.user,
    "camera-captures"
  );

  const row = {
    user_id: event.user,
    image_url: publicUrl,
    timestamp: event.timestamp,
    face_present: event.face_present ?? null,
    gaze_on_screen: event.gaze_on_screen ?? null,
    multiple_faces: event.multiple_faces ?? null,
  };

  const { error } = await supabase.from("camera_captures").insert(row);

  if (error) {
    throw new Error(`camera_captures insert failed: ${error.message}`);
  }

  console.log(`✅ Camera saved | user=${event.user}`);
}

module.exports = { handleTrack };