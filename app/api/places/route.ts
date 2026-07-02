import { getPlaces } from "@/lib/data/index";
import type { PlaceFilters } from "@/lib/data/types";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters: PlaceFilters = {
    cityId: searchParams.get("cityId") ?? undefined,
    category: (searchParams.get("category") as PlaceFilters["category"]) ?? undefined,
    area: searchParams.get("area") ?? undefined,
    tag: searchParams.get("tag") ?? undefined
  };

  return Response.json({
    places: getPlaces(filters),
    filters
  });
}
