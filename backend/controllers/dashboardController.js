// controllers/dashboardController.js
// ─────────────────────────────────────────────────────────────────────────────
// Dashboard APIs — read-only aggregated data for frontend visualization.
// Does NOT touch any tracking logic.
// ─────────────────────────────────────────────────────────────────────────────

const supabase = require("../supabaseClient");

// ── Helper: safe duration sum ─────────────────────────────────────────────────
function sumDurations(rows) {
  return rows.reduce((acc, r) => acc + (Number(r.duration) || 0), 0);
}

// ── API 1: GET /dashboard/summary/:user ──────────────────────────────────────
async function getSummary(req, res) {
  const { user } = req.params;

  try {
    // Fetch all activity logs for this user
    const { data, error } = await supabase
      .from("activity_logs")
      .select("idle, duration, app_switched, timestamp")
      .eq("user_id", user);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
      return res.status(200).json({
        totalActiveTime:    0,
        totalIdleTime:      0,
        productivityScore:  0,
        appSwitchCount:     0,
        lastSeen:           null,
      });
    }

    const activeRows = data.filter((r) => !r.idle);
    const idleRows   = data.filter((r) =>  r.idle);

    const totalActiveTime = sumDurations(activeRows); // ms
    const totalIdleTime   = sumDurations(idleRows);   // ms
    const appSwitchCount  = data.filter((r) => r.app_switched).length;

    // Productivity score formula — normalized 0–100
    // Raw = (active * 2) - (idle * 1.5) - (switches * 0.5)
    // We work in seconds to keep numbers manageable
    const activeSec  = totalActiveTime  / 1000;
    const idleSec    = totalIdleTime    / 1000;
    const rawScore   = activeSec * 2 - idleSec * 1.5 - appSwitchCount * 0.5;

    // Normalize: assume 8-hour workday = 28800s max active → max raw = 57600
    const MAX_RAW = 57600;
    const productivityScore = Math.min(
      100,
      Math.max(0, Math.round((rawScore / MAX_RAW) * 100))
    );

    // Latest timestamp
    const lastSeen = data
      .map((r) => r.timestamp)
      .sort()
      .at(-1) ?? null;

    return res.status(200).json({
      totalActiveTime,
      totalIdleTime,
      productivityScore,
      appSwitchCount,
      lastSeen,
    });

  } catch (err) {
    console.error("[Dashboard] getSummary failed:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── API 2: GET /dashboard/app-usage/:user ────────────────────────────────────
async function getAppUsage(req, res) {
  const { user } = req.params;

  try {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("app, duration")
      .eq("user_id", user)
      .eq("idle", false); // Only count active time per app

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return res.status(200).json([]);

    // Group by app and sum durations
    const appMap = {};
    for (const row of data) {
      const key = row.app || "Unknown";
      appMap[key] = (appMap[key] || 0) + (Number(row.duration) || 0);
    }

    const result = Object.entries(appMap)
      .map(([app, totalTime]) => ({ app, totalTime }))
      .sort((a, b) => b.totalTime - a.totalTime); // Highest first

    return res.status(200).json(result);

  } catch (err) {
    console.error("[Dashboard] getAppUsage failed:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── API 3: GET /dashboard/activity-timeline/:user ────────────────────────────
async function getActivityTimeline(req, res) {
  const { user } = req.params;

  try {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("timestamp, app, title, idle, duration, app_switched")
      .eq("user_id", user)
      .order("timestamp", { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);

    const result = (data || []).map((r) => ({
      time:         r.timestamp,
      app:          r.app,
      title:        r.title,
      idle:         r.idle,
      duration:     r.duration,
      app_switched: r.app_switched,
    }));

    return res.status(200).json(result);

  } catch (err) {
    console.error("[Dashboard] getActivityTimeline failed:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── API 4: GET /dashboard/screenshots/:user ───────────────────────────────────
async function getScreenshots(req, res) {
  const { user } = req.params;

  try {
    const { data, error } = await supabase
      .from("screenshots")
      .select("image_url, timestamp")
      .eq("user_id", user)
      .order("timestamp", { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);
    return res.status(200).json(data || []);

  } catch (err) {
    console.error("[Dashboard] getScreenshots failed:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── API 5: GET /dashboard/camera/:user ───────────────────────────────────────
async function getCamera(req, res) {
  const { user } = req.params;

  try {
    const { data, error } = await supabase
      .from("camera_captures")
      .select("image_url, timestamp")
      .eq("user_id", user)
      .order("timestamp", { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);
    return res.status(200).json(data || []);

  } catch (err) {
    console.error("[Dashboard] getCamera failed:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getSummary,
  getAppUsage,
  getActivityTimeline,
  getScreenshots,
  getCamera,
};
