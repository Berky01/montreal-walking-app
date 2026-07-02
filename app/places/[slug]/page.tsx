import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { SplitMapLayout } from "@/components/layout/split-map-layout";
import { MapShell } from "@/components/map/map-shell";
import { AttributionLine } from "@/components/media/AttributionLine";
import { PlaceCard } from "@/components/places/place-card";
import { RelatedRoutes } from "@/components/places/related-routes";
import { RouteAccessibilityNotes, RouteSafetyNotes } from "@/components/routes/route-notes";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { PlaceHero } from "@/components/visual/visuals";
import { getPlaceBySlug, getPlaces } from "@/lib/data/index";

export function generateStaticParams() {
  return getPlaces().map((place) => ({ slug: place.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const place = getPlaceBySlug(slug);

  if (!place) {
    return {};
  }

  return {
    title: place.name,
    description: place.shortDescription,
    alternates: {
      canonical: `/places/${place.slug}`
    },
    openGraph: {
      title: place.name,
      description: place.shortDescription,
      type: "article",
      url: `/places/${place.slug}`
    }
  };
}

export default async function PlaceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = getPlaceBySlug(slug);

  if (!place) {
    notFound();
  }
  const places = getPlaces();
  const nearbyPlaces = places.filter((item) => item.slug !== place.slug && item.area === place.area).slice(0, 4);

  return (
    <AppShell>
      <main className="pb-24 md:pb-0">
        <PlaceHero place={place} />

        <PageContainer className="space-y-8 py-8">
          <SplitMapLayout
            content={
              <div className="space-y-6">
                <Card className="p-5">
                  <h2 className="text-headline-mobile text-on-surface">Why it matters</h2>
                  <p className="mt-3 text-body-md text-on-surface-variant">{place.whyItMatters}</p>
                  <h2 className="mt-6 text-headline-mobile text-on-surface">Story</h2>
                  <p className="mt-3 text-body-md text-on-surface-variant">{place.story}</p>
                </Card>

                <Card className="p-5">
                  <h2 className="text-headline-mobile text-on-surface">What to notice</h2>
                  <ul className="mt-3 space-y-2 text-body-md text-on-surface-variant">
                    {place.whatToNotice.map((item) => (
                      <li className="flex gap-2" key={item}>
                        <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="p-5">
                  <h2 className="text-headline-mobile text-on-surface">Practical info</h2>
                  <ul className="mt-3 space-y-2 text-body-md text-on-surface-variant">
                    {place.practicalInfo.map((item) => (
                      <li className="flex gap-2" key={item}>
                        <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-secondary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {place.tags.map((tag) => (
                      <Chip key={tag}>{tag}</Chip>
                    ))}
                  </div>
                </Card>

                <Card className="p-5">
                  <h2 className="text-headline-mobile text-on-surface">Discovery notes</h2>
                  <dl className="mt-4 grid gap-3 text-body-md text-on-surface-variant md:grid-cols-3">
                    <div>
                      <dt className="text-label-sm">Area</dt>
                      <dd className="mt-1 font-semibold text-on-surface">{place.area}</dd>
                    </div>
                    <div>
                      <dt className="text-label-sm">Updated</dt>
                      <dd className="mt-1 font-semibold text-on-surface">{new Date(place.lastReviewedAt).toLocaleDateString("en-CA")}</dd>
                    </div>
                  </dl>
                  {place.periodOrStyle ? <p className="mt-4 text-body-md text-on-surface-variant">{place.periodOrStyle}</p> : null}
                  <AttributionLine className="mt-4" media={place.media} sources={place.sources} />
                </Card>

                <section className="grid gap-4">
                  <RouteSafetyNotes notes={place.safetyNotes} />
                  <RouteAccessibilityNotes notes={place.accessibilityNotes} />
                </section>
              </div>
            }
            map={<MapShell className="sticky top-24 min-h-[640px]" places={[place, ...nearbyPlaces]} selected={{ type: "place", slug: place.slug }} title={`Explore around ${place.name}`} />}
          />
          <RelatedRoutes place={place} />
          {nearbyPlaces.length ? (
            <section>
              <h2 className="text-headline-mobile text-on-surface">Nearby places</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {nearbyPlaces.map((item) => (
                  <PlaceCard key={item.id} place={item} variant="compact" />
                ))}
              </div>
            </section>
          ) : null}
        </PageContainer>
      </main>
    </AppShell>
  );
}
