import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { PreferencesForm } from "@/components/library/preferences-form";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";

export default function SettingsPage() {
  return (
    <AppShell>
      <main className="pb-24 md:pb-0">
        <PageContainer className="grid gap-6 py-8 lg:grid-cols-[1fr_0.55fr]">
          <div>
            <Chip tone="primary">Discovery preferences</Chip>
            <h1 className="mt-3 text-headline-mobile text-on-surface md:text-headline-lg">Discovery preferences</h1>
            <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
              Choose place themes, discovery style, accessibility needs, and optional walking preferences for this browser.
            </p>
            <div className="mt-6">
              <PreferencesForm />
            </div>
          </div>
          <Card className="h-fit p-5">
            <h2 className="text-headline-mobile text-on-surface">How preferences are used</h2>
            <p className="mt-2 text-body-md text-on-surface-variant">
              Discovery search, place suggestions, and optional route cards use these choices immediately, including miles or kilometers and relaxed, balanced, or brisk time estimates.
            </p>
          </Card>
        </PageContainer>
      </main>
    </AppShell>
  );
}
