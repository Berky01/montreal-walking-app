"use client";

import { BookOpen, Clock, Footprints, MapPinned } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { MetricRibbon } from "@/components/ui/metric-ribbon";
import { Card } from "@/components/ui/card";
import { getActiveRouteSession, getUserPreferences, getWalkHistoryItems } from "@/lib/local-state";
import { estimateDurationForPace, formatDistanceForUnits } from "@/lib/preferences";
import type { Route, RouteSession, UserPreferences, WalkSession } from "@/lib/types";
import { formatDuration } from "@/lib/utils/format";
import { estimateStepsForDistanceKm } from "@/lib/walk-metrics";

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

export function CompletionJournalClient({ route }: { route: Route }) {
  const [activeSession, setActiveSession] = useState<RouteSession | null>(null);
  const [completedSession, setCompletedSession] = useState<WalkSession | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    setActiveSession(getActiveRouteSession(route.slug) ?? null);
    setCompletedSession(getWalkHistoryItems().find((session) => session.routeSlug === route.slug) ?? null);
    setPreferences(getUserPreferences());
  }, [route.slug]);

  const session = completedSession ?? activeSession;
  const walkedDistanceKm = session?.actualDistanceKm ?? route.distanceKm;
  const visitedStops = session?.visitedStopIds.length || route.stops.length;
  const startedLabel = session ? formatSessionDate(session.startedAt) : "Estimated visit";
  const endedLabel = session?.endedAt ? formatSessionDate(session.endedAt) : "Not saved yet";

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-primary">
        <BookOpen aria-hidden="true" size={18} />
        <h2 className="text-headline-mobile text-on-surface">Walk journal</h2>
      </div>
      <p className="mt-2 text-body-md text-on-surface-variant">
        {startedLabel} · {endedLabel}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <JournalStat icon={<Clock aria-hidden="true" size={18} />} label="Time" value={formatDuration(session?.elapsedMin ?? route.durationMin)} />
        <JournalStat icon={<MapPinned aria-hidden="true" size={18} />} label="Distance" value={formatDistanceForUnits(walkedDistanceKm, preferences?.units ?? "metric")} />
        <JournalStat icon={<Footprints aria-hidden="true" size={18} />} label="Steps" value={new Intl.NumberFormat("en-CA").format(estimateStepsForDistanceKm(walkedDistanceKm))} />
        <JournalStat icon={<BookOpen aria-hidden="true" size={18} />} label="Stops" value={`${visitedStops}/${route.stops.length}`} />
      </div>
      <p className="mt-4 text-label-sm text-on-surface-variant">
        Journal data stays in this browser unless you share it.
      </p>
    </Card>
  );
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

function JournalStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-card bg-surface-container-low p-3">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <p className="text-label-sm text-on-surface-variant">{label}</p>
      </div>
      <p className="mt-2 text-metric-lg text-on-surface">{value}</p>
    </div>
  );
}

function formatSessionDate(value: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
