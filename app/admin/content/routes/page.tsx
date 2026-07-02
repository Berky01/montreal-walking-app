import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { getRoutes } from "@/lib/data/index";

export default function AdminRoutesContentPage() {
  const routes = getRoutes();

  return (
    <AppShell>
      <main className="pb-24 md:pb-0">
        <PageContainer className="space-y-6 py-8">
          <div>
            <Chip tone="tertiary">Route content</Chip>
            <h1 className="mt-3 text-headline-mobile text-on-surface md:text-headline-lg">Route readiness</h1>
          </div>
          <div className="grid gap-3">
            {routes.map((route) => (
              <Card className="p-4" key={route.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-body-lg font-semibold text-on-surface">{route.title}</h2>
                    <p className="mt-1 text-label-sm text-on-surface-variant">
                      {route.stops.length} stops · {route.geometry.coordinates.length} geometry points · QA {route.qaScore}/100
                    </p>
                  </div>
                  <Chip tone={route.contentStatus === "ready" ? "primary" : "tertiary"}>{route.contentStatus}</Chip>
                </div>
                <div className="mt-3 grid gap-2 text-label-sm text-on-surface-variant md:grid-cols-4">
                  <span>Sources: {route.sources.length}</span>
                  <span>Safety: {route.safetyNotes.length}</span>
                  <span>Accessibility: {route.accessibilityNotes.length}</span>
                  <span>Field: {route.qaStatus.fieldCheck}</span>
                </div>
              </Card>
            ))}
          </div>
        </PageContainer>
      </main>
    </AppShell>
  );
}
