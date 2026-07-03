import { Star } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { RouteCard } from "@/components/routes/route-card";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShareButton } from "@/components/share/share-button";
import { RouteVisual } from "@/components/visual/visuals";
import { CompletionJournalClient, CompletionStopsClient, CompletionSummaryClient } from "@/components/walk/completion-summary-client";
import { SaveHistoryButton } from "@/components/walk/save-history-button";
import { getRouteBySlug, getRoutes } from "@/lib/data/index";

export function generateStaticParams() {
  return getRoutes().map((route) => ({ slug: route.slug }));
}

export default async function RouteCompletePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const route = getRouteBySlug(slug);

  if (!route) {
    notFound();
  }

  const suggestions = getRoutes().filter((item) => item.slug !== route.slug).slice(0, 3);

  return (
    <AppShell>
      <main className="pb-24 md:pb-0">
        <PageContainer className="space-y-8 py-8">
          <section className="grid overflow-hidden rounded-card border border-outline-variant bg-surface-container-lowest shadow-card md:grid-cols-[0.8fr_1fr]">
            <RouteVisual className="min-h-[240px] rounded-none" route={route} size="hero" />
            <div className="p-6 text-center md:text-left">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary md:mx-0">
                <Star aria-hidden="true" size={22} />
              </div>
              <h1 className="mt-4 text-headline-mobile text-on-surface md:text-headline-lg">Guided discovery completed</h1>
              <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
                {route.title} is ready to save to your local exploration history, share, or explore again.
              </p>
              <div className="mt-5 flex justify-center gap-2 md:justify-start">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-primary" key={rating} type="button" aria-label={`Rate ${rating} stars`}>
                    <Star aria-hidden="true" size={18} />
                  </button>
                ))}
              </div>
            </div>
          </section>

          <CompletionSummaryClient route={route} />
          <CompletionJournalClient route={route} />

          <div className="grid gap-4 md:grid-cols-[1fr_0.7fr]">
            <Card className="p-5">
              <h2 className="text-headline-mobile text-on-surface">Places completed</h2>
              <CompletionStopsClient route={route} />
            </Card>
            <Card className="p-5">
              <h2 className="text-headline-mobile text-on-surface">Save the memory</h2>
              <p className="mt-2 text-body-md text-on-surface-variant">
                Save this completed guided discovery to local history for the browser session.
              </p>
              <div className="mt-4 grid gap-2">
                <SaveHistoryButton route={route} />
                <ShareButton text={`I explored ${route.title} with Meaningful Routes.`} title={`${route.title} completed`} />
                <ButtonLink href="/routes" variant="secondary">Browse optional routes</ButtonLink>
              </div>
            </Card>
          </div>

          <section>
            <h2 className="text-headline-mobile text-on-surface">Suggested ways to explore next</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {suggestions.map((item) => (
                <RouteCard key={item.id} route={item} />
              ))}
            </div>
          </section>
        </PageContainer>
      </main>
    </AppShell>
  );
}
