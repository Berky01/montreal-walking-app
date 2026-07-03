import { FileText } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { MapShell } from "@/components/map/map-shell";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { MetricRibbon } from "@/components/ui/metric-ribbon";
import { getAllPlaces, getAllRoutes } from "@/lib/data/index";

export default function RouteQaPage() {
  const routes = getAllRoutes();
  const places = getAllPlaces();
  const sourceReviewRoutes = routes.filter((route) => route.qaStatus.sources !== "ready" || route.sources.length === 0);
  const metrics = [
    { label: "Routes", value: String(routes.length) },
    { label: "Review", value: String(routes.filter((route) => route.qaStatus.overall === "review").length) },
    { label: "Source QA", value: `${routes.length - sourceReviewRoutes.length}/${routes.length}`, helper: "Ready routes" },
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
                        Content {route.qaStatus.content} · Geometry {route.qaStatus.geometry} · Sources {route.qaStatus.sources} · Field {route.qaStatus.fieldCheck}
                      </p>
                    </div>
                    <Chip tone={route.qaStatus.overall === "published" ? "primary" : "tertiary"}>{route.qaStatus.overall}</Chip>
                  </div>
                </Card>
              ))}
            </div>
            <div className="space-y-4">
              <Card className="p-5">
                <div className="flex items-center gap-2 text-primary">
                  <FileText aria-hidden="true" size={18} />
                  <h2 className="text-headline-mobile text-on-surface">Source QA</h2>
                </div>
                {sourceReviewRoutes.length ? (
                  <ul className="mt-4 space-y-3">
                    {sourceReviewRoutes.map((route) => (
                      <li className="rounded-card bg-surface-container-low p-3" key={route.id}>
                        <p className="text-body-md font-semibold text-on-surface">{route.title}</p>
                        <p className="mt-1 text-label-sm text-on-surface-variant">
                          {route.sources.length} sources · status {route.qaStatus.sources} · score {route.qaScore}/100
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-body-md text-on-surface-variant">All route source records are ready for the current mock data set.</p>
                )}
              </Card>
              <MapShell className="min-h-[560px]" places={places} route={routes[0]} title="Route QA map preview" />
            </div>
          </div>
        </PageContainer>
      </main>
    </AppShell>
  );
}
