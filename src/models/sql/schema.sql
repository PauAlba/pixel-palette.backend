-- ============================================================
-- Pixel Palette — PostgreSQL DDL
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── users ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ─── profiles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  username           TEXT        NOT NULL UNIQUE,
  display_name       TEXT,
  bio                TEXT,
  mood               TEXT,
  avatar_url         TEXT,
  role               TEXT        NOT NULL DEFAULT 'artist',
  background_pattern TEXT,
  custom_css         JSONB,
  music_url          TEXT,
  theme_enabled      BOOLEAN     NOT NULL DEFAULT false,
  favorite_artists   TEXT[]      NOT NULL DEFAULT '{}',
  visitor_count      INTEGER     NOT NULL DEFAULT 0,
  created_at         TIMESTAMP   NOT NULL DEFAULT now(),
  updated_at         TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles (username);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id  ON profiles (user_id);

-- ─── posts ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id  UUID      NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  content    TEXT,
  image_url  TEXT,
  title      TEXT,
  post_type  TEXT      NOT NULL DEFAULT 'text',
  tags       TEXT[]    NOT NULL DEFAULT '{}',
  is_featured BOOLEAN  NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_author_id  ON posts (author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);

-- ─── comments ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID      NOT NULL REFERENCES posts    (id) ON DELETE CASCADE,
  author_id  UUID      NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  content    TEXT      NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments (post_id);

-- ─── likes ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS likes (
  id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID      NOT NULL REFERENCES posts    (id) ON DELETE CASCADE,
  user_id    UUID      NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes (post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes (user_id);

-- ─── followers ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS followers (
  id           UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  UUID      NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  following_id UUID      NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  created_at   TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_followers_follower_id  ON followers (follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers (following_id);

-- ─── guestbook_entries ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guestbook_entries (
  id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID      NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  author_id  UUID      NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  message    TEXT      NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guestbook_profile_id ON guestbook_entries (profile_id);
CREATE INDEX IF NOT EXISTS idx_guestbook_author_id  ON guestbook_entries (author_id);
