import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { MapShell } from "@/components/map/map-shell";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { getCities, getNeighborhoods, getPlaces } from "@/lib/data/index";

const upcomingCities = ["Quebec City", "Toronto", "Paris", "Rome"];

export const metadata: Metadata = {
  title: "Cities",
  description: "Browse supported Meaningful Routes cities and the first Montreal discovery guide.",
  alternates: {
    canonical: "/cities"
  }
};

export default function CitiesPage() {
  const cities = getCities();
  const activeCity = cities.find((city) => city.status === "active") ?? cities[0];
  const places = getPlaces();
  const neighborhoods = getNeighborhoods();

  return (
    <AppShell>
      <main className="pb-24 md:pb-0">
        <PageContainer className="space-y-8 py-8">
          <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.7fr)]">
            <div>
              <Chip tone="primary">City discovery</Chip>
              <h1 className="mt-3 text-headline-mobile text-on-surface md:text-headline-lg">Discover cities through meaningful places</h1>
              <p className="mt-3 max-w-2xl text-body-md text-on-surface-variant">
                Montreal is the first supported city. Browse places, neighborhoods, monuments, stories, and optional routes from one city guide before future destinations are added.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <ButtonLink href="/places">Explore Montreal places</ButtonLink>
                <ButtonLink href="/app#discovery-map" variant="secondary">Open Montreal map</ButtonLink>
              </div>
            </div>
            <MapShell className="min-h-[360px]" places={places.slice(0, 16)} selected={places[0] ? { type: "place", slug: places[0].slug } : null} title="Montreal city discovery map" />
          </section>

          <section className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.45fr)]">
            <Card className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-label-md text-primary">Available now</p>
                  <h2 className="mt-2 text-headline-mobile text-on-surface">{activeCity.name}</h2>
                </div>
                <Chip tone="primary">Available now</Chip>
              </div>
              <p className="mt-3 text-body-md text-on-surface-variant">
                {places.length} places across {neighborhoods.length} neighborhoods, with monuments, churches, markets, museums, viewpoints, public art, parks, and optional route collections.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {neighborhoods.slice(0, 8).map((neighborhood) => (
                  <Chip key={neighborhood.id}>{neighborhood.name}</Chip>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-headline-mobile text-on-surface">Coming soon</h2>
              <p className="mt-2 text-body-md text-on-surface-variant">
                Future cities will only become browsable when real place data and discovery content are ready.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {upcomingCities.map((city) => (
                  <Chip key={city}>{city}</Chip>
                ))}
              </div>
            </Card>
          </section>
        </PageContainer>
      </main>
    </AppShell>
  );
}
