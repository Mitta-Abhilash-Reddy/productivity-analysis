-- ─────────────────────────────────────────────────────────────────────────────
-- WorkTracker — Supabase Setup SQL
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────


-- ── Table 1: activity_logs ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL,
  app        TEXT        NOT NULL,
  title      TEXT        NOT NULL,
  idle       BOOLEAN     NOT NULL DEFAULT false,
  clicks     INTEGER     NOT NULL DEFAULT 0,
  movement   BOOLEAN     NOT NULL DEFAULT false,
  switch     BOOLEAN     NOT NULL DEFAULT false,
  timestamp  TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast queries by user and time range
CREATE INDEX IF NOT EXISTS idx_activity_user_time
  ON activity_logs (user_id, timestamp DESC);


-- ── Table 2: screenshots ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS screenshots (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL,
  image_url  TEXT        NOT NULL,
  timestamp  TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast queries by user and time range
CREATE INDEX IF NOT EXISTS idx_screenshots_user_time
  ON screenshots (user_id, timestamp DESC);


-- ── Row Level Security (RLS) ──────────────────────────────────────────────────
-- We're using the service_role key on the backend, so RLS won't block inserts.
-- Enable RLS anyway as a safety practice for future anon/user access.

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenshots   ENABLE ROW LEVEL SECURITY;

-- Allow the service role full access (backend uses service role key)
CREATE POLICY "service_role_all_activity"
  ON activity_logs FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_all_screenshots"
  ON screenshots FOR ALL
  USING (true)
  WITH CHECK (true);
