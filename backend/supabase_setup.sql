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

  -- ── Migration: dwell time on focused app (ms), sent with each activity sample ──
  ALTER TABLE activity_logs
    ADD COLUMN IF NOT EXISTS duration BIGINT;


    -- claude --------------------------------------------------------------------- ---------------------------------------- 
    -- ─────────────────────────────────────────────────────────────────────────────
-- WorkTracker — Supabase Setup SQL (Full Clean Version)
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- Safe to run fresh — uses IF NOT EXISTS / ON CONFLICT DO NOTHING everywhere
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
  duration   BIGINT,
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

CREATE INDEX IF NOT EXISTS idx_camera_user_timestamp
  ON camera_captures (user_id, timestamp);


-- ── Table 4: device_profiles ──────────────────────────────────────────────────
-- Stores one row per device per user. Upserted on every app launch.
-- Tracks OS, hostname, device_id, and last_seen timestamp.
CREATE TABLE IF NOT EXISTS device_profiles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL,
  device_id   TEXT        NOT NULL,
  os          TEXT,
  hostname    TEXT,
  last_seen   TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One row per (user_id, device_id) pair — upserted on conflict
  CONSTRAINT uq_device UNIQUE (user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_device_user
  ON device_profiles (user_id);


-- ── Table 5: heartbeats ───────────────────────────────────────────────────────
-- Lightweight alive signal. Stored so you can see when the agent was running.
-- One row per heartbeat ping — kept for 7 days via a cron if desired.
CREATE TABLE IF NOT EXISTS heartbeats (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL,
  timestamp  TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_heartbeat_user_time
  ON heartbeats (user_id, timestamp DESC);


-- ── Row Level Security (RLS) ──────────────────────────────────────────────────
ALTER TABLE activity_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenshots      ENABLE ROW LEVEL SECURITY;
ALTER TABLE camera_captures  ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE heartbeats       ENABLE ROW LEVEL SECURITY;

-- Drop policies first so this script is safe to re-run
DO $$ BEGIN
  DROP POLICY IF EXISTS "service_role_all_activity"   ON activity_logs;
  DROP POLICY IF EXISTS "service_role_all_screenshots" ON screenshots;
  DROP POLICY IF EXISTS "service_role_all_camera"     ON camera_captures;
  DROP POLICY IF EXISTS "service_role_all_devices"    ON device_profiles;
  DROP POLICY IF EXISTS "service_role_all_heartbeats" ON heartbeats;
END $$;

CREATE POLICY "service_role_all_activity"
  ON activity_logs FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_screenshots"
  ON screenshots FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_camera"
  ON camera_captures FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_devices"
  ON device_profiles FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_heartbeats"
  ON heartbeats FOR ALL USING (true) WITH CHECK (true);


-- ── Storage buckets ───────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('screenshots', 'screenshots', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('camera-captures', 'camera-captures', true)
ON CONFLICT (id) DO NOTHING;

-- ── Migration: activity_logs column rename + duration (run on existing DBs) ──
-- Renames legacy "switch" → app_switched only if that column still exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'activity_logs'
      AND column_name = 'switch'
  ) THEN
    ALTER TABLE activity_logs RENAME COLUMN "switch" TO app_switched;
  END IF;
END $$;

ALTER TABLE activity_logs
  ADD COLUMN IF NOT EXISTS duration BIGINT;