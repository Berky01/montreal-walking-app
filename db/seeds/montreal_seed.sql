INSERT INTO cities (id, slug, name, region, country, locale, timezone, center, status)
VALUES (
  'montreal',
  'montreal',
  'Montreal',
  'Quebec',
  'Canada',
  'en-CA',
  'America/Toronto',
  ST_SetSRID(ST_MakePoint(-73.5674, 45.5019), 4326)::geography,
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- Curated place and route seed export is intentionally not auto-generated here.
-- Keep DATA_SOURCE=mock until the importer is wired to upsert reviewed content.
-- Run `npm run validate:data` before producing a future SQL seed from TypeScript data.
