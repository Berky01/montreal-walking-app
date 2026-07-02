import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

export default function NotFoundPage() {
  return (
    <AppShell>
      <main className="pb-24 md:pb-0">
        <PageContainer className="py-12">
          <section className="max-w-2xl rounded-card border border-outline-variant bg-surface-container-lowest p-6 shadow-card">
            <Chip tone="primary">Route not found</Chip>
            <h1 className="mt-4 text-headline-mobile text-on-surface md:text-headline-lg">This page is not on the map</h1>
            <p className="mt-3 text-body-md text-on-surface-variant">
              The route, place, or page may have moved. Start from the Montreal places catalog to find a current discovery.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <ButtonLink href="/routes">Browse routes</ButtonLink>
              <ButtonLink href="/places" variant="secondary">Browse places</ButtonLink>
            </div>
          </section>
        </PageContainer>
      </main>
    </AppShell>
  );
}
