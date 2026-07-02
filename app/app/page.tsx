import { MapPinned, Route, Search, Settings } from "lucide-react";
import { AppHomeExperience } from "@/components/app/app-home-experience";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { LocalStateSummary } from "@/components/library/local-state-summary";
import { MapShell } from "@/components/map/map-shell";
import { PhotoWithCredit } from "@/components/media/PhotoWithCredit";
import { ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { appQuickFilters } from "@/lib/app-quick-filters";
import { getFeaturedRoutes, getNeighborhoods, getPlaces } from "@/lib/data/index";
import { getPrimaryMediaAsset } from "@/lib/media/media-selection";

export default function AppHomePage() {
  const routes = getFeaturedRoutes();
  const places = getPlaces();
  const neighborhoods = getNeighborhoods();
  const heroAsset = getPrimaryMediaAsset(routes[0]?.media ?? [], "hero");

  return (
    <AppShell>
      <main className="pb-24 md:pb-0">
        <section className="bg-surface-container-low">
          <PageContainer className="grid gap-6 py-6 md:py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(380px,0.72fr)]">
            <div className="flex min-w-0 flex-col justify-center">
              <Chip tone="primary">Current city: Montreal</Chip>
              <h1 className="mt-4 max-w-4xl text-headline-mobile text-on-surface md:text-display-lg">
                Discover the places that make Montreal feel legible.
              </h1>
              <p className="mt-4 max-w-2xl text-body-lg text-on-surface-variant">
                Explore monuments, hidden courtyards, viewpoints, churches, markets, architecture, and neighborhood stories, then connect them with optional walks.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href="/places" variant="primary">
                  <MapPinned aria-hidden="true" size={17} />
                  Explore places
                </ButtonLink>
                <ButtonLink href="/app#discovery-map" variant="secondary">
                  Open map
                </ButtonLink>
                <ButtonLink href="/routes" variant="ghost">
                  <Route aria-hidden="true" size={17} />
                  Find a route
                </ButtonLink>
                <ButtonLink href="/search" variant="ghost">
                  <Search aria-hidden="true" size={17} />
                  Search places
                </ButtonLink>
                <ButtonLink href="/settings" variant="ghost">
                  <Settings aria-hidden="true" size={17} />
                  Preferences
                </ButtonLink>
              </div>
              <div className="mt-5 flex gap-2 overflow-x-auto pb-1 md:flex-wrap">
                {appQuickFilters.map((filter) => (
                  <ButtonLink className="shrink-0" href={filter.href} key={filter.label} size="sm" variant="secondary">
                    {filter.label}
                  </ButtonLink>
                ))}
              </div>
            </div>
            <PhotoWithCredit
              asset={heroAsset}
              className="min-h-[360px] min-w-0 md:min-h-[420px]"
              fallback={<MapShell className="min-h-[360px] min-w-0 md:min-h-[420px]" places={places.slice(0, 18)} title="Montreal discovery map" />}
              priority
            />
          </PageContainer>
        </section>

        <PageContainer className="space-y-9 py-8">
          <AppHomeExperience neighborhoods={neighborhoods} places={places} routes={routes} />

          <LocalStateSummary />

          <section className="rounded-card border border-outline-variant bg-surface-container p-5">
            <div className="flex items-start gap-3">
              <MapPinned aria-hidden="true" className="mt-1 text-primary" size={20} />
              <p className="text-body-md text-on-surface">
                Place pages include story context, practical notes, map position, safety and accessibility context, plus optional route collections when you want to connect discoveries.
              </p>
            </div>
          </section>
        </PageContainer>
      </main>
    </AppShell>
  );
}
