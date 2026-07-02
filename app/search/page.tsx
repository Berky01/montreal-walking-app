import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { SearchPageClient } from "@/components/search/search-page-client";
import { Chip } from "@/components/ui/chip";
import { getPlaces, getRoutes } from "@/lib/data/index";

export const metadata: Metadata = {
  title: "Search Montreal Places",
  description: "Search Montreal places, monuments, neighborhoods, themes, and optional curated routes.",
  alternates: {
    canonical: "/search"
  }
};

export default function SearchPage() {
  const routes = getRoutes();
  const places = getPlaces();

  return (
    <AppShell>
      <main className="pb-24 md:pb-0">
        <PageContainer className="space-y-6 py-8">
          <div>
            <Chip tone="primary">Discovery search</Chip>
            <h1 className="mt-3 text-headline-mobile text-on-surface md:text-headline-lg">Search places, monuments, neighborhoods, or themes</h1>
            <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
              Find landmarks, hidden courtyards, churches, markets, viewpoints, public art, and optional routes that connect them.
            </p>
          </div>
          <SearchPageClient places={places} routes={routes} />
        </PageContainer>
      </main>
    </AppShell>
  );
}
