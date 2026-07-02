import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { PreferenceRouteMetrics } from "@/components/routes/preference-route-metrics";
import { RouteGuideClient } from "@/components/routes/route-guide-client";
import { RouteHero } from "@/components/visual/visuals";
import { getPlaces, getRouteBySlug, getRoutes } from "@/lib/data/index";

export function generateStaticParams() {
  return getRoutes().map((route) => ({ slug: route.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const route = getRouteBySlug(slug);

  if (!route) {
    return {};
  }

  return {
    title: route.title,
    description: route.description,
    alternates: {
      canonical: `/routes/${route.slug}`
    },
    openGraph: {
      title: route.title,
      description: route.description,
      type: "article",
      url: `/routes/${route.slug}`
    }
  };
}

export default async function RouteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const route = getRouteBySlug(slug);

  if (!route) {
    notFound();
  }

  const places = getPlaces();
  const start = places.find((place) => place.id === route.startPlaceId);

  return (
    <AppShell>
      <main className="pb-24 md:pb-0">
        <RouteHero route={route} startName={start?.name} />
        <PageContainer className="space-y-8 py-8">
          <PreferenceRouteMetrics route={route} />
          <RouteGuideClient places={places} route={route} />
        </PageContainer>
      </main>
    </AppShell>
  );
}
