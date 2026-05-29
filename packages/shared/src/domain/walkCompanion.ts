import type { POI, ScoredRoute, WalkSessionRecord } from './mvpTypes';

export interface NextMoveSummary {
  title: string;
  distanceLabel: string;
  etaLabel: string;
  cue: string;
}

export interface TimeGuardrailSummary {
  status: 'on-track' | 'running-long';
  title: string;
  elapsedLabel: string;
  remainingTimeLabel: string;
  remainingDistanceLabel: string;
  progressPercent: number;
  warningLabel: string;
}

export interface BailoutOption {
  id: 'shortcut' | 'return' | 'transit';
  label: string;
  detail: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function minutesLabel(minutes: number) {
  return `${Math.max(1, Math.round(minutes))} min`;
}

function distanceLabel(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function elapsedSecondsFor(walk: WalkSessionRecord) {
  const storedElapsedSeconds = Math.max(0, walk.elapsedSeconds);
  if (walk.status !== 'active') return storedElapsedSeconds;

  const startedAt = Date.parse(walk.startedAt);
  const updatedAt = Date.parse(walk.updatedAt);
  const wallClockElapsedSeconds = Number.isFinite(startedAt)
    ? Math.max(0, Math.round((Date.now() - startedAt) / 1000))
    : storedElapsedSeconds;

  if (storedElapsedSeconds > 0 && Number.isFinite(updatedAt) && updatedAt > startedAt) {
    return storedElapsedSeconds + Math.max(0, Math.round((Date.now() - updatedAt) / 1000));
  }

  return Math.max(storedElapsedSeconds, wallClockElapsedSeconds);
}

export function buildNextMove(route: ScoredRoute, nextPOI: POI | null): NextMoveSummary {
  if (!nextPOI) {
    return {
      title: 'Return to your start point',
      distanceLabel: distanceLabel(Math.max(200, route.distanceMeters * 0.12)),
      etaLabel: minutesLabel(Math.max(3, route.durationSeconds * 0.12 / 60)),
      cue: 'Follow the highlighted route back to the loop finish.',
    };
  }

  const nextDistanceMeters = Math.max(120, Math.round(route.distanceMeters / Math.max(route.pois.length + 3, 4)));
  const nextMinutes = nextDistanceMeters / 75;

  return {
    title: `Head toward ${nextPOI.name}`,
    distanceLabel: distanceLabel(nextDistanceMeters),
    etaLabel: minutesLabel(nextMinutes),
    cue: `Continue toward the highlighted stop, then slow down as you approach ${nextPOI.name}.`,
  };
}

export function shortcutEstimateFor(route: ScoredRoute) {
  const savedSeconds = clamp(route.durationSeconds * 0.3, 5 * 60, 18 * 60);
  const savedMinutes = Math.round(savedSeconds / 60);

  return {
    savedMinutes,
    label: `Shortcut saves ${savedMinutes} min`,
  };
}

export function buildTimeGuardrail(walk: WalkSessionRecord, route: ScoredRoute): TimeGuardrailSummary {
  const elapsedSeconds = elapsedSecondsFor(walk);
  const timeProgressPercent = clamp(Math.round((elapsedSeconds / route.durationSeconds) * 100), 0, 100);
  const hasStepProgress = walk.estimatedSteps > 0 && route.estimatedSteps > 0;
  const routeProgressPercent = hasStepProgress
    ? clamp(Math.round((walk.estimatedSteps / route.estimatedSteps) * 100), 0, 100)
    : timeProgressPercent;
  const remainingSeconds = Math.max(0, route.durationSeconds - elapsedSeconds);
  const remainingMeters = Math.max(0, route.distanceMeters * (1 - routeProgressPercent / 100));
  const runningLong = timeProgressPercent > 72 && routeProgressPercent < 65;
  const shortcut = shortcutEstimateFor(route);

  return {
    status: runningLong ? 'running-long' : 'on-track',
    title: runningLong ? 'Running longer than planned' : `On track for ${minutesLabel(route.durationSeconds / 60)}`,
    elapsedLabel: `${minutesLabel(elapsedSeconds / 60)} walked`,
    remainingTimeLabel: remainingSeconds > 0 ? `${minutesLabel(remainingSeconds / 60)} left` : '0 min left',
    remainingDistanceLabel: `${distanceLabel(remainingMeters)} remaining`,
    progressPercent: routeProgressPercent,
    warningLabel: `Running long? ${shortcut.label}.`,
  };
}

export function buildBailoutOptions(route: ScoredRoute): BailoutOption[] {
  const shortcut = shortcutEstimateFor(route);

  return [
    { id: 'shortcut', label: 'Shortcut', detail: `save ${shortcut.savedMinutes} min` },
    { id: 'return', label: 'Return', detail: distanceLabel(Math.max(300, route.distanceMeters / 2)) },
    { id: 'transit', label: 'Transit', detail: 'bus 80 nearby' },
  ];
}
