CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  team        VARCHAR(100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resource_categories (
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS resources (
  id           SERIAL PRIMARY KEY,
  category_id  INTEGER NOT NULL REFERENCES resource_categories(id),
  name         VARCHAR(150) NOT NULL UNIQUE,
  description  TEXT,
  location     VARCHAR(150),
  capacity     INTEGER CHECK (capacity IS NULL OR capacity > 0),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reservations (
  id            SERIAL PRIMARY KEY,
  resource_id   INTEGER NOT NULL REFERENCES resources(id),
  user_id       INTEGER NOT NULL REFERENCES users(id),
  title         VARCHAR(200) NOT NULL,
  notes         TEXT,
  start_time    TIMESTAMPTZ NOT NULL,
  end_time      TIMESTAMPTZ NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'confirmed'
                CHECK (status IN ('confirmed', 'cancelled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at  TIMESTAMPTZ,
  CONSTRAINT valid_time_range CHECK (end_time > start_time),

  CONSTRAINT no_overlapping_reservations EXCLUDE USING gist (
    resource_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  ) WHERE (status = 'confirmed')
);

CREATE INDEX IF NOT EXISTS idx_reservations_resource_start ON reservations (resource_id, start_time);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations (user_id);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources (category_id);
