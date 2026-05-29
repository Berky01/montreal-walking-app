import { describe, expect, it } from 'vitest';
import {
  assessCompetitorRisk,
  evaluateCustomerValidation,
  evaluateConciergeRouteTest,
  evaluateFakeDoor,
  rankConciergeRoutes,
  validateWalkRequest,
} from './strategy';
import type { Competitor, ConciergeRoute, WalkRequest } from './types';

describe('confidence gates', () => {
  it('passes customer validation only when usage, access, and payment signals clear the gate', () => {
    const result = evaluateCustomerValidation({
      totalParticipants: 20,
      monthlyIntentCount: 9,
      weeklyIntentCount: 5,
      earlyAccessCount: 6,
      paymentIntentCount: 4,
    });

    expect(result.status).toBe('pass');
    expect(result.metrics.monthlyIntentRate).toBe(45);
    expect(result.metrics.weeklyIntentRate).toBe(25);
    expect(result.recommendation).toContain('Proceed to concierge route testing');
  });

  it('blocks customer validation when repeat-use intent is too weak', () => {
    const result = evaluateCustomerValidation({
      totalParticipants: 20,
      monthlyIntentCount: 7,
      weeklyIntentCount: 3,
      earlyAccessCount: 8,
      paymentIntentCount: 5,
    });

    expect(result.status).toBe('fail');
    expect(result.missingCriteria).toEqual([
      '40%+ monthly-use intent',
      '20%+ weekly-use intent',
    ]);
  });

  it('passes the concierge route gate when people plan routes and request more', () => {
    const result = evaluateConciergeRouteTest({
      totalTesters: 12,
      completedOrPlannedCount: 7,
      requestedAnotherRouteCount: 4,
      fundamentalObjectionCount: 1,
    });

    expect(result.status).toBe('pass');
    expect(result.metrics.completionOrPlanningRate).toBe(58);
    expect(result.metrics.repeatRequestRate).toBe(33);
  });

  it('passes fake-door validation when conversion and generation intent clear thresholds', () => {
    const result = evaluateFakeDoor({
      visitors: 120,
      emailCaptures: 18,
      generateClicks: 38,
      repeatRequesterCount: 4,
    });

    expect(result.status).toBe('pass');
    expect(result.metrics.emailConversionRate).toBe(15);
    expect(result.metrics.generateClickRate).toBe(32);
  });
});

describe('walk request validation', () => {
  it('accepts a complete Montréal walk request', () => {
    const request: WalkRequest = {
      startLocation: 'Mile End',
      stepGoal: 8000,
      timeGoalMinutes: 70,
      mood: 'coffee',
      interests: ['cafes', 'architecture'],
      routeType: 'loop',
      email: 'walker@example.com',
    };

    expect(validateWalkRequest(request)).toEqual({ valid: true, errors: [] });
  });

  it('returns specific errors for incomplete fake-door submissions', () => {
    const request: WalkRequest = {
      startLocation: '',
      stepGoal: 900,
      timeGoalMinutes: 8,
      mood: 'scenic',
      interests: [],
      routeType: 'loop',
      email: 'not-an-email',
    };

    expect(validateWalkRequest(request)).toEqual({
      valid: false,
      errors: [
        'Add a Montréal starting point.',
        'Choose at least 1,500 steps.',
        'Choose at least 15 minutes.',
        'Pick at least one interest.',
        'Enter a valid email for early access.',
      ],
    });
  });
});

describe('route and competitor strategy', () => {
  const routes: ConciergeRoute[] = [
    {
      id: 'plateau-coffee',
      name: 'Plateau / Mile End coffee step loop',
      neighborhood: 'Plateau / Mile End',
      mood: 'coffee',
      interests: ['cafes', 'architecture'],
      stepEstimate: 7600,
      distanceKm: 5.7,
      timeMinutes: 68,
      poiCount: 8,
      whyNice: 'Quiet side streets, independent cafés, and residential architecture.',
      exportLabel: 'Open map draft',
    },
    {
      id: 'verdun-waterfront',
      name: 'Verdun waterfront route',
      neighborhood: 'Verdun',
      mood: 'scenic',
      interests: ['waterfront', 'parks'],
      stepEstimate: 9200,
      distanceKm: 6.9,
      timeMinutes: 82,
      poiCount: 6,
      whyNice: 'River views and long uninterrupted walking segments.',
      exportLabel: 'Open map draft',
    },
  ];

  it('ranks concierge routes by step fit first, then mood and interest fit', () => {
    const ranked = rankConciergeRoutes(routes, {
      startLocation: 'Mile End',
      stepGoal: 8000,
      timeGoalMinutes: 70,
      mood: 'coffee',
      interests: ['cafes'],
      routeType: 'loop',
      email: 'walker@example.com',
    });

    expect(ranked[0].id).toBe('plateau-coffee');
    expect(ranked[0].matchReasons).toContain('within 5% of your step goal');
    expect(ranked[0].matchReasons).toContain('matches the coffee mood');
  });

  it('keeps the wedge when competitors are strong on routing but weak on local taste', () => {
    const competitors: Competitor[] = [
      {
        name: 'LoopFast',
        loopGeneration: 'strong',
        stepTimeDistance: 'strong',
        cityWalkingQuality: 'medium',
        poiUsefulness: 'weak',
        regenerationControls: 'medium',
        mobileWeb: 'weak',
        pricing: 'Freemium',
        userComplaints: ['generic loops', 'bad POIs'],
      },
      {
        name: 'TrailPlanner',
        loopGeneration: 'strong',
        stepTimeDistance: 'medium',
        cityWalkingQuality: 'weak',
        poiUsefulness: 'medium',
        regenerationControls: 'medium',
        mobileWeb: 'medium',
        pricing: 'Subscription',
        userComplaints: ['hike-first UX'],
      },
    ];

    expect(assessCompetitorRisk(competitors).decision).toBe('keep-wedge');
  });
});
