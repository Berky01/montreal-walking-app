"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { StickyActionBar } from "@/components/layout/sticky-action-bar";
import { SaveButton } from "@/components/library/save-button";
import { ShareButton } from "@/components/share/share-button";
import { ButtonLink } from "@/components/ui/button";
import { getActiveRouteSession } from "@/lib/local-state";
import type { Route } from "@/lib/types";

export function RouteDetailStickyActions({ route }: { route: Route }) {
  const [hasActiveSession, setHasActiveSession] = useState(false);

  useEffect(() => {
    function refresh() {
      setHasActiveSession(Boolean(getActiveRouteSession(route.slug)));
    }

    refresh();
    window.addEventListener("meaningful-routes-local-state", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("meaningful-routes-local-state", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [route.slug]);

  return (
    <StickyActionBar className="md:hidden">
      <ButtonLink className="min-h-12 flex-1" href={`/routes/${route.slug}/live`}>
        {hasActiveSession ? "Resume discovery" : "Start optional walk"}
        <ArrowRight aria-hidden="true" size={17} />
      </ButtonLink>
      <SaveButton compact itemId={route.id} itemSlug={route.slug} itemTitle={route.title} itemType="route" />
      <ShareButton title={route.title} text={route.description} variant="secondary" />
    </StickyActionBar>
  );
}
