// routes/dashboard.js
// ─────────────────────────────────────────────────────────────────────────────
// Dashboard read-only routes. Mount in index.js as:
//   app.use("/dashboard", require("./routes/dashboard"));
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const router  = express.Router();
const {
  getSummary,
  getAppUsage,
  getActivityTimeline,
  getScreenshots,
  getCamera,
} = require("../controllers/dashboardController");

// GET /dashboard/summary/:user
router.get("/summary/:user", getSummary);

// GET /dashboard/app-usage/:user
router.get("/app-usage/:user", getAppUsage);

// GET /dashboard/activity-timeline/:user
router.get("/activity-timeline/:user", getActivityTimeline);

// GET /dashboard/screenshots/:user
router.get("/screenshots/:user", getScreenshots);

// GET /dashboard/camera/:user
router.get("/camera/:user", getCamera);

module.exports = router;
