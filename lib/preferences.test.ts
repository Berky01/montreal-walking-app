import { describe, expect, it } from "vitest";
import { estimateDurationForPace, formatDistanceForUnits } from "@/lib/preferences";

describe("preferences helpers", () => {
  it("formats distances in metric or imperial units", () => {
    expect(formatDistanceForUnits(2.4, "metric")).toBe("2.4 km");
    expect(formatDistanceForUnits(1.6, "imperial")).toBe("1.0 mi");
  });

  it("adjusts route estimates by preferred walking pace", () => {
    expect(estimateDurationForPace(60, "relaxed")).toBe(72);
    expect(estimateDurationForPace(60, "balanced")).toBe(60);
    expect(estimateDurationForPace(60, "brisk")).toBe(48);
  });
});
