import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { RoutesPageClient } from "@/components/routes/routes-page-client";
import { ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { getPlaces, getRoutes } from "@/lib/data/index";

export const metadata: Metadata = {
  title: "Montreal Route Collections",
  description: "Browse optional Montreal route collections that connect meaningful places, monuments, neighborhoods, and stories.",
  alternates: {
    canonical: "/routes"
  }
};

export default function RoutesPage() {
  const routes = getRoutes();
  const places = getPlaces();

  return (
    <AppShell>
      <main className="pb-24 md:pb-0">
        <PageContainer className="space-y-6 py-8">
          <div>
            <Chip tone="primary">Optional route collections</Chip>
            <h1 className="mt-3 text-headline-mobile text-on-surface md:text-headline-lg">Curated ways to connect Montreal places</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="max-w-2xl text-body-md text-on-surface-variant">
                Filter optional walks by time and theme after choosing the places, monuments, and neighborhood stories you want to connect.
              </p>
              <ButtonLink href="/routes/compare" variant="secondary">Compare optional routes</ButtonLink>
            </div>
          </div>
          <RoutesPageClient places={places} routes={routes} />
        </PageContainer>
      </main>
    </AppShell>
  );
}
