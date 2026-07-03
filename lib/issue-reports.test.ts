import { describe, expect, it } from "vitest";
import { getIssueReportPlaceOptions, validateIssueReportInput, validateIssueReportTriageInput } from "@/lib/issue-reports";
import { getPlaces, getRouteBySlug } from "@/lib/data/index";

describe("issue report validation", () => {
  it("accepts valid route, stop, and place context", () => {
    expect(
      validateIssueReportInput({
        routeSlug: "old-montreal-monuments-loop",
        placeSlug: "place-darmes",
        stopId: "old-montreal-monuments-loop-stop-1",
        category: "accessibility",
        severity: "high",
        description: "Temporary stairs block the ramp."
      })
    ).toMatchObject({
      ok: true,
      data: expect.objectContaining({
        category: "accessibility",
        severity: "high",
        description: "Temporary stairs block the ramp."
      })
    });
  });

  it("rejects missing descriptions and invalid categories", () => {
    expect(validateIssueReportInput({ category: "safety", description: "" })).toMatchObject({
      ok: false,
      error: "description is required"
    });
    expect(validateIssueReportInput({ category: "bad", description: "The route is closed." })).toMatchObject({
      ok: false,
      error: "valid category is required"
    });
  });

  it("validates issue triage updates before admin persistence", () => {
    expect(
      validateIssueReportTriageInput({
        id: "issue-1",
        status: "resolved",
        severity: "low",
        reviewer: "route QA",
        resolutionNotes: "Resolved after source review."
      })
    ).toMatchObject({
      ok: true,
      data: {
        id: "issue-1",
        status: "resolved",
        severity: "low",
        reviewer: "route QA",
        resolutionNotes: "Resolved after source review."
      }
    });

    expect(validateIssueReportTriageInput({ id: "", status: "resolved" })).toMatchObject({
      ok: false,
      error: "issue id is required"
    });
    expect(validateIssueReportTriageInput({ id: "issue-1", status: "bad" })).toMatchObject({
      ok: false,
      error: "valid issue status is required"
    });
  });

  it("scopes place context options to the selected public route stops", () => {
    const places = getPlaces();
    const route = getRouteBySlug("old-montreal-monuments-loop");

    expect(route).toBeDefined();

    const options = getIssueReportPlaceOptions({ places, route });

    expect(options).toHaveLength(route!.stops.length);
    expect(options.map((place) => place.slug)).toEqual(
      route!.stops.map((stop) => places.find((place) => place.id === stop.placeId)?.slug)
    );
    expect(options.some((place) => place.slug === "crew-collective-cafe")).toBe(false);
  });
});
