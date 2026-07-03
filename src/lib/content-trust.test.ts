import { describe, expect, it } from 'vitest';
import { placeTrustRecords, trustedLiveRoutes } from '../data/placeTrustData';
import {
  buildLiveRouteTrustMetrics,
  getApprovedCurrentMedia,
  getApprovedHistoricalMedia,
  getPlaceSourceTrustSummary,
  getThenNowPair,
} from './content-trust';

describe('content trust utilities', () => {
  it('summarizes verified POI source trust and media attribution', () => {
    const summary = getPlaceSourceTrustSummary(placeTrustRecords['place-darmes']);

    expect(summary.verificationLabel).toBe('Verified');
    expect(summary.sourceQualityLabel).toBe('Source quality 94/100');
    expect(summary.lastReviewedLabel).toBe('2026-07-02');
    expect(summary.mediaAttributionSummary).toContain('Wikimedia Commons');
  });

  it('summarizes draft and review-needed POI trust states', () => {
    const summary = getPlaceSourceTrustSummary(placeTrustRecords['saint-joseph-oratory']);

    expect(summary.verificationLabel).toBe('Needs review');
    expect(summary.sourceQualityLabel).toBe('Source quality 62/100');
    expect(summary.reliabilityLabel).toBe('Review needed');
  });

  it('separates approved current and historical media', () => {
    expect(getApprovedCurrentMedia(placeTrustRecords['place-darmes']).map((item) => item.id)).toContain('place-darmes-current');
    expect(getApprovedHistoricalMedia(placeTrustRecords['place-darmes']).map((item) => item.id)).toContain('place-darmes-archive');
  });

  it('builds paired then-now media when approved current and historical records exist', () => {
    const pair = getThenNowPair(placeTrustRecords['place-darmes']);

    expect(pair.hasPair).toBe(true);
    expect(pair.thenMedia?.id).toBe('place-darmes-archive');
    expect(pair.nowMedia?.id).toBe('place-darmes-current');
  });

  it('returns the required then-now empty state without paired media', () => {
    const pair = getThenNowPair(placeTrustRecords['saint-joseph-oratory']);

    expect(pair.hasPair).toBe(false);
    expect(pair.emptyState).toBe('No verified historical comparison yet.');
  });

  it('builds consistent live route steps, pace, current stop, and review labels', () => {
    for (const route of Object.values(trustedLiveRoutes)) {
      const metrics = buildLiveRouteTrustMetrics(route);

      expect(metrics.steps.value).toMatch(/\d/);
      expect(metrics.steps.sourceLabel).toBe('Estimated from planned walking distance');
      expect(metrics.pace).toMatch(/min\/km/);
      expect(metrics.currentStop.name.length).toBeGreaterThan(0);
      expect(metrics.currentStop.sourceCheckedLabel).toMatch(/Source checked|Needs review|Draft/);
      expect(metrics.currentStop.reviewDateLabel).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
