import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { LiveRouteClient } from "@/components/walk/live-route-client";
import { getPlaces, getRouteBySlug, getRoutes } from "@/lib/data/index";

export function generateStaticParams() {
  return getRoutes().map((route) => ({ slug: route.slug }));
}

export default async function LiveRoutePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const route = getRouteBySlug(slug);

  if (!route) {
    notFound();
  }

  return (
    <AppShell>
      <main className="pb-24 md:pb-0">
        <PageContainer className="py-8">
          <LiveRouteClient places={getPlaces()} route={route} />
        </PageContainer>
      </main>
    </AppShell>
  );
}
