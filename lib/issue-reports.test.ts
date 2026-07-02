import { describe, expect, it } from "vitest";
import { validateIssueReportInput } from "@/lib/issue-reports";

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
});
