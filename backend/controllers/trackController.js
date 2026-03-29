const supabase = require("../supabaseClient");
const { resolveImageUrl } = require("../utils/upload");

/** Log full Supabase error (never swallow silently). */
function logSupabaseInsertError(context, error) {
  console.error(`[Supabase] ${context} — insert failed`);
  console.error(error);
  try {
    console.error(JSON.stringify(error, null, 2));
  } catch {
    // ignore
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
async function handleTrack(req, res) {
  const event = req.body;

  if (!event || !event.type || !event.user || !event.timestamp) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: type, user, timestamp.",
    });
  }

  console.log("📩 EVENT:", event.type, "| user:", event.user);

  try {
    switch (event.type) {
      case "activity":   await handleActivity(event);   break;
      case "screenshot": await handleScreenshot(event); break;
      case "camera":     await handleCamera(event);     break;
      case "heartbeat":  await handleHeartbeat(event);  break;
      case "system":     await handleSystem(event);     break;
      default:
        console.warn("⚠️ Unknown event type:", event.type);
    }
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error(`❌ Error handling "${event.type}":`, err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── Activity handler ──────────────────────────────────────────────────────────
async function handleActivity(event) {
  if (!event.app || !event.title) {
    console.warn("⚠️ Skipping activity — missing app/title");
    return;
  }

  const duration =
    typeof event.duration === "number" && Number.isFinite(event.duration)
      ? Math.max(0, Math.floor(event.duration))
      : null;

  const row = {
    user_id:      event.user,
    app:          event.app,
    title:        event.title,
    idle:         event.idle ?? false,
    clicks:       event.mouse?.clicks ?? 0,
    movement:     event.mouse?.movement ?? false,
    app_switched: event.switch ?? false,
    duration:     duration,
    timestamp:    event.timestamp,
  };

  const { error } = await supabase.from("activity_logs").insert(row);
  if (error) {
    logSupabaseInsertError("activity_logs", error);
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
  const publicUrl = await resolveImageUrl(event.image_url, event.user);
  const { error } = await supabase.from("screenshots").insert({
    user_id:   event.user,
    image_url: publicUrl,
    timestamp: event.timestamp,
  });
  if (error) {
    logSupabaseInsertError("screenshots", error);
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
  const publicUrl = await resolveImageUrl(event.image_url, event.user, "camera-captures");
  const { error } = await supabase.from("camera_captures").insert({
    user_id:        event.user,
    image_url:      publicUrl,
    timestamp:      event.timestamp,
    face_present:   event.face_present   ?? null,
    gaze_on_screen: event.gaze_on_screen ?? null,
    multiple_faces: event.multiple_faces ?? null,
  });
  if (error) {
    logSupabaseInsertError("camera_captures", error);
    throw new Error(`camera_captures insert failed: ${error.message}`);
  }
  console.log(`✅ Camera saved | user=${event.user}`);
}

// ── Heartbeat handler ─────────────────────────────────────────────────────────
async function handleHeartbeat(event) {
  const { error } = await supabase.from("heartbeats").insert({
    user_id:   event.user,
    timestamp: event.timestamp,
  });
  if (error) {
    logSupabaseInsertError("heartbeats", error);
    console.warn(`⚠️ Heartbeat save failed (non-fatal): ${error.message}`);
    return;
  }
  console.log(`💓 Heartbeat saved | user=${event.user}`);
}

// ── System handler ────────────────────────────────────────────────────────────
async function handleSystem(event) {
  if (!event.device_id) {
    console.warn("⚠️ System event missing device_id — skipping.");
    return;
  }
  const { error } = await supabase.from("device_profiles").upsert(
    {
      user_id:   event.user,
      device_id: event.device_id,
      os:        event.os       ?? null,
      hostname:  event.hostname ?? null,
      last_seen: event.timestamp,
    },
    { onConflict: "user_id,device_id" }
  );
  if (error) {
    logSupabaseInsertError("device_profiles", error);
    throw new Error(`device_profiles upsert failed: ${error.message}`);
  }
  console.log(`✅ Device profile saved | user=${event.user} | device=${event.device_id}`);
}

// ── Common filter helper ──────────────────────────────────────────────────────
// Must await the Supabase query — the builder returns a Promise when awaited.
async function applyCommonFilters(query, req) {
  const { user_id, from, to, limit: limitRaw } = req.query;
  if (user_id) query = query.eq("user_id", user_id);
  if (from) query = query.gte("timestamp", from);
  if (to) query = query.lte("timestamp", to);
  const parsedLimit = Number(limitRaw);
  const safeLimit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 2000)
      : 500;

  const result = await query
    .order("timestamp", { ascending: false })
    .limit(safeLimit);
  return result;
}

// ── GET handlers ──────────────────────────────────────────────────────────────
async function getActivity(req, res) {
  try {
    const { data, error } = await applyCommonFilters(
      supabase.from("activity_logs").select("*"), req
    );
    if (error) throw new Error(error.message);
    return res.status(200).json(data || []);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function getScreenshots(req, res) {
  try {
    const { data, error } = await applyCommonFilters(
      supabase.from("screenshots").select("*"), req
    );
    if (error) throw new Error(error.message);
    return res.status(200).json(data || []);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function getCamera(req, res) {
  try {
    const { data, error } = await applyCommonFilters(
      supabase.from("camera_captures").select("*"), req
    );
    if (error) throw new Error(error.message);
    return res.status(200).json(data || []);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function getDevices(req, res) {
  try {
    let query = supabase.from("device_profiles").select("*");
    if (req.query.user_id) query = query.eq("user_id", req.query.user_id);
    query = query.order("last_seen", { ascending: false });
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return res.status(200).json(data || []);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function getHeartbeats(req, res) {
  try {
    const { data, error } = await applyCommonFilters(
      supabase.from("heartbeats").select("*"), req
    );
    if (error) throw new Error(error.message);
    return res.status(200).json(data || []);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  handleTrack,
  getActivity,
  getScreenshots,
  getCamera,
  getDevices,
  getHeartbeats,
};