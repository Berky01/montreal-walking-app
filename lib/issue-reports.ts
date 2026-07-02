import type { IssueReportInput } from "@/lib/types";

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

export type IssueReportValidationResult =
  | { ok: true; data: IssueReportInput }
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
