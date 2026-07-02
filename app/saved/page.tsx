import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { SavedLibraryClient } from "@/components/library/saved-library-client";
import { Chip } from "@/components/ui/chip";
import { getPlaces, getRoutes } from "@/lib/data/index";

export default function SavedPage() {
  const routes = getRoutes();
  const places = getPlaces();

  return (
    <AppShell>
      <main className="pb-24 md:pb-0">
        <PageContainer className="space-y-8 py-8">
          <div>
            <Chip tone="primary">Local library</Chip>
            <h1 className="mt-3 text-headline-mobile text-on-surface md:text-headline-lg">Saved discoveries</h1>
            <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
              Keep places, neighborhoods, and optional routes handy on this device, then remove them whenever plans change.
            </p>
          </div>
          <SavedLibraryClient places={places} routes={routes} />
        </PageContainer>
      </main>
    </AppShell>
  );
}
