"use client";

import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Flag, Pause, Play, ShieldCheck, SkipForward, TriangleAlert, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SplitMapLayout } from "@/components/layout/split-map-layout";
import { MapShell } from "@/components/map/map-shell";
import { PlaceCover } from "@/components/media/PlaceCover";
import { Button, ButtonLink } from "@/components/ui/button";
import { MetricRibbon } from "@/components/ui/metric-ribbon";
import { RouteStopTimeline } from "@/components/routes/route-stop-timeline";
import {
  abandonRouteSession,
  completeRouteSession,
  getActiveRouteSession,
  getUserPreferences,
  moveRouteSession,
  pauseRouteSession,
  resumeRouteSession,
  skipRouteStop,
  startRouteSession,
  visitRouteStop
} from "@/lib/local-state";
import { estimateDurationForPace } from "@/lib/preferences";
import type { Place, Route, RouteSession, UserPreferences } from "@/lib/types";
import { formatDuration } from "@/lib/utils/format";
import { buildLiveRouteMetrics } from "@/lib/walk-metrics";
import { ProgressBar } from "./progress-bar";

export function LiveRouteClient({ places, route }: { places: Place[]; route: Route }) {
  const router = useRouter();
  const [session, setSession] = useState<RouteSession | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setSession(getActiveRouteSession(route.slug) ?? startRouteSession(route));
  }, [route]);

  useEffect(() => {
    function refreshPreferences() {
      setPreferences(getUserPreferences());
    }

    refreshPreferences();
    window.addEventListener("meaningful-routes-local-state", refreshPreferences);
    window.addEventListener("storage", refreshPreferences);
    return () => {
      window.removeEventListener("meaningful-routes-local-state", refreshPreferences);
      window.removeEventListener("storage", refreshPreferences);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const progress = session?.progressPercent ?? 0;
  const currentStop = route.stops[session?.currentStopIndex ?? 0] ?? route.stops[0];
  const currentStopIndex = session?.currentStopIndex ?? 0;
  const nextStop = route.stops[Math.min(currentStopIndex + 1, route.stops.length - 1)] ?? currentStop;
  const currentPlace = places.find((place) => place.id === currentStop?.placeId);
  const nextPlace = places.find((place) => place.id === nextStop?.placeId);
  const skippedStops = session?.skippedStopIds.length ?? 0;
  const paused = session?.status === "paused";
  const currentStopNumber = Math.min(currentStopIndex + 1, route.stops.length);
  const nextStopNumber = Math.min(currentStopIndex + 2, route.stops.length);

  const metrics = useMemo(() => {
    const activePreferences = preferences ?? getUserPreferences();
    const timeLeft = {
      label: "Time left",
      value: formatDuration(estimateDurationForPace(Math.round(route.durationMin * (1 - progress / 100)), activePreferences.preferredPace))
    };

    if (!session) {
      return [
        { label: "Elapsed", value: "0 min" },
        { label: "Walked", value: "0.0 km" },
        { label: "Remaining", value: `${route.distanceKm.toFixed(1)} km` },
        timeLeft,
        { label: "Progress", value: "0%" },
        { label: "Visited", value: `0/${route.stops.length}` },
        { label: "Status", value: "Starting" }
      ];
    }

    const activeSession = session;
    const sessionMetrics = buildLiveRouteMetrics({
      now,
      preferences: activePreferences,
      route,
      session: activeSession
    });

    return sessionMetrics.flatMap((metric) => {
      if (metric.label === "Remaining") {
        return [metric, timeLeft];
      }

      if (metric.label === "Visited" && skippedStops) {
        return [{ ...metric, helper: `${skippedStops} skipped` }];
      }

      return [metric];
    });
  }, [now, preferences, progress, route, session, skippedStops]);

  function update(next: RouteSession | undefined) {
    if (next) {
      setSession(next);
    }
  }

  function finishWalk() {
    completeRouteSession(route);
    router.push(`/routes/${route.slug}/complete`);
  }

  const content = (
    <div className="space-y-4">
      <section className="rounded-card border border-outline-variant bg-surface-container-lowest p-5 shadow-card">
        <p className="text-label-sm text-on-surface-variant">Guided discovery</p>
        <h1 className="mt-1 text-headline-mobile text-on-surface md:text-headline-lg">{route.title}</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">
          {currentStop ? `Place ${currentStopNumber} of ${route.stops.length}: ${currentStop.title}` : "Start exploring when you are ready."}
        </p>
        {currentPlace ? (
          <div className="relative mt-4 h-44 overflow-hidden rounded-card bg-surface-container-high">
            <PlaceCover place={currentPlace} />
          </div>
        ) : null}
        <div className="mt-5">
          <ProgressBar value={progress} />
        </div>
      </section>

      <MetricRibbon metrics={metrics} />

      <section className="rounded-card border border-outline-variant bg-surface-container-lowest p-5 shadow-card">
        <div className="flex items-center gap-2 text-primary">
          <Flag aria-hidden="true" size={18} />
          <h2 className="text-label-md">{nextStop.id === currentStop.id ? "Final stop" : `Next stop ${nextStopNumber}`}</h2>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[112px_minmax(0,1fr)]">
          {nextPlace ? (
            <div className="relative h-24 overflow-hidden rounded-card bg-surface-container-high">
              <PlaceCover place={nextPlace} />
            </div>
          ) : null}
          <div>
            <h3 className="text-body-lg font-semibold text-on-surface">{nextStop.title}</h3>
            <p className="mt-2 text-body-md text-on-surface-variant">{nextStop.description}</p>
          </div>
        </div>
      </section>

      <section className="rounded-card border border-tertiary/30 bg-tertiary/10 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck aria-hidden="true" className="mt-1 text-tertiary" size={18} />
          <p className="text-body-md text-on-surface">{route.safetyNotes[0]?.description}</p>
        </div>
      </section>

      <section className="rounded-card border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
        <div className="flex items-start gap-3">
          <AlertTriangle aria-hidden="true" className="mt-1 text-secondary" size={18} />
          <p className="text-body-md text-on-surface">Keep the screen awake if your device supports it, and check crossings before looking back at the route.</p>
        </div>
      </section>

      <section>
        <h2 className="text-headline-mobile text-on-surface">Stops</h2>
        <div className="mt-4">
          <RouteStopTimeline
            currentStopId={currentStop?.id}
            nextStopId={nextStop?.id}
            places={places}
            route={route}
            skippedStopIds={session?.skippedStopIds ?? []}
            visitedStopIds={session?.visitedStopIds ?? []}
          />
        </div>
      </section>

      <div className="sticky bottom-20 z-20 grid gap-2 rounded-card border border-outline-variant bg-surface-container-lowest p-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-floating sm:static sm:grid-cols-3">
        <Button className="min-h-12 sm:col-span-1" onClick={() => currentStop && update(visitRouteStop(route, currentStop.id))} variant="primary">
          <CheckCircle2 aria-hidden="true" size={17} />
          Mark visited
        </Button>
        <Button className="min-h-12 sm:col-span-1" onClick={() => update(moveRouteSession(route, 1))} variant="secondary">
          <ChevronRight aria-hidden="true" size={17} />
          Next stop
        </Button>
        <Button className="min-h-12 sm:col-span-1" onClick={() => currentStop && update(skipRouteStop(route, currentStop.id))} variant="ghost">
          <SkipForward aria-hidden="true" size={17} />
          Skip stop
        </Button>
        <Button className="min-h-12 sm:col-span-1" onClick={() => update(moveRouteSession(route, -1))} variant="ghost">
          <ChevronLeft aria-hidden="true" size={17} />
          Previous
        </Button>
        <Button onClick={() => update(paused ? resumeRouteSession(route.slug) : pauseRouteSession(route.slug))} variant="secondary">
          {paused ? <Play aria-hidden="true" size={17} /> : <Pause aria-hidden="true" size={17} />}
          {paused ? "Resume" : "Pause"}
        </Button>
        <Button onClick={finishWalk} variant={progress >= 100 ? "primary" : "secondary"}>
          <Flag aria-hidden="true" size={17} />
          {progress >= 100 ? "Complete visit" : "End visit"}
        </Button>
        <Button
          onClick={() => {
            abandonRouteSession(route.slug);
            router.push(`/routes/${route.slug}`);
          }}
          variant="ghost"
        >
          <XCircle aria-hidden="true" size={17} />
          Abandon
        </Button>
        <ButtonLink className="sm:col-span-3" href={`/report-issue?route=${route.slug}&stop=${currentStop?.id ?? ""}`} variant="ghost">
          <TriangleAlert aria-hidden="true" size={17} />
          Report issue
        </ButtonLink>
      </div>
    </div>
  );

  return (
    <SplitMapLayout
      content={content}
      map={
        <MapShell
          className="sticky top-24 min-h-[720px]"
          currentStopId={currentStop?.id}
          nextStopId={nextStop?.id}
          places={places}
          route={route}
          skippedStopIds={session?.skippedStopIds ?? []}
          title={`${route.title} live map`}
          visitedStopIds={session?.visitedStopIds ?? []}
        />
      }
    />
  );
}
