"use client";

import { Bookmark, History, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { getActiveRouteSessions, getSavedItems, getWalkHistoryItems } from "@/lib/local-state";
import type { RouteSession, SavedItem, WalkSession } from "@/lib/types";

export function LocalStateSummary() {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [sessions, setSessions] = useState<RouteSession[]>([]);
  const [history, setHistory] = useState<WalkSession[]>([]);

  useEffect(() => {
    function refresh() {
      setSavedItems(getSavedItems());
      setSessions(getActiveRouteSessions());
      setHistory(getWalkHistoryItems());
    }

    refresh();
    window.addEventListener("meaningful-routes-local-state", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("meaningful-routes-local-state", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const activeSession = sessions.find((session) => session.status === "active" || session.status === "paused");
  const cards = [
    activeSession ? (
      <div className="rounded-card border border-outline-variant bg-surface-container-lowest p-4 shadow-card" key="continue">
        <div className="flex items-center gap-2 text-primary">
          <Play aria-hidden="true" size={18} />
          <h2 className="text-label-md">Continue guided discovery</h2>
        </div>
        <p className="mt-2 text-body-md text-on-surface">{activeSession.routeTitle}</p>
        <ButtonLink className="mt-3 w-full" href={`/routes/${activeSession.routeSlug}/live`} variant="secondary">
          Resume discovery
        </ButtonLink>
      </div>
    ) : null,
    <div className="rounded-card border border-outline-variant bg-surface-container-lowest p-4 shadow-card" key="saved">
      <div className="flex items-center gap-2 text-primary">
        <Bookmark aria-hidden="true" size={18} />
        <h2 className="text-label-md">Saved discoveries</h2>
      </div>
      <p className="mt-2 text-body-md text-on-surface">{savedItems.length} saved places and routes</p>
      <ButtonLink className="mt-3 w-full" href="/saved" variant="secondary">
        Open saved
      </ButtonLink>
    </div>,
    <div className="rounded-card border border-outline-variant bg-surface-container-lowest p-4 shadow-card" key="recent">
      <div className="flex items-center gap-2 text-primary">
        <History aria-hidden="true" size={18} />
        <h2 className="text-label-md">Recent exploration</h2>
      </div>
      <p className="mt-2 text-body-md text-on-surface">{history.length ? `${history.length} guided visits completed` : "No guided visits completed yet"}</p>
      <ButtonLink className="mt-3 w-full" href="/history" variant="secondary">
        View history
      </ButtonLink>
    </div>
  ].filter(Boolean);

  return (
    <section className="grid gap-3 md:grid-cols-3">
      {cards}
    </section>
  );
}
