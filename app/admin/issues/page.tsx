import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { getIssueReports } from "@/lib/data/index";

export default function AdminIssuesPage() {
  const issues = getIssueReports();

  return (
    <AppShell>
      <main className="pb-24 md:pb-0">
        <PageContainer className="space-y-6 py-8">
          <div>
            <Chip tone="tertiary">Issue reports</Chip>
            <h1 className="mt-3 text-headline-mobile text-on-surface md:text-headline-lg">Reported route issues</h1>
          </div>
          {issues.length ? (
            <div className="grid gap-3">
              {issues.map((issue) => (
                <Card className="p-4" key={issue.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-body-lg font-semibold text-on-surface">{issue.category.replace("_", " ")}</h2>
                      <p className="mt-1 text-label-sm text-on-surface-variant">
                        {issue.routeSlug ?? issue.placeSlug ?? "General"} · {new Date(issue.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Chip tone="tertiary">{issue.status}</Chip>
                  </div>
                  <p className="mt-3 text-body-md text-on-surface-variant">{issue.description}</p>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState title="No issue reports" description="Submitted route reports will appear here for review." />
          )}
        </PageContainer>
      </main>
    </AppShell>
  );
}
