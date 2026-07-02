import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { MapShell } from "@/components/map/map-shell";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { MetricRibbon } from "@/components/ui/metric-ribbon";
import { getPlaces, getRoutes } from "@/lib/data/index";

export default function RouteQaPage() {
  const routes = getRoutes();
  const places = getPlaces();
  const metrics = [
    { label: "Routes", value: String(routes.length) },
    { label: "Review", value: String(routes.filter((route) => route.qaStatus.overall === "review").length) },
    { label: "Rough geometry", value: String(routes.filter((route) => route.qaStatus.geometry === "rough").length) },
    { label: "City", value: "Montreal" }
  ];

  return (
    <AppShell>
      <main className="pb-24 md:pb-0">
        <PageContainer className="space-y-8 py-8">
          <div>
            <Chip tone="tertiary">Internal review dashboard</Chip>
            <h1 className="mt-3 text-headline-mobile text-on-surface md:text-headline-lg">Route QA</h1>
            <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
              Review content, geometry, field-check, and accessibility readiness for Montreal routes.
            </p>
          </div>
          <MetricRibbon metrics={metrics} />
          <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
            <div className="space-y-3">
              {routes.map((route) => (
                <Card className="p-4" key={route.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-body-lg font-semibold text-on-surface">{route.title}</h2>
                      <p className="mt-1 text-label-sm text-on-surface-variant">
                        Content {route.qaStatus.content} · Geometry {route.qaStatus.geometry} · Field {route.qaStatus.fieldCheck}
                      </p>
                    </div>
                    <Chip tone={route.qaStatus.overall === "published" ? "primary" : "tertiary"}>{route.qaStatus.overall}</Chip>
                  </div>
                </Card>
              ))}
            </div>
            <MapShell className="min-h-[560px]" places={places} route={routes[0]} title="Route QA map preview" />
          </div>
        </PageContainer>
      </main>
    </AppShell>
  );
}
