CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS city_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bounds JSONB NOT NULL,
  center GEOGRAPHY(POINT, 4326) NOT NULL,
  default_walking_speed_mps NUMERIC NOT NULL,
  default_step_length_meters NUMERIC NOT NULL,
  avoid_road_classes TEXT[] NOT NULL DEFAULT '{}',
  mood_weights JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS poi_sources (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_license TEXT NOT NULL,
  import_timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pois (
  id TEXT PRIMARY KEY,
  city_id TEXT NOT NULL REFERENCES city_profiles(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  coordinate GEOGRAPHY(POINT, 4326) NOT NULL,
  source TEXT NOT NULL,
  source_osm_id TEXT,
  moods TEXT[] NOT NULL DEFAULT '{}',
  interest_tags TEXT[] NOT NULL DEFAULT '{}',
  computed_route_value NUMERIC NOT NULL DEFAULT 0,
  curated_route_value NUMERIC,
  opening_hours TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  last_imported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pois_coordinate_idx ON pois USING gist (coordinate);
CREATE INDEX IF NOT EXISTS pois_city_category_idx ON pois (city_id, category);

CREATE TABLE IF NOT EXISTS route_requests (
  id TEXT PRIMARY KEY,
  city_id TEXT NOT NULL REFERENCES city_profiles(id),
  start_label TEXT NOT NULL,
  start_coordinate GEOGRAPHY(POINT, 4326) NOT NULL,
  step_goal INTEGER NOT NULL,
  time_goal_minutes INTEGER NOT NULL,
  mood TEXT NOT NULL,
  interests TEXT[] NOT NULL,
  route_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS route_candidates (
  id TEXT PRIMARY KEY,
  route_request_id TEXT REFERENCES route_requests(id),
  geometry JSONB NOT NULL,
  distance_meters INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  estimated_steps INTEGER NOT NULL,
  score INTEGER NOT NULL,
  score_breakdown JSONB NOT NULL,
  explanation TEXT NOT NULL,
  provider TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS route_pois (
  route_candidate_id TEXT REFERENCES route_candidates(id),
  poi_id TEXT REFERENCES pois(id),
  sort_order INTEGER NOT NULL,
  PRIMARY KEY (route_candidate_id, poi_id)
);

CREATE TABLE IF NOT EXISTS route_feedback (
  id TEXT PRIMARY KEY,
  route_candidate_id TEXT NOT NULL,
  labels TEXT[] NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
