import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { RouteCompareClient } from "@/components/routes/route-compare-client";
import { Chip } from "@/components/ui/chip";
import { getRoutes } from "@/lib/data/index";

export default function RouteComparePage() {
  const routes = getRoutes();

  return (
    <AppShell>
      <main className="pb-24 md:pb-0">
        <PageContainer className="space-y-6 py-8">
          <div>
            <Chip tone="primary">Optional route comparison</Chip>
            <h1 className="mt-3 text-headline-mobile text-on-surface md:text-headline-lg">Compare ways to connect Montreal places</h1>
            <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
              Compare selected optional walks from this browser using route metrics, place counts, practical notes, weather fit, and accessibility flags.
            </p>
          </div>
          <RouteCompareClient routes={routes} />
        </PageContainer>
      </main>
    </AppShell>
  );
}
