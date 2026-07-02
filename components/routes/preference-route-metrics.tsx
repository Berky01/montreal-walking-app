"use client";

import { useEffect, useMemo, useState } from "react";
import { MetricRibbon } from "@/components/ui/metric-ribbon";
import { getUserPreferences } from "@/lib/local-state";
import { estimateDurationForPace, formatDistanceForUnits } from "@/lib/preferences";
import type { Route, RouteMetric, UserPreferences } from "@/lib/types";
import { formatDuration } from "@/lib/utils/format";

export function PreferenceRouteMetrics({ route }: { route: Route }) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

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

  const metrics = useMemo<RouteMetric[]>(() => {
    if (!preferences) {
      return route.metrics;
    }

    return [
      { label: "Distance", value: formatDistanceForUnits(route.distanceKm, preferences.units) },
      { label: "Time", value: formatDuration(estimateDurationForPace(route.durationMin, preferences.preferredPace)), helper: `${preferences.preferredPace} pace` },
      { label: "Stops", value: String(route.stops.length) },
      { label: "Difficulty", value: route.difficulty[0].toUpperCase() + route.difficulty.slice(1) }
    ];
  }, [preferences, route]);

  return <MetricRibbon metrics={metrics} />;
}
