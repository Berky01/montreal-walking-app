"use client";

import { useEffect, useMemo, useState } from "react";
import { PlaceCard } from "@/components/places/place-card";
import { RouteCard } from "@/components/routes/route-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { getSavedItems } from "@/lib/local-state";
import type { Place, Route, SavedItem } from "@/lib/types";

export function SavedLibraryClient({ routes, places }: { routes: Route[]; places: Place[] }) {
  const [items, setItems] = useState<SavedItem[]>([]);

  useEffect(() => {
    function refresh() {
      setItems(getSavedItems());
    }

    refresh();
    window.addEventListener("meaningful-routes-local-state", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("meaningful-routes-local-state", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const savedRoutes = useMemo(
    () => items.filter((item) => item.itemType === "route").map((item) => routes.find((route) => route.slug === item.itemSlug)).filter(Boolean) as Route[],
    [items, routes]
  );
  const savedPlaces = useMemo(
    () => items.filter((item) => item.itemType === "place").map((item) => places.find((place) => place.slug === item.itemSlug)).filter(Boolean) as Place[],
    [items, places]
  );

  if (!items.length) {
    return (
      <div className="space-y-6">
        <EmptyState title="No saved discoveries yet" description="Saved places and optional routes will appear here for this browser." />
        <section>
          <SectionHeader title="Places to keep handy" />
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {places.slice(0, 3).map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        </section>
        <section>
          <SectionHeader title="Optional route collections" />
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {routes.slice(0, 3).map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <SectionHeader title="Saved places" />
        {savedPlaces.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {savedPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} variant="saved" />
            ))}
          </div>
        ) : (
          <EmptyState title="No saved places" description="Saved place cards will appear here." />
        )}
      </section>
      <section>
        <SectionHeader title="Saved optional routes" />
        {savedRoutes.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {savedRoutes.map((route) => (
              <RouteCard key={route.id} route={route} variant="saved" />
            ))}
          </div>
        ) : (
          <EmptyState title="No saved optional routes" description="Saved route cards will appear here." />
        )}
      </section>
    </div>
  );
}
