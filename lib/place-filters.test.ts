import { describe, expect, it } from "vitest";
import { getPlaces } from "@/lib/data/index";
import { filterPlaces, parsePlaceFilterParams } from "@/lib/place-filters";

describe("place filters", () => {
  it("parses URL search params into stable place filters", () => {
    const filters = parsePlaceFilterParams(new URLSearchParams("category=museum&neighborhood=Downtown&tag=rainy%20day&q=campus"));

    expect(filters).toEqual({
      category: "museum",
      neighborhood: "Downtown",
      tag: "rainy day",
      query: "campus"
    });
  });

  it("filters places by category, neighborhood, tag, and search query", () => {
    const results = filterPlaces(getPlaces(), {
      category: "museum",
      neighborhood: "Downtown",
      tag: "rainy day",
      query: "natural history"
    });

    expect(results.map((place) => place.slug)).toEqual(["redpath-museum"]);
  });

  it("returns all places when filters are unset", () => {
    expect(filterPlaces(getPlaces(), parsePlaceFilterParams(new URLSearchParams()))).toHaveLength(getPlaces().length);
  });
});
