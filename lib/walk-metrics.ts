import { formatDistanceForUnits } from "@/lib/preferences";
import type { Route, RouteMetric, RouteSession, UserPreferences } from "@/lib/types";
import { formatDuration, titleCase } from "@/lib/utils/format";

export function getSessionElapsedMin(session: RouteSession, now = new Date()): number {
  const pausedMs =
    session.status === "paused" && session.pausedAt
      ? session.totalPausedMs + Math.max(0, now.getTime() - new Date(session.pausedAt).getTime())
      : session.totalPausedMs;
  const elapsedMs = now.getTime() - new Date(session.startedAt).getTime() - pausedMs;

  return Math.max(1, Math.round(elapsedMs / 60000));
}

export function buildLiveRouteMetrics({
  now = new Date(),
  preferences,
  route,
  session
}: {
  now?: Date;
  preferences: UserPreferences;
  route: Route;
  session: RouteSession;
}): RouteMetric[] {
  const walkedDistanceKm = Math.max(0, session.actualDistanceKm);
  const remainingDistanceKm = Math.max(0, route.distanceKm - walkedDistanceKm);
  const elapsedMin = getSessionElapsedMin(session, now);

  return [
    { label: "Elapsed", value: formatDuration(elapsedMin) },
    { label: "Walked", value: formatDistanceForUnits(walkedDistanceKm, preferences.units) },
    { label: "Remaining", value: formatDistanceForUnits(remainingDistanceKm, preferences.units) },
    { label: "Steps", value: formatStepCount(estimateStepsForDistanceKm(walkedDistanceKm)), helper: "Estimated" },
    { label: "Pace", value: formatPace(elapsedMin, walkedDistanceKm) },
    { label: "Progress", value: `${session.progressPercent}%` },
    { label: "Visited", value: `${session.visitedStopIds.length}/${route.stops.length}`, helper: session.skippedStopIds.length ? `${session.skippedStopIds.length} skipped` : undefined },
    { label: "Status", value: titleCase(session.status) }
  ];
}

export function estimateStepsForDistanceKm(distanceKm: number): number {
  return Math.max(0, Math.round(distanceKm * 1310));
}

function formatStepCount(steps: number): string {
  return new Intl.NumberFormat("en-CA", { maximumFractionDigits: 0 }).format(steps);
}

function formatPace(elapsedMin: number, distanceKm: number): string {
  if (distanceKm <= 0) {
    return "Starting";
  }

  return `${formatDuration(Math.max(1, Math.round(elapsedMin / distanceKm)))}/km`;
}
