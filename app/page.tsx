import { ArrowRight, MapPinned, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { MapShell } from "@/components/map/map-shell";
import { RouteCard } from "@/components/routes/route-card";
import { PlaceCard } from "@/components/places/place-card";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { SectionHeader } from "@/components/ui/section-header";
import { getFeaturedRoutes, getPlaces } from "@/lib/data/index";

export default function LandingPage() {
  const featured = getFeaturedRoutes().slice(0, 3);
  const places = getPlaces();
  const featuredPlaces = places.slice(0, 3);

  return (
    <AppShell showMobileNav={false}>
      <main>
        <section className="border-b border-outline-variant bg-surface">
          <PageContainer className="grid min-h-[calc(100vh-64px)] items-center gap-8 py-10 md:grid-cols-[0.95fr_1.05fr] md:py-16">
            <div>
              <Chip tone="primary">Montreal discovery guide</Chip>
              <h1 className="mt-5 max-w-3xl text-headline-mobile text-on-surface md:text-display-lg">
                Discover meaningful places in Montreal.
              </h1>
              <p className="mt-5 max-w-2xl text-body-lg text-on-surface-variant">
                Explore monuments, hidden courtyards, viewpoints, churches, markets, architecture, and neighborhood stories, then connect them with optional walks.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/places" size="lg">
                  Explore places
                  <ArrowRight aria-hidden="true" size={18} />
                </ButtonLink>
                <ButtonLink href="/search" size="lg" variant="secondary">
                  <Search aria-hidden="true" size={18} />
                  Search discoveries
                </ButtonLink>
                <ButtonLink href="/app#discovery-map" size="lg" variant="ghost">
                  <MapPinned aria-hidden="true" size={18} />
                  Open map
                </ButtonLink>
              </div>
            </div>
            <MapShell className="min-h-[420px]" places={places.slice(0, 12)} title="Montreal discovery map preview" />
          </PageContainer>
        </section>

        <PageContainer className="space-y-8 py-12">
          <SectionHeader eyebrow="Featured" title="Places worth discovering" action={<ButtonLink href="/places" variant="secondary">Browse places</ButtonLink>} />
          <div className="grid gap-4 md:grid-cols-3">
            {featuredPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
          <SectionHeader eyebrow="Optional routes" title="Curated ways to connect discoveries" action={<ButtonLink href="/routes" variant="secondary">View routes</ButtonLink>} />
          <div className="grid gap-4 md:grid-cols-3">
            {featured.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Discovery first", "Browse by place, neighborhood, monument type, and theme before choosing whether to follow a route."],
              ["Stories and context", "Each discovery explains why the place matters and what to notice when you arrive."],
              ["Montreal first", "The first city guide stays compact so places, maps, safety context, and optional routes stay useful."]
            ].map(([title, description]) => (
              <Card className="p-5" key={title}>
                <h2 className="text-body-lg font-semibold text-on-surface">{title}</h2>
                <p className="mt-2 text-body-md text-on-surface-variant">{description}</p>
              </Card>
            ))}
          </div>
        </PageContainer>
      </main>
    </AppShell>
  );
}
