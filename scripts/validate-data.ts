import { placeTrustRecords } from '../src/data/placeTrustData';
import type { PlaceSource, PlaceTrustRecord } from '../src/lib/content-trust';

const validVerificationStatuses = new Set(['verified', 'needs_review', 'draft']);
const validSourceQualityStates = new Set(['verified', 'needs_review', 'draft']);
const validSourceTypes = new Set(['official', 'open_data', 'editorial', 'field_note']);

const errors: string[] = [];

function requireText(value: string | undefined, label: string) {
  if (!value || !value.trim()) {
    errors.push(`${label} is required`);
  }
}

function requireIsoDate(value: string | undefined, label: string) {
  requireText(value, label);
  if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    errors.push(`${label} must use YYYY-MM-DD`);
  }
}

function validateSource(place: PlaceTrustRecord, source: PlaceSource) {
  const sourcePrefix = `${place.slug} source ${source.id}`;
  requireText(source.id, `${sourcePrefix} id`);
  requireText(source.title, `${sourcePrefix} title`);
  requireText(source.publisher, `${sourcePrefix} publisher`);
  requireText(source.url, `${sourcePrefix} url`);
  requireText(source.license, `${sourcePrefix} license`);
  requireText(source.attribution, `${sourcePrefix} attribution`);
  requireIsoDate(source.accessedAt, `${sourcePrefix} accessedAt`);
  requireIsoDate(source.lastCheckedAt, `${sourcePrefix} lastCheckedAt`);

  if (!validSourceTypes.has(source.type)) {
    errors.push(`${sourcePrefix} has unsupported type ${source.type}`);
  }

  if (!validVerificationStatuses.has(source.reliability)) {
    errors.push(`${sourcePrefix} has unsupported reliability ${source.reliability}`);
  }
}

for (const [key, place] of Object.entries(placeTrustRecords)) {
  const placePrefix = `place ${key}`;
  requireText(place.slug, `${placePrefix} slug`);
  requireText(place.name, `${placePrefix} name`);
  requireText(place.area, `${placePrefix} area`);
  requireText(place.summary, `${placePrefix} summary`);
  requireText(place.reportCorrectionHref, `${placePrefix} reportCorrectionHref`);
  requireText(place.linkedContentBlock, `${placePrefix} linkedContentBlock`);
  requireIsoDate(place.lastReviewedAt, `${placePrefix} lastReviewedAt`);

  if (key !== place.slug) {
    errors.push(`${placePrefix} key must match slug`);
  }

  if (!validVerificationStatuses.has(place.verificationStatus)) {
    errors.push(`${placePrefix} has unsupported verificationStatus ${place.verificationStatus}`);
  }

  if (!validSourceQualityStates.has(place.sourceQuality)) {
    errors.push(`${placePrefix} has unsupported sourceQuality ${place.sourceQuality}`);
  }

  if (!Number.isFinite(place.sourceQualityScore) || place.sourceQualityScore < 0 || place.sourceQualityScore > 100) {
    errors.push(`${placePrefix} sourceQualityScore must be 0-100`);
  }

  if (!place.sources.length) {
    errors.push(`${placePrefix} needs at least one source`);
  }

  for (const source of place.sources) {
    validateSource(place, source);
  }
}

if (errors.length) {
  console.error(`Source trust data validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${Object.keys(placeTrustRecords).length} source trust place records.`);
}
