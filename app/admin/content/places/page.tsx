import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { getAllPlaces } from "@/lib/data/index";

export default function AdminPlacesContentPage() {
  const places = getAllPlaces();

  return (
    <AppShell>
      <main className="pb-24 md:pb-0">
        <PageContainer className="space-y-6 py-8">
          <div>
            <Chip tone="tertiary">Place content</Chip>
            <h1 className="mt-3 text-headline-mobile text-on-surface md:text-headline-lg">Place readiness</h1>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {places.map((place) => (
              <Card className="p-4" key={place.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-body-lg font-semibold text-on-surface">{place.name}</h2>
                    <p className="mt-1 text-label-sm text-on-surface-variant">
                      {place.area} · {place.coordinates.lat.toFixed(4)}, {place.coordinates.lng.toFixed(4)}
                    </p>
                  </div>
                  <Chip tone={place.contentStatus === "ready" ? "primary" : "tertiary"}>{place.contentStatus}</Chip>
                </div>
                <div className="mt-3 grid gap-2 text-label-sm text-on-surface-variant md:grid-cols-3">
                  <span>Sources: {place.sources.length}</span>
                  <span>Safety: {place.safetyNotes.length}</span>
                  <span>Accessibility: {place.accessibilityNotes.length}</span>
                </div>
              </Card>
            ))}
          </div>
        </PageContainer>
      </main>
    </AppShell>
  );
}
