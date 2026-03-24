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



-------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_screenshots_user_time
  ON screenshots (user_id, timestamp DESC);


-- ── Table 3: camera_captures ──────────────────────────────────────────────────
-- Stores webcam frames captured in sync with screenshots.
-- timestamp matches the paired screenshots row — join on (user_id, timestamp).
-- face_present / gaze_on_screen / multiple_faces are reserved for a future
-- ML processing pipeline and are NULL until that pipeline runs.
CREATE TABLE IF NOT EXISTS camera_captures (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT        NOT NULL,
  image_url       TEXT        NOT NULL,
  timestamp       TIMESTAMPTZ NOT NULL,
  face_present    BOOLEAN     DEFAULT NULL,
  gaze_on_screen  BOOLEAN     DEFAULT NULL,
  multiple_faces  BOOLEAN     DEFAULT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_camera_user_time
  ON camera_captures (user_id, timestamp DESC);

-- Index for joining camera_captures with screenshots on (user_id, timestamp)
CREATE INDEX IF NOT EXISTS idx_camera_user_timestamp
  ON camera_captures (user_id, timestamp);


-- ── Row Level Security (RLS) ──────────────────────────────────────────────────
-- Backend uses the service_role key so RLS won't block inserts.
-- Enabled as a safety practice for future anon/user-facing queries.

ALTER TABLE activity_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenshots      ENABLE ROW LEVEL SECURITY;
ALTER TABLE camera_captures  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_activity"
  ON activity_logs FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_screenshots"
  ON screenshots FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_camera"
  ON camera_captures FOR ALL
  USING (true) WITH CHECK (true);


-- ── Storage buckets ───────────────────────────────────────────────────────────
-- Creates both storage buckets if they don't already exist.
-- Both are public so image_url links work without auth headers.
-- If you prefer private buckets, set public = false and generate signed URLs
-- in upload.js instead of using getPublicUrl().

INSERT INTO storage.buckets (id, name, public)
VALUES ('screenshots', 'screenshots', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('camera-captures', 'camera-captures', true)
ON CONFLICT (id) DO NOTHING;