"use client";

import { useState } from "react";
import { SplitMapLayout } from "@/components/layout/split-map-layout";
import { MapShell } from "@/components/map/map-shell";
import type { MapSelection } from "@/components/map/mapTypes";
import { PlaceCover } from "@/components/media/PlaceCover";
import { PlaceCard } from "@/components/places/place-card";
import { RouteCard } from "@/components/routes/route-card";
import { ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SectionHeader } from "@/components/ui/section-header";
import { NeighborhoodVisual } from "@/components/visual/visuals";
import type { Neighborhood, Place, Route } from "@/lib/types";

const discoveryThemes = [
  { label: "History", href: "/places?tag=history" },
  { label: "Architecture", href: "/places?tag=architecture" },
  { label: "Churches", href: "/places?category=church" },
  { label: "Viewpoints", href: "/places?category=viewpoint" },
  { label: "Public art", href: "/places?category=public_art" },
  { label: "Markets", href: "/places?category=market" },
  { label: "Rainy day", href: "/places?tag=rainy%20day" },
  { label: "Hidden gems", href: "/places?category=hidden_gem" }
];

export function AppHomeExperience({
  neighborhoods,
  places,
  routes
}: {
  neighborhoods: Neighborhood[];
  places: Place[];
  routes: Route[];
}) {
  const [selected, setSelected] = useState<MapSelection>(places[0] ? { type: "place", slug: places[0].slug } : null);
  const previewRoutes = routes.slice(0, 6);
  const previewPlaces = places.slice(0, 12);

  return (
    <SplitMapLayout
      content={
        <div className="space-y-9">
          <section>
            <SectionHeader title="Places worth discovering" action={<ButtonLink href="/places" variant="secondary">Browse places</ButtonLink>} />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {places.slice(0, 4).map((place) => (
                <PlaceCard
                  key={place.id}
                  onPreview={() => setSelected({ type: "place", slug: place.slug })}
                  place={place}
                  selected={selected?.type === "place" && selected.slug === place.slug}
                  variant="large"
                />
              ))}
            </div>
          </section>

          <section>
            <SectionHeader title="Neighborhoods to explore" />
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {neighborhoods.slice(0, 6).map((neighborhood) => {
                const representativePlace = places.find((place) => neighborhood.placeSlugs.includes(place.slug));

                return (
                <article className="overflow-hidden rounded-card border border-outline-variant bg-surface-container-lowest shadow-card" key={neighborhood.id}>
                  <div className="relative h-32 bg-surface-container-high">
                    {representativePlace ? <PlaceCover place={representativePlace} /> : <NeighborhoodVisual className="rounded-none" name={neighborhood.name} />}
                  </div>
                  <div className="p-4">
                    <h3 className="text-body-lg font-semibold text-on-surface">{neighborhood.name}</h3>
                    <p className="mt-2 line-clamp-3 text-body-md text-on-surface-variant">{neighborhood.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {neighborhood.tags.slice(0, 3).map((tag) => (
                        <Chip key={tag}>{tag}</Chip>
                      ))}
                    </div>
                  </div>
                </article>
              );
              })}
            </div>
          </section>

          <section>
            <SectionHeader title="Explore by theme" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {discoveryThemes.map((theme) => (
                <ButtonLink className="justify-start" href={theme.href} key={theme.label} variant="secondary">
                  {theme.label}
                </ButtonLink>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader title="Curated ways to connect places" action={<ButtonLink href="/routes" variant="secondary">Browse optional routes</ButtonLink>} />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {routes.slice(0, 4).map((route, index) => (
                <RouteCard
                  key={route.id}
                  onPreview={() => setSelected({ type: "route", slug: route.slug })}
                  route={route}
                  selected={selected?.type === "route" && selected.slug === route.slug}
                  variant={index === 0 ? "large" : "default"}
                />
              ))}
            </div>
          </section>
        </div>
      }
      map={
        <MapShell
          id="discovery-map"
          className="sticky top-24 min-h-[680px]"
          onSelect={setSelected}
          places={previewPlaces}
          routes={previewRoutes}
          selected={selected}
          title="Montreal discovery map"
        />
      }
    />
  );
}
