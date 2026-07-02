import { IssueReportForm } from "@/components/feedback/issue-report-form";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { Chip } from "@/components/ui/chip";
import { getPlaces, getRoutes } from "@/lib/data/index";

export default function ReportIssuePage() {
  const routes = getRoutes();
  const places = getPlaces();

  return (
    <AppShell>
      <main className="pb-24 md:pb-0">
        <PageContainer className="max-w-3xl space-y-6 py-8">
          <div>
            <Chip tone="primary">Place and route feedback</Chip>
            <h1 className="mt-3 text-headline-mobile text-on-surface md:text-headline-lg">Report a place or route issue</h1>
            <p className="mt-2 text-body-md text-on-surface-variant">
              Save place details, photo/source, construction, safety, accessibility, or route updates as local notes on this browser.
            </p>
          </div>
          <IssueReportForm places={places} routes={routes} />
        </PageContainer>
      </main>
    </AppShell>
  );
}
