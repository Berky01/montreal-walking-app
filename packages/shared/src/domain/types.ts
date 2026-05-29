import type { supportedInterests, supportedMoods } from './walkOptions';

export type SignalStrength = 'weak' | 'medium' | 'strong';
export type GateStatus = 'pass' | 'fail';
export type Mood = typeof supportedMoods[number];
export type RouteType = 'loop' | 'end-near-transit';

export type Interest = typeof supportedInterests[number];

export interface Competitor {
  name: string;
  loopGeneration: SignalStrength;
  stepTimeDistance: SignalStrength;
  cityWalkingQuality: SignalStrength;
  poiUsefulness: SignalStrength;
  regenerationControls: SignalStrength;
  mobileWeb: SignalStrength;
  pricing: string;
  userComplaints: string[];
}

export interface WalkRequest {
  startLocation: string;
  stepGoal: number;
  timeGoalMinutes: number;
  mood: Mood;
  interests: Interest[];
  routeType: RouteType;
  email: string;
}

export interface ConciergeRoute {
  id: string;
  name: string;
  neighborhood: string;
  mood: Mood;
  interests: Interest[];
  stepEstimate: number;
  distanceKm: number;
  timeMinutes: number;
  poiCount: number;
  whyNice: string;
  exportLabel: string;
}

export interface RankedRoute extends ConciergeRoute {
  score: number;
  matchReasons: string[];
}

export interface CustomerValidationInput {
  totalParticipants: number;
  monthlyIntentCount: number;
  weeklyIntentCount: number;
  earlyAccessCount: number;
  paymentIntentCount: number;
}

export interface ConciergeRouteTestInput {
  totalTesters: number;
  completedOrPlannedCount: number;
  requestedAnotherRouteCount: number;
  fundamentalObjectionCount: number;
}

export interface FakeDoorInput {
  visitors: number;
  emailCaptures: number;
  generateClicks: number;
  repeatRequesterCount: number;
}

export interface GateResult {
  status: GateStatus;
  metrics: Record<string, number>;
  missingCriteria: string[];
  recommendation: string;
}
