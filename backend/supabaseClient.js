// supabaseClient.js
// ─────────────────────────────────────────────────────────────────────────────
// Initializes and exports a single Supabase client instance.
// Used by all modules that need database or storage access.
// ─────────────────────────────────────────────────────────────────────────────

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("[Supabase] ERROR: SUPABASE_URL or SUPABASE_KEY is missing from environment.");
  process.exit(1); // Fatal — app cannot work without these
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;
