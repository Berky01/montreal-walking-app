"use client";

import { useEffect, useMemo, useState } from "react";
import { RouteCard } from "@/components/routes/route-card";
import { ShareButton } from "@/components/share/share-button";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricRibbon } from "@/components/ui/metric-ribbon";
import { deleteWalkHistoryItem, getUserPreferences, getWalkHistoryItems } from "@/lib/local-state";
import { formatDistanceForUnits } from "@/lib/preferences";
import type { Route, UserPreferences, WalkSession } from "@/lib/types";
import { formatDuration } from "@/lib/utils/format";

export function HistoryClient({ routes }: { routes: Route[] }) {
  const [sessions, setSessions] = useState<WalkSession[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    function refresh() {
      setSessions(getWalkHistoryItems());
      setPreferences(getUserPreferences());
    }

    refresh();
    window.addEventListener("meaningful-routes-local-state", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("meaningful-routes-local-state", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const completedRoutes = useMemo(
    () => sessions.map((session) => routes.find((route) => route.slug === session.routeSlug)).filter(Boolean) as Route[],
    [routes, sessions]
  );
  const metrics = [
    { label: "Guided visits", value: String(sessions.length) },
    { label: "Distance", value: formatDistanceForUnits(sessions.reduce((sum, session) => sum + session.actualDistanceKm, 0), preferences?.units ?? "metric") },
    { label: "Time", value: formatDuration(sessions.reduce((sum, session) => sum + session.elapsedMin, 0)) },
    { label: "Places", value: String(sessions.reduce((sum, session) => sum + session.visitedStopIds.length, 0)) }
  ];

  if (!sessions.length) {
    return <EmptyState title="No guided discoveries yet" description="Use Save to history on a route completion page to add a local history entry." />;
  }

  return (
    <div className="space-y-8">
      <MetricRibbon metrics={metrics} />
      <div className="grid gap-4 md:grid-cols-3">
        {completedRoutes.map((route, index) => (
          <div className="space-y-3" key={`${route.id}-${sessions[index]?.id}`}>
            <p className="px-1 text-label-sm text-on-surface-variant">Completed {new Date(sessions[index]?.endedAt ?? "").toLocaleDateString()}</p>
            <RouteCard route={route} />
            <div className="grid gap-2 rounded-card border border-outline-variant bg-surface-container-lowest p-3 shadow-card">
              <ButtonLink href={`/routes/${route.slug}/live`} variant="secondary">Explore again</ButtonLink>
              <ShareButton text={`I explored ${route.title} with Meaningful Routes.`} title={`${route.title} completed`} />
              <Button
                onClick={() => {
                  const next = deleteWalkHistoryItem(sessions[index].id);
                  setSessions(next);
                }}
                type="button"
                variant="ghost"
              >
                Delete history item
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
