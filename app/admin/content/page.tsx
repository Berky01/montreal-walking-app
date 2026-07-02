import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { MetricRibbon } from "@/components/ui/metric-ribbon";
import { getAllPlaces, getAllRoutes, getIssueReports, getPlaces, getRoutes } from "@/lib/data/index";
import { summarizeContentReadiness, validateDataCatalog } from "@/lib/data/validators";

export default function AdminContentPage() {
  const routes = getAllRoutes();
  const places = getAllPlaces();
  const publicRoutes = getRoutes();
  const publicPlaces = getPlaces();
  const validation = validateDataCatalog({ routes, places });
  const readiness = summarizeContentReadiness({ routes, places });
  const issueReports = getIssueReports();
  const metrics = [
    { label: "Public routes", value: String(publicRoutes.length) },
    { label: "Public places", value: String(publicPlaces.length) },
    { label: "Total routes", value: String(routes.length) },
    { label: "Total places", value: String(places.length) },
    { label: "Issues", value: String(issueReports.length) },
    { label: "Validation", value: validation.ok ? "Pass" : "Review" }
  ];
  const checklist = [
    ["No missing coordinates", readiness.missingCoordinates.length === 0],
    ["No missing geometry", readiness.missingGeometry.length === 0],
    ["Sources attached", readiness.missingSourceAttribution.length === 0],
    ["Safety notes attached", readiness.missingSafetyNotes.length === 0],
    ["Accessibility notes attached", readiness.missingAccessibilityNotes.length === 0],
    ["Data validator passes", validation.ok]
  ];

  return (
    <AppShell>
      <main className="pb-24 md:pb-0">
        <PageContainer className="space-y-8 py-8">
          <div>
            <Chip tone="tertiary">Internal content tools</Chip>
            <h1 className="mt-3 text-headline-mobile text-on-surface md:text-headline-lg">Content readiness</h1>
            <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
              Review Montreal route and place readiness before publishing or field QA.
            </p>
          </div>
          <MetricRibbon metrics={metrics} />
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-5">
              <h2 className="text-headline-mobile text-on-surface">Publish checklist</h2>
              <div className="mt-4 grid gap-2">
                {checklist.map(([label, ok]) => (
                  <div className="flex items-center justify-between gap-3 rounded-control border border-outline-variant p-3" key={String(label)}>
                    <span className="text-body-md text-on-surface">{label}</span>
                    <Chip tone={ok ? "primary" : "tertiary"}>{ok ? "ready" : "review"}</Chip>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="text-headline-mobile text-on-surface">Admin sections</h2>
              <div className="mt-4 grid gap-2">
                <ButtonLink href="/admin/content/routes" variant="secondary">Route content</ButtonLink>
                <ButtonLink href="/admin/content/places" variant="secondary">Place content</ButtonLink>
                <ButtonLink href="/admin/route-builder" variant="secondary">Route builder</ButtonLink>
                <ButtonLink href="/admin/route-qa" variant="secondary">Route QA</ButtonLink>
                <ButtonLink href="/admin/issues" variant="secondary">Issue reports</ButtonLink>
              </div>
            </Card>
          </div>
        </PageContainer>
      </main>
    </AppShell>
  );
}
