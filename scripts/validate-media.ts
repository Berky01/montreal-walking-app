import { placeTrustRecords } from '../src/data/placeTrustData';

const validApprovalStatuses = new Set(['approved', 'needs_review', 'rejected']);
const validKinds = new Set(['current', 'historical']);
const errors: string[] = [];
let approvedCurrentCount = 0;
let approvedHistoricalCount = 0;

for (const place of Object.values(placeTrustRecords)) {
  const approvedCurrent = place.media.filter((item) => item.kind === 'current' && item.approvalStatus === 'approved');
  const approvedHistorical = place.media.filter((item) => item.kind === 'historical' && item.approvalStatus === 'approved');
  approvedCurrentCount += approvedCurrent.length;
  approvedHistoricalCount += approvedHistorical.length;

  if (!approvedCurrent.length) {
    errors.push(`${place.slug} needs at least one approved current media item`);
  }

  for (const media of place.media) {
    const mediaPrefix = `${place.slug} media ${media.id}`;
    if (!media.id.trim()) errors.push(`${mediaPrefix} id is required`);
    if (!media.title.trim()) errors.push(`${mediaPrefix} title is required`);
    if (!media.alt.trim()) errors.push(`${mediaPrefix} alt is required`);
    if (!media.sourceUrl.trim()) errors.push(`${mediaPrefix} sourceUrl is required`);
    if (!media.publisher.trim()) errors.push(`${mediaPrefix} publisher is required`);
    if (!media.creator.trim()) errors.push(`${mediaPrefix} creator is required`);
    if (!media.license.trim()) errors.push(`${mediaPrefix} license is required`);
    if (!media.attribution.trim()) errors.push(`${mediaPrefix} attribution is required`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(media.lastCheckedAt)) {
      errors.push(`${mediaPrefix} lastCheckedAt must use YYYY-MM-DD`);
    }
    if (!validApprovalStatuses.has(media.approvalStatus)) {
      errors.push(`${mediaPrefix} has unsupported approvalStatus ${media.approvalStatus}`);
    }
    if (!validKinds.has(media.kind)) {
      errors.push(`${mediaPrefix} has unsupported kind ${media.kind}`);
    }
  }

  if (place.verificationStatus === 'verified' && !approvedCurrent.length) {
    errors.push(`${place.slug} is verified but lacks approved current media`);
  }
}

if (!approvedHistoricalCount) {
  errors.push('At least one approved historical media item is required for then-now coverage');
}

if (errors.length) {
  console.error(`Media trust validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${approvedCurrentCount} approved current media item(s) and ${approvedHistoricalCount} approved historical media item(s).`);
}
