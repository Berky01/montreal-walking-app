import { describe, expect, it } from "vitest";
import { getCityPacks, getNeighborhoods, getPartnerKits } from "@/lib/data/index";

describe("shared discovery data foundations", () => {
  it("exposes neighborhoods from shared typed data", () => {
    const neighborhoods = getNeighborhoods();

    expect(neighborhoods.map((neighborhood) => neighborhood.slug)).toEqual(expect.arrayContaining(["old-montreal", "little-italy"]));
    expect(neighborhoods.every((neighborhood) => neighborhood.cityId === "montreal")).toBe(true);
  });

  it("keeps P1 packs and partner kits scaffolded but flagged", () => {
    expect(getCityPacks()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: "montreal-heritage-starter",
          status: "flagged"
        })
      ])
    );
    expect(getPartnerKits()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: "montreal-guest-walk-kit",
          status: "flagged"
        })
      ])
    );
  });
});
