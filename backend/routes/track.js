// routes/track.js
// ─────────────────────────────────────────────────────────────────────────────
// Express router for tracking endpoints.
// Currently exposes: POST /track
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const router = express.Router();
const { handleTrack } = require("../controllers/trackController");

// POST /track — accepts activity and screenshot events from the Electron agent
router.post("/", handleTrack);

module.exports = router;
