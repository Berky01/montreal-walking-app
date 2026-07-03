export type VerificationStatus = 'verified' | 'needs_review' | 'draft';
export type SourceQuality = 'verified' | 'needs_review' | 'draft';
export type PlaceSourceType = 'official' | 'open_data' | 'editorial' | 'field_note';
export type SourceReliability = 'verified' | 'needs_review' | 'draft';
export type MediaApprovalStatus = 'approved' | 'needs_review' | 'rejected';
export type PlaceMediaKind = 'current' | 'historical';

export interface PlaceSource {
  id: string;
  title: string;
  type: PlaceSourceType;
  publisher: string;
  url: string;
  license: string;
  attribution: string;
  reliability: SourceReliability;
  accessedAt: string;
  lastCheckedAt: string;
  linkedContentBlock?: string;
}

export interface PlaceMedia {
  id: string;
  title: string;
  alt: string;
  kind: PlaceMediaKind;
  approvalStatus: MediaApprovalStatus;
  sourceUrl: string;
  publisher: string;
  creator: string;
  license: string;
  attribution: string;
  lastCheckedAt: string;
}

export interface PlaceTrustRecord {
  slug: string;
  name: string;
  area: string;
  summary: string;
  verificationStatus: VerificationStatus;
  sourceQuality: SourceQuality;
  sourceQualityScore: number;
  lastReviewedAt: string;
  reportCorrectionHref: string;
  linkedContentBlock: string;
  sources: PlaceSource[];
  media: PlaceMedia[];
}

export interface TrustedLiveRoute {
  slug: string;
  title: string;
  distanceKm: number;
  durationMin: number;
  currentStopSlug: string;
}

export interface PlaceTrustSummary {
  verificationLabel: string;
  qualityStateLabel: string;
  sourceQualityLabel: string;
  lastReviewedLabel: string;
  mediaAttributionSummary: string;
  reliabilityLabel: string;
}

export interface ThenNowPair {
  hasPair: boolean;
  thenMedia?: PlaceMedia;
  nowMedia?: PlaceMedia;
  emptyState?: string;
}

export interface LiveRouteTrustMetrics {
  steps: {
    value: string;
    sourceLabel: string;
  };
  pace: string;
  currentStop: {
    name: string;
    sourceCheckedLabel: string;
    reviewDateLabel: string;
  };
}

export function getPlaceSourceTrustSummary(place: PlaceTrustRecord): PlaceTrustSummary {
  const approvedMedia = place.media.filter((item) => item.approvalStatus === 'approved');
  const publishers = [...new Set(approvedMedia.map((item) => item.publisher))];
  const primarySource = place.sources[0];

  return {
    verificationLabel: verificationLabel(place.verificationStatus),
    qualityStateLabel: qualityStateLabel(place.sourceQuality),
    sourceQualityLabel: `Source quality ${place.sourceQualityScore}/100`,
    lastReviewedLabel: normalizeDate(place.lastReviewedAt),
    mediaAttributionSummary: publishers.length ? `Media attribution: ${publishers.join(', ')}` : 'Media attribution: pending approved media',
    reliabilityLabel: primarySource ? reliabilityLabel(primarySource.reliability) : 'Review needed',
  };
}

export function getApprovedCurrentMedia(place: PlaceTrustRecord): PlaceMedia[] {
  return place.media.filter((item) => item.kind === 'current' && item.approvalStatus === 'approved');
}

export function getApprovedHistoricalMedia(place: PlaceTrustRecord): PlaceMedia[] {
  return place.media.filter((item) => item.kind === 'historical' && item.approvalStatus === 'approved');
}

export function getThenNowPair(place: PlaceTrustRecord): ThenNowPair {
  const thenMedia = getApprovedHistoricalMedia(place)[0];
  const nowMedia = getApprovedCurrentMedia(place)[0];

  if (!thenMedia || !nowMedia) {
    return {
      hasPair: false,
      thenMedia,
      nowMedia,
      emptyState: 'No verified historical comparison yet.',
    };
  }

  return {
    hasPair: true,
    thenMedia,
    nowMedia,
  };
}

export function buildLiveRouteTrustMetrics(route: TrustedLiveRoute, places?: Record<string, PlaceTrustRecord>): LiveRouteTrustMetrics {
  const place = places?.[route.currentStopSlug] ?? fallbackPlaceFor(route.currentStopSlug);
  const summary = getPlaceSourceTrustSummary(place);

  return {
    steps: {
      value: formatNumber(Math.round(route.distanceKm * 1310)),
      sourceLabel: 'Estimated from planned walking distance',
    },
    pace: `${Math.max(1, Math.round(route.durationMin / Math.max(route.distanceKm, 0.1)))} min/km`,
    currentStop: {
      name: place.name,
      sourceCheckedLabel: summary.verificationLabel === 'Verified' ? 'Source checked' : summary.verificationLabel,
      reviewDateLabel: summary.lastReviewedLabel,
    },
  };
}

export function sourceTypeLabel(type: PlaceSourceType): string {
  return type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function verificationLabel(status: VerificationStatus): string {
  if (status === 'verified') return 'Verified';
  if (status === 'needs_review') return 'Needs review';
  return 'Draft';
}

function qualityStateLabel(status: SourceQuality): string {
  if (status === 'verified') return 'Verified';
  if (status === 'needs_review') return 'Needs review';
  return 'Draft';
}

function reliabilityLabel(reliability: SourceReliability): string {
  if (reliability === 'verified') return 'Verified';
  if (reliability === 'draft') return 'Draft';
  return 'Review needed';
}

function normalizeDate(value: string): string {
  const match = value.match(/^\d{4}-\d{2}-\d{2}/);
  return match?.[0] ?? value;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-CA').format(value);
}

function fallbackPlaceFor(slug: string): PlaceTrustRecord {
  return {
    slug,
    name: slug,
    area: 'Montreal',
    summary: 'Source review pending.',
    verificationStatus: 'draft',
    sourceQuality: 'draft',
    sourceQualityScore: 0,
    lastReviewedAt: '2026-07-01',
    reportCorrectionHref: `/report-issue?place=${slug}`,
    linkedContentBlock: 'Pending source review',
    sources: [],
    media: [],
  };
}
