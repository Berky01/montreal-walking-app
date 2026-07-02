"use client";

import { Check, History } from "lucide-react";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { completeRouteSession, getWalkHistoryItems } from "@/lib/local-state";
import type { Route } from "@/lib/types";

export function SaveHistoryButton({ route }: { route: Route; actualDuration?: number }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(getWalkHistoryItems().some((item) => item.routeSlug === route.slug));
  }, [route.slug]);

  return (
    <ButtonLink
      href="/history"
      onClick={() => {
        if (!getWalkHistoryItems().some((item) => item.routeSlug === route.slug)) {
          completeRouteSession(route);
        }
        setSaved(true);
      }}
      variant="primary"
    >
      {saved ? <Check aria-hidden="true" size={17} /> : <History aria-hidden="true" size={17} />}
      {saved ? "Saved to history" : "Save to history"}
    </ButtonLink>
  );
}
