import type { Route, RouteSearchResult } from "@/lib/types";
import { RouteCard } from "./route-card";

export function RouteList({
  results,
  selectedSlug,
  onPreview
}: {
  results: RouteSearchResult[];
  selectedSlug?: string;
  onPreview?: (route: Route) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {results.map((result) => (
        <RouteCard
          key={result.route.id}
          matchReasons={result.matchReasons}
          onPreview={onPreview}
          route={result.route}
          selected={selectedSlug === result.route.slug}
          variant="large"
        />
      ))}
    </div>
  );
}
