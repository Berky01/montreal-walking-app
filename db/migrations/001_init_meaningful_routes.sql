CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS cities (
  id text PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  region text NOT NULL,
  country text NOT NULL,
  locale text NOT NULL,
  timezone text NOT NULL,
  center geography(Point, 4326) NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS places (
  id text PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  city_id text NOT NULL REFERENCES cities(id),
  name text NOT NULL,
  category text NOT NULL,
  area text NOT NULL,
  coordinates geography(Point, 4326) NOT NULL,
  content_status text NOT NULL DEFAULT 'draft',
  source_quality text NOT NULL DEFAULT 'draft',
  body jsonb NOT NULL DEFAULT '{}'::jsonb,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  media jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_reviewed_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS routes (
  id text PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  city_id text NOT NULL REFERENCES cities(id),
  title text NOT NULL,
  area text NOT NULL,
  distance_km numeric(6,2) NOT NULL,
  duration_min integer NOT NULL,
  difficulty text NOT NULL,
  route_type text NOT NULL,
  pace text NOT NULL,
  content_status text NOT NULL DEFAULT 'draft',
  source_quality text NOT NULL DEFAULT 'draft',
  qa_score integer NOT NULL DEFAULT 0 CHECK (qa_score >= 0 AND qa_score <= 100),
  geometry geometry(LineString, 4326) NOT NULL,
  body jsonb NOT NULL DEFAULT '{}'::jsonb,
  stops jsonb NOT NULL DEFAULT '[]'::jsonb,
  qa_status jsonb NOT NULL DEFAULT '{}'::jsonb,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  media jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_reviewed_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS issue_reports (
  id text PRIMARY KEY,
  route_slug text,
  place_slug text,
  category text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS places_coordinates_gix ON places USING gist (coordinates);
CREATE INDEX IF NOT EXISTS routes_geometry_gix ON routes USING gist (geometry);
CREATE INDEX IF NOT EXISTS routes_city_status_idx ON routes (city_id, content_status);
CREATE INDEX IF NOT EXISTS places_city_status_idx ON places (city_id, content_status);
