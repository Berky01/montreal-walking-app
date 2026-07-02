import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { HistoryClient } from "@/components/walk/history-client";
import { Chip } from "@/components/ui/chip";
import { getRoutes } from "@/lib/data/index";

export default function HistoryPage() {
  const routes = getRoutes();

  return (
    <AppShell>
      <main className="pb-24 md:pb-0">
        <PageContainer className="space-y-8 py-8">
          <div>
            <Chip tone="primary">Exploration history</Chip>
            <h1 className="mt-3 text-headline-mobile text-on-surface md:text-headline-lg">Exploration history</h1>
            <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
              Completed guided discoveries appear here after you save them from a route completion page.
            </p>
          </div>
          <HistoryClient routes={routes} />
        </PageContainer>
      </main>
    </AppShell>
  );
}
