import { describe, expect, it } from "vitest";
import { DEFAULT_MAP_ATTRIBUTION, DEFAULT_MAP_STYLE_URL, getMeaningfulMapAttribution, getMeaningfulMapStyle } from "@/lib/map/style";

describe("map style resolver", () => {
  it("uses the configured MapLibre style URL when present", () => {
    expect(getMeaningfulMapStyle("https://tiles.example.com/style.json")).toBe("https://tiles.example.com/style.json");
  });

  it("does not provide a default public tile provider", () => {
    expect(getMeaningfulMapStyle("")).toBeUndefined();
    expect(DEFAULT_MAP_STYLE_URL).toBe("");
  });

  it("uses configured attribution and otherwise stays blank", () => {
    expect(getMeaningfulMapAttribution("")).toBe(DEFAULT_MAP_ATTRIBUTION);
    expect(getMeaningfulMapAttribution("", "Example provider")).toBe("Example provider");
  });
});
