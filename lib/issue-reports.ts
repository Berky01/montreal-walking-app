import type { IssueReportInput, IssueReportTriageInput, Place, Route } from "@/lib/types";

const categories = new Set([
  "closed",
  "construction",
  "safety",
  "accessibility",
  "incorrect_information",
  "place_info_wrong",
  "photo_source_issue",
  "opening_access_changed",
  "accessibility_detail_wrong",
  "construction_nearby",
  "duplicate_place",
  "suggest_place_nearby",
  "other"
]);
const severities = new Set(["low", "medium", "high"]);
const statuses = new Set(["new", "reviewing", "resolved", "dismissed"]);

export type IssueReportValidationResult =
  | { ok: true; data: IssueReportInput }
  | { ok: false; error: string };

export type IssueReportTriageValidationResult =
  | { ok: true; data: IssueReportTriageInput }
  | { ok: false; error: string };

export function validateIssueReportInput(input: unknown): IssueReportValidationResult {
  const body = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const category = typeof body.category === "string" ? body.category : "";
  const severity = typeof body.severity === "string" ? body.severity : undefined;

  if (!description) {
    return { ok: false, error: "description is required" };
  }

  if (!categories.has(category)) {
    return { ok: false, error: "valid category is required" };
  }

  if (severity && !severities.has(severity)) {
    return { ok: false, error: "valid severity is required" };
  }

  return {
    ok: true,
    data: {
      routeSlug: typeof body.routeSlug === "string" && body.routeSlug ? body.routeSlug : undefined,
      placeSlug: typeof body.placeSlug === "string" && body.placeSlug ? body.placeSlug : undefined,
      stopId: typeof body.stopId === "string" && body.stopId ? body.stopId : undefined,
      category: category as IssueReportInput["category"],
      severity: severity as IssueReportInput["severity"],
      description
    }
  };
}

export function validateIssueReportTriageInput(input: unknown): IssueReportTriageValidationResult {
  const body = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const id = typeof body.id === "string" ? body.id.trim() : "";
  const status = typeof body.status === "string" ? body.status : "";
  const severity = typeof body.severity === "string" && body.severity ? body.severity : undefined;
  const reviewer = typeof body.reviewer === "string" ? body.reviewer.trim() : "";
  const resolutionNotes = typeof body.resolutionNotes === "string" ? body.resolutionNotes.trim() : "";

  if (!id) {
    return { ok: false, error: "issue id is required" };
  }

  if (!statuses.has(status)) {
    return { ok: false, error: "valid issue status is required" };
  }

  if (severity && !severities.has(severity)) {
    return { ok: false, error: "valid severity is required" };
  }

  return {
    ok: true,
    data: {
      id,
      status: status as IssueReportTriageInput["status"],
      severity: severity as IssueReportTriageInput["severity"],
      reviewer: reviewer || undefined,
      resolutionNotes: resolutionNotes || undefined
    }
  };
}

export function getIssueReportPlaceOptions({
  places,
  route
}: {
  places: Place[];
  route?: Route;
}): Place[] {
  if (!route) {
    return places;
  }

  const placesById = new Map(places.map((place) => [place.id, place]));

  return route.stops.flatMap((stop) => {
    const place = placesById.get(stop.placeId);
    return place ? [place] : [];
  });
}
