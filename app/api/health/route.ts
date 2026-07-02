import { getPlaces, getRoutes } from "@/lib/data/index";
import { validateDataCatalog } from "@/lib/data/validators";

export function GET() {
  const routes = getRoutes();
  const places = getPlaces();
  const validation = validateDataCatalog({ routes, places });

  return Response.json({
    ok: validation.ok,
    status: validation.ok ? "healthy" : "degraded",
    dataSource: process.env.DATA_SOURCE ?? "mock",
    counts: validation.counts,
    checkedAt: new Date().toISOString()
  }, { status: validation.ok ? 200 : 503 });
}
