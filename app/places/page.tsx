import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { PlacesPageClient } from "@/components/places/places-page-client";
import { Chip } from "@/components/ui/chip";
import { getPlaces } from "@/lib/data/index";

export const metadata: Metadata = {
  title: "Montreal Places And Monuments",
  description: "Browse Montreal landmarks, monuments, viewpoints, churches, parks, markets, public art, and neighborhood stories.",
  alternates: {
    canonical: "/places"
  }
};

export default function PlacesPage() {
  const places = getPlaces();

  return (
    <AppShell>
      <main className="pb-24 md:pb-0">
        <PageContainer className="space-y-6 py-8">
          <div>
            <Chip tone="primary">Monuments and places</Chip>
            <h1 className="mt-3 text-headline-mobile text-on-surface md:text-headline-lg">Discover Montreal places, monuments, and hidden gems</h1>
            <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
              Browse landmarks, viewpoints, churches, museums, markets, public art, parks, and neighborhood places by story, theme, and area.
            </p>
          </div>
          <PlacesPageClient places={places} />
        </PageContainer>
      </main>
    </AppShell>
  );
}
