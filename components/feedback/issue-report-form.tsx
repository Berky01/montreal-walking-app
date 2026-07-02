"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { validateIssueReportInput } from "@/lib/issue-reports";
import { saveLocalIssueReport } from "@/lib/local-state";
import type { Place, Route } from "@/lib/types";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function IssueReportForm({ places, routes }: { places: Place[]; routes: Route[] }) {
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const [selectedRouteSlug, setSelectedRouteSlug] = useState(routes[0]?.slug ?? "");
  const [selectedStopId, setSelectedStopId] = useState("");
  const [selectedPlaceSlug, setSelectedPlaceSlug] = useState("");
  const selectedRoute = useMemo(() => routes.find((route) => route.slug === selectedRouteSlug), [routes, selectedRouteSlug]);
  const returnHref = selectedPlaceSlug ? `/places/${selectedPlaceSlug}` : selectedRouteSlug ? `/routes/${selectedRouteSlug}${selectedStopId ? "/live" : ""}` : "/places";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const routeSlug = params.get("route");
    const stopId = params.get("stop");
    const placeSlug = params.get("place");
    const routeFromQuery = routes.find((route) => route.slug === routeSlug);

    if (routeFromQuery) {
      setSelectedRouteSlug(routeFromQuery.slug);
    }

    const routeStop = routeFromQuery?.stops.find((stop) => stop.id === stopId);
    if (routeStop) {
      setSelectedStopId(routeStop.id);
      const stopPlace = places.find((place) => place.id === routeStop.placeId);
      if (stopPlace && !placeSlug) {
        setSelectedPlaceSlug(stopPlace.slug);
      }
    }

    if (placeSlug && places.some((place) => place.slug === placeSlug)) {
      setSelectedPlaceSlug(placeSlug);
    }
  }, [places, routes]);

  useEffect(() => {
    if (!selectedRoute || !selectedStopId) {
      return;
    }

    const stop = selectedRoute.stops.find((item) => item.id === selectedStopId);
    if (!stop) {
      setSelectedStopId("");
      return;
    }

    const stopPlace = places.find((place) => place.id === stop.placeId);
    if (stopPlace) {
      setSelectedPlaceSlug(stopPlace.slug);
    }
  }, [places, selectedRoute, selectedStopId]);

  function selectStop(stopId: string) {
    setSelectedStopId(stopId);
    const stop = selectedRoute?.stops.find((item) => item.id === stopId);
    const stopPlace = stop ? places.find((place) => place.id === stop.placeId) : undefined;
    if (stopPlace) {
      setSelectedPlaceSlug(stopPlace.slug);
    }
  }

  return (
    <form
      className="space-y-5 rounded-card border border-outline-variant bg-surface-container-lowest p-5 shadow-card"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        setSubmitState({ status: "submitting" });

        const context = formData.get("context")?.toString().trim();
        const description = formData.get("description")?.toString().trim() ?? "";
        const payload = {
          routeSlug: formData.get("route")?.toString(),
          placeSlug: formData.get("placeSlug")?.toString() || undefined,
          stopId: formData.get("stopId")?.toString() || undefined,
          category: formData.get("category")?.toString(),
          severity: formData.get("severity")?.toString() as "low" | "medium" | "high",
          description: context ? `${description}\n\nLocation context: ${context}` : description
        };
        const validation = validateIssueReportInput(payload);

        if (!validation.ok) {
          setSubmitState({ status: "error", message: validation.error });
          return;
        }

        try {
          saveLocalIssueReport(validation.data);
        } catch (error) {
          setSubmitState({ status: "error", message: error instanceof Error ? error.message : "Report could not be submitted." });
          return;
        }

        setSubmitState({ status: "success", message: "Report saved for content review on this browser." });
        form.reset();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-label-md text-on-surface" htmlFor="route">
          Optional route context
          <select className="h-11 rounded-control border border-outline-variant bg-white px-3 text-body-md" id="route" name="route" onChange={(event) => setSelectedRouteSlug(event.target.value)} value={selectedRouteSlug}>
            {routes.map((route) => (
              <option key={route.id} value={route.slug}>
                {route.title}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-label-md text-on-surface" htmlFor="stopId">
          Stop context
          <select className="h-11 rounded-control border border-outline-variant bg-white px-3 text-body-md" id="stopId" name="stopId" onChange={(event) => selectStop(event.target.value)} value={selectedStopId}>
            <option value="">General route issue</option>
            {selectedRoute?.stops.map((stop, index) => (
              <option key={stop.id} value={stop.id}>
                Stop {index + 1}: {stop.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-label-md text-on-surface" htmlFor="placeSlug">
        Place context
        <select className="h-11 rounded-control border border-outline-variant bg-white px-3 text-body-md" id="placeSlug" name="placeSlug" onChange={(event) => setSelectedPlaceSlug(event.target.value)} value={selectedPlaceSlug}>
          <option value="">No specific place</option>
          {places.map((place) => (
            <option key={place.id} value={place.slug}>
              {place.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-label-md text-on-surface" htmlFor="category">
          Issue type
          <select className="h-11 rounded-control border border-outline-variant bg-white px-3 text-body-md" id="category" name="category">
            <option value="place_info_wrong">Place info wrong</option>
            <option value="photo_source_issue">Photo or source issue</option>
            <option value="opening_access_changed">Opening or access changed</option>
            <option value="accessibility_detail_wrong">Accessibility detail wrong</option>
            <option value="construction_nearby">Construction nearby</option>
            <option value="duplicate_place">Duplicate place</option>
            <option value="suggest_place_nearby">Suggest another place nearby</option>
            <option value="construction">Construction or closure</option>
            <option value="safety">Safety concern</option>
            <option value="accessibility">Accessibility barrier</option>
            <option value="incorrect_information">Incorrect information</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className="grid gap-2 text-label-md text-on-surface" htmlFor="severity">
          Severity
          <select className="h-11 rounded-control border border-outline-variant bg-white px-3 text-body-md" id="severity" name="severity">
            <option value="low">Low: note for future review</option>
            <option value="medium">Medium: may affect a visit</option>
            <option value="high">High: safety or access concern</option>
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-label-md text-on-surface" htmlFor="context">
        Where did this happen?
        <input className="h-11 rounded-control border border-outline-variant bg-white px-3 text-body-md" id="context" name="context" type="text" />
      </label>

      <label className="grid gap-2 text-label-md text-on-surface" htmlFor="description">
        What changed?
        <textarea
          className="min-h-32 w-full rounded-control border border-outline-variant bg-white px-3 py-2 text-body-md"
          id="description"
          name="description"
          required
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={submitState.status === "submitting"} type="submit">
          {submitState.status === "submitting" ? "Submitting" : "Submit report"}
        </Button>
        <ButtonLink href={returnHref} variant="secondary">Back to context</ButtonLink>
      </div>
      {submitState.status === "success" ? <p className="text-label-md text-primary" role="status">{submitState.message}</p> : null}
      {submitState.status === "error" ? <p className="text-label-md text-error" role="alert">{submitState.message}</p> : null}
    </form>
  );
}
