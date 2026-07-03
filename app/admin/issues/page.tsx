import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { areAdminWriteActionsEnabled } from "@/lib/admin/access";
import { getIssueReports } from "@/lib/data/index";
import type { IssueReport } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function AdminIssuesPage() {
  const issues = getIssueReports();
  const canWrite = areAdminWriteActionsEnabled();

  return (
    <AppShell>
      <main className="pb-24 md:pb-0">
        <PageContainer className="space-y-6 py-8">
          <div>
            <Chip tone="tertiary">Issue reports</Chip>
            <h1 className="mt-3 text-headline-mobile text-on-surface md:text-headline-lg">Reported route issues</h1>
            <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
              Review reports submitted through the public route and place issue form. The queue is backed by the server issue store.
            </p>
            {!canWrite ? (
              <p className="mt-3 max-w-2xl rounded-control border border-outline-variant bg-surface-container-low px-3 py-2 text-label-md text-on-surface-variant">
                Triage updates are read-only until admin write actions are enabled in a protected environment.
              </p>
            ) : null}
          </div>
          {issues.length ? (
            <div className="grid gap-3">
              {issues.map((issue) => (
                <Card className="p-4" key={issue.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-body-lg font-semibold capitalize text-on-surface">{formatLabel(issue.category)}</h2>
                      <p className="mt-1 text-label-sm text-on-surface-variant">
                        {formatContext(issue)} · {new Date(issue.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Chip tone="tertiary">{issue.status}</Chip>
                  </div>
                  <dl className="mt-3 grid gap-2 text-label-md text-on-surface-variant sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold text-on-surface">Severity</dt>
                      <dd>{issue.severity ?? "not set"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-on-surface">Updated</dt>
                      <dd>{issue.updatedAt ? new Date(issue.updatedAt).toLocaleString() : "not triaged"}</dd>
                    </div>
                    {issue.reviewer ? (
                      <div>
                        <dt className="font-semibold text-on-surface">Reviewer</dt>
                        <dd>{issue.reviewer}</dd>
                      </div>
                    ) : null}
                    {issue.resolutionNotes ? (
                      <div>
                        <dt className="font-semibold text-on-surface">Resolution</dt>
                        <dd>{issue.resolutionNotes}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <p className="mt-3 text-body-md text-on-surface-variant">{issue.description}</p>
                  {canWrite ? <IssueTriageForm issue={issue} /> : null}
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState title="No issue reports" description="New public reports will appear here after submission." />
          )}
        </PageContainer>
      </main>
    </AppShell>
  );
}

function IssueTriageForm({ issue }: { issue: IssueReport }) {
  return (
    <form action="/api/admin/issues" className="mt-4 grid gap-3 border-t border-outline-variant pt-4" method="post">
      <input name="id" type="hidden" value={issue.id} />
      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-2 text-label-md text-on-surface" htmlFor={`${issue.id}-status`}>
          Status
          <select className="h-11 rounded-control border border-outline-variant bg-white px-3 text-body-md" defaultValue={issue.status} id={`${issue.id}-status`} name="status">
            <option value="new">New</option>
            <option value="reviewing">Reviewing</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </label>
        <label className="grid gap-2 text-label-md text-on-surface" htmlFor={`${issue.id}-severity`}>
          Severity
          <select className="h-11 rounded-control border border-outline-variant bg-white px-3 text-body-md" defaultValue={issue.severity ?? ""} id={`${issue.id}-severity`} name="severity">
            <option value="">Not set</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label className="grid gap-2 text-label-md text-on-surface" htmlFor={`${issue.id}-reviewer`}>
          Reviewer
          <input className="h-11 rounded-control border border-outline-variant bg-white px-3 text-body-md" defaultValue={issue.reviewer ?? ""} id={`${issue.id}-reviewer`} name="reviewer" type="text" />
        </label>
      </div>
      <label className="grid gap-2 text-label-md text-on-surface" htmlFor={`${issue.id}-resolutionNotes`}>
        Resolution notes
        <textarea className="min-h-24 rounded-control border border-outline-variant bg-white px-3 py-2 text-body-md" defaultValue={issue.resolutionNotes ?? ""} id={`${issue.id}-resolutionNotes`} name="resolutionNotes" />
      </label>
      <Button className="w-fit" type="submit" variant="secondary">Update triage</Button>
    </form>
  );
}

function formatContext(issue: IssueReport): string {
  return [issue.routeSlug, issue.placeSlug, issue.stopId].filter(Boolean).join(" / ") || "General";
}

function formatLabel(value: string): string {
  return value.replaceAll("_", " ");
}
