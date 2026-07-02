"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const errorId = error.digest ?? "runtime-error";

  useEffect(() => {
    console.error("Meaningful Routes page error", { errorId, message: error.message });
  }, [error.message, errorId]);

  return (
    <AppShell>
      <main className="pb-24 md:pb-0">
        <PageContainer className="py-12">
          <section className="max-w-2xl rounded-card border border-outline-variant bg-surface-container-lowest p-6 shadow-card">
            <Chip tone="primary">Something went wrong</Chip>
            <h1 className="mt-4 text-headline-mobile text-on-surface md:text-headline-lg">This route needs another look</h1>
            <p className="mt-3 text-body-md text-on-surface-variant">
              The page could not be loaded. Error ID: <span className="font-semibold text-on-surface">{errorId}</span>
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="min-h-11 rounded-control bg-primary px-4 py-2 text-label-md text-on-primary" onClick={reset} type="button">
                Try again
              </button>
              <ButtonLink href="/routes" variant="secondary">Browse routes</ButtonLink>
            </div>
          </section>
        </PageContainer>
      </main>
    </AppShell>
  );
}
