import { getRoutes } from "@/lib/data/index";
import type { RouteFilters } from "@/lib/data/types";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters: RouteFilters = {
    cityId: searchParams.get("cityId") ?? undefined,
    interest: searchParams.get("interest") ?? undefined,
    area: searchParams.get("area") ?? undefined,
    difficulty: (searchParams.get("difficulty") as RouteFilters["difficulty"]) ?? undefined,
    durationMaxMin: toNumber(searchParams.get("durationMaxMin"))
  };

  return Response.json({
    routes: getRoutes(filters),
    filters
  });
}

function toNumber(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
