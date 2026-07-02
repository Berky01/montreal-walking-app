import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { MapShell } from "@/components/map/map-shell";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { getPlaces, getRoutes } from "@/lib/data/index";

export default function RouteBuilderPage() {
  const routes = getRoutes();
  const places = getPlaces();
  const previewRoute = routes[0];

  return (
    <AppShell>
      <main className="pb-24 md:pb-0">
        <PageContainer className="space-y-8 py-8">
          <div>
            <Chip tone="tertiary">Internal route tools</Chip>
            <h1 className="mt-3 text-headline-mobile text-on-surface md:text-headline-lg">Route builder preview</h1>
            <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
              Review ordered stops and stored manual geometry before future write actions are enabled.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              {routes.map((route) => (
                <Card className="p-4" key={route.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-body-lg font-semibold text-on-surface">{route.title}</h2>
                      <p className="mt-1 text-label-sm text-on-surface-variant">
                        {route.area} · {route.stops.length} stops · {route.distanceKm.toFixed(1)} km
                      </p>
                    </div>
                    <Chip tone={route.qaStatus.geometry === "ready" ? "primary" : "tertiary"}>{route.qaStatus.geometry}</Chip>
                  </div>
                  <ol className="mt-3 grid gap-1 text-label-sm text-on-surface-variant">
                    {route.stops.map((stop) => (
                      <li key={stop.id}>
                        {stop.order}. {stop.title}
                      </li>
                    ))}
                  </ol>
                </Card>
              ))}
            </div>

            {previewRoute ? (
              <MapShell className="sticky top-24 min-h-[680px]" places={places} route={previewRoute} title="Route builder geometry preview" />
            ) : null}
          </div>
        </PageContainer>
      </main>
    </AppShell>
  );
}
