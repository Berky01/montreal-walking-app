import { getAllPlaces, getAllPublicSlugsForCrawl, getAllRoutes } from "@/lib/data/index";
import { validateDataCatalog, validatePublicContentReadiness } from "@/lib/data/validators";

export function GET() {
  const routes = getAllRoutes();
  const places = getAllPlaces();
  const validation = validateDataCatalog({ routes, places });
  const publicReadiness = validatePublicContentReadiness({ routes, places });
  const crawl = getAllPublicSlugsForCrawl();
  const ok = validation.ok && publicReadiness.ok;

  return Response.json({
    ok,
    status: ok ? "healthy" : "degraded",
    dataSource: process.env.DATA_SOURCE ?? "mock",
    counts: {
      ...validation.counts,
      publicRoutes: publicReadiness.counts.publicRoutes,
      publicPlaces: publicReadiness.counts.publicPlaces,
      publicCrawlPaths: crawl.paths.length
    },
    checkedAt: new Date().toISOString()
  }, { status: ok ? 200 : 503 });
}
