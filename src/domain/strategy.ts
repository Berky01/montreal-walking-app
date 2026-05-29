import type {
  Competitor,
  ConciergeRoute,
  ConciergeRouteTestInput,
  CustomerValidationInput,
  FakeDoorInput,
  GateResult,
  RankedRoute,
  SignalStrength,
  WalkRequest,
} from './types';

function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function gate(
  metrics: Record<string, number>,
  missingCriteria: string[],
  passRecommendation: string,
  failRecommendation: string,
): GateResult {
  const status = missingCriteria.length === 0 ? 'pass' : 'fail';

  return {
    status,
    metrics,
    missingCriteria,
    recommendation: status === 'pass' ? passRecommendation : failRecommendation,
  };
}

export function evaluateCustomerValidation(input: CustomerValidationInput): GateResult {
  const metrics = {
    monthlyIntentRate: percent(input.monthlyIntentCount, input.totalParticipants),
    weeklyIntentRate: percent(input.weeklyIntentCount, input.totalParticipants),
    earlyAccessCount: input.earlyAccessCount,
    paymentIntentCount: input.paymentIntentCount,
  };
  const missingCriteria: string[] = [];

  if (metrics.monthlyIntentRate < 40) missingCriteria.push('40%+ monthly-use intent');
  if (metrics.weeklyIntentRate < 20) missingCriteria.push('20%+ weekly-use intent');
  if (metrics.earlyAccessCount < 5) missingCriteria.push('5+ early-access requests');
  if (metrics.paymentIntentCount < 3) missingCriteria.push('3+ payment-intent signals');

  return gate(
    metrics,
    missingCriteria,
    'Proceed to concierge route testing with Montréal locals.',
    'Revise audience, wedge, or route promise before building.',
  );
}

export function evaluateConciergeRouteTest(input: ConciergeRouteTestInput): GateResult {
  const metrics = {
    completionOrPlanningRate: percent(input.completedOrPlannedCount, input.totalTesters),
    repeatRequestRate: percent(input.requestedAnotherRouteCount, input.totalTesters),
    fundamentalObjectionCount: input.fundamentalObjectionCount,
  };
  const missingCriteria: string[] = [];

  if (metrics.completionOrPlanningRate < 50) {
    missingCriteria.push('50%+ complete or seriously plan one walk');
  }
  if (metrics.repeatRequestRate < 30) missingCriteria.push('30%+ request another route');
  if (metrics.fundamentalObjectionCount > 2) {
    missingCriteria.push('fewer than 3 fundamental objections');
  }

  return gate(
    metrics,
    missingCriteria,
    'Proceed to a fake-door MVP and keep route automation manual.',
    'Fix route quality or positioning before creating the fake-door flow.',
  );
}

export function evaluateFakeDoor(input: FakeDoorInput): GateResult {
  const metrics = {
    emailConversionRate: percent(input.emailCaptures, input.visitors),
    generateClickRate: percent(input.generateClicks, input.visitors),
    repeatRequesterCount: input.repeatRequesterCount,
  };
  const missingCriteria: string[] = [];

  if (metrics.emailConversionRate < 10) missingCriteria.push('10%+ visitor-to-email conversion');
  if (metrics.generateClickRate < 25) missingCriteria.push('25%+ generate-click intent');
  if (metrics.repeatRequesterCount < 2) missingCriteria.push('meaningful repeat requests');

  return gate(
    metrics,
    missingCriteria,
    'Proceed to a mobile-first web MVP with lightweight route automation.',
    'Improve the offer or acquisition source before building the web MVP.',
  );
}

export function validateWalkRequest(request: WalkRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (request.startLocation.trim().length < 2) errors.push('Add a Montréal starting point.');
  if (request.stepGoal < 1500) errors.push('Choose at least 1,500 steps.');
  if (request.timeGoalMinutes < 15) errors.push('Choose at least 15 minutes.');
  if (request.interests.length === 0) errors.push('Pick at least one interest.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email.trim())) {
    errors.push('Enter a valid email for early access.');
  }

  return { valid: errors.length === 0, errors };
}

export function rankConciergeRoutes(
  routes: ConciergeRoute[],
  request: WalkRequest,
): RankedRoute[] {
  return routes
    .map((route) => {
      const stepDifference = Math.abs(route.stepEstimate - request.stepGoal);
      const stepDeltaPercent = Math.round((stepDifference / request.stepGoal) * 100);
      const interestMatches = route.interests.filter((interest) =>
        request.interests.includes(interest),
      ).length;
      const moodMatch = route.mood === request.mood;
      const stepFitScore = Math.max(0, 100 - stepDeltaPercent * 2);
      const score = stepFitScore + interestMatches * 16 + (moodMatch ? 20 : 0);
      const matchReasons: string[] = [];

      if (stepDeltaPercent <= 5) {
        matchReasons.push('within 5% of your step goal');
      } else if (stepDeltaPercent <= 15) {
        matchReasons.push('within 15% of your step goal');
      }
      if (moodMatch) matchReasons.push(`matches the ${request.mood} mood`);
      if (interestMatches > 0) {
        matchReasons.push(`matches ${interestMatches} selected interest${interestMatches > 1 ? 's' : ''}`);
      }

      return { ...route, score, matchReasons };
    })
    .sort((a, b) => b.score - a.score);
}

function strengthValue(strength: SignalStrength): number {
  return strength === 'strong' ? 2 : strength === 'medium' ? 1 : 0;
}

export function assessCompetitorRisk(competitors: Competitor[]): {
  decision: 'narrow-to-local-curation' | 'keep-wedge';
  strongFullSolutionCount: number;
} {
  const strongFullSolutionCount = competitors.filter((competitor) => {
    const solvesCore =
      competitor.loopGeneration === 'strong' &&
      strengthValue(competitor.stepTimeDistance) >= 1 &&
      competitor.cityWalkingQuality === 'strong' &&
      competitor.poiUsefulness === 'strong';

    return solvesCore;
  }).length;

  return {
    decision: strongFullSolutionCount >= 3 ? 'narrow-to-local-curation' : 'keep-wedge',
    strongFullSolutionCount,
  };
}
