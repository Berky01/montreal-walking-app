"use client";

import { useEffect, useMemo, useState } from "react";
import { MetricRibbon } from "@/components/ui/metric-ribbon";
import { getActiveRouteSession, getUserPreferences, getWalkHistoryItems } from "@/lib/local-state";
import { estimateDurationForPace, formatDistanceForUnits } from "@/lib/preferences";
import type { Route, RouteSession, UserPreferences, WalkSession } from "@/lib/types";
import { formatDuration } from "@/lib/utils/format";

export function CompletionSummaryClient({ route }: { route: Route }) {
  const [activeSession, setActiveSession] = useState<RouteSession | null>(null);
  const [completedSession, setCompletedSession] = useState<WalkSession | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    setActiveSession(getActiveRouteSession(route.slug) ?? null);
    setCompletedSession(getWalkHistoryItems().find((session) => session.routeSlug === route.slug) ?? null);
    setPreferences(getUserPreferences());
  }, [route.slug]);

  const visitedStopIds = completedSession?.visitedStopIds ?? activeSession?.visitedStopIds ?? route.stops.map((stop) => stop.id);
  const progressPercent = completedSession?.progressPercent ?? activeSession?.progressPercent ?? 100;
  const elapsedMin = completedSession?.elapsedMin ?? estimateElapsed(route, activeSession);
  const hasSessionTime = Boolean(completedSession || activeSession);
  const displayedTimeMin = hasSessionTime ? elapsedMin : estimateDurationForPace(elapsedMin, preferences?.preferredPace ?? "relaxed");

  const metrics = useMemo(
    () => [
      { label: hasSessionTime ? "Actual time" : "Estimated time", value: formatDuration(displayedTimeMin), helper: hasSessionTime ? "From walk session" : `${preferences?.preferredPace ?? "relaxed"} pace` },
      { label: "Distance", value: formatDistanceForUnits(route.distanceKm, preferences?.units ?? "metric") },
      { label: "Stops", value: `${visitedStopIds.length}/${route.stops.length}` },
      { label: "Completion", value: `${progressPercent}%` }
    ],
    [displayedTimeMin, hasSessionTime, preferences?.preferredPace, preferences?.units, progressPercent, route.distanceKm, route.stops.length, visitedStopIds.length]
  );

  return <MetricRibbon metrics={metrics} />;
}

export function CompletionStopsClient({ route }: { route: Route }) {
  const [activeSession, setActiveSession] = useState<RouteSession | null>(null);
  const [completedSession, setCompletedSession] = useState<WalkSession | null>(null);

  useEffect(() => {
    setActiveSession(getActiveRouteSession(route.slug) ?? null);
    setCompletedSession(getWalkHistoryItems().find((session) => session.routeSlug === route.slug) ?? null);
  }, [route.slug]);

  const visitedStopIds = completedSession?.visitedStopIds ?? activeSession?.visitedStopIds ?? route.stops.map((stop) => stop.id);
  const visited = new Set(visitedStopIds);

  return (
    <ol className="mt-4 list-none space-y-2 text-body-md text-on-surface-variant">
      {route.stops.map((stop, index) => {
        const isVisited = visited.has(stop.id);

        return (
          <li className="flex items-center justify-between gap-3 rounded-control bg-surface-container p-2" key={stop.id}>
            <span className="flex min-w-0 items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-label-sm text-on-primary">{index + 1}</span>
              <span className="min-w-0 truncate">{stop.title}</span>
            </span>
            <span className={isVisited ? "shrink-0 text-label-sm text-primary" : "shrink-0 text-label-sm text-on-surface-variant"}>
              {isVisited ? "Visited" : "Not marked"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function estimateElapsed(route: Route, session: RouteSession | null): number {
  if (!session) {
    return route.durationMin;
  }

  const elapsedMs = Date.now() - new Date(session.startedAt).getTime() - session.totalPausedMs;
  return Math.max(1, Math.round(elapsedMs / 60000));
}
