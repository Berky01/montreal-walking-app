import { requireAdminWriteActionsResponse } from "@/lib/admin/access";
import { getAllRouteBySlug } from "@/lib/data/index";
import { getRoutingProvider } from "@/lib/routing/index";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const adminError = requireAdminWriteActionsResponse();
  if (adminError) {
    return adminError;
  }

  const body = (await request.json().catch(() => null)) as { routeSlug?: string; provider?: string } | null;
  const routeSlug = body?.routeSlug;

  if (!routeSlug) {
    return Response.json({ error: "routeSlug is required" }, { status: 400 });
  }

  const route = getAllRouteBySlug(routeSlug);
  if (!route) {
    return Response.json({ error: "route not found" }, { status: 404 });
  }

  const provider = getRoutingProvider({
    provider: body?.provider === "osrm" || body?.provider === "valhalla" || body?.provider === "graphhopper" || body?.provider === "manual" ? body.provider : "none"
  });
  const result = await provider.getRouteGeometry(route).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unable to build route geometry";
    return nullResponse(message);
  });

  if (result instanceof Response) {
    return result;
  }

  return Response.json({
    routeSlug,
    geometry: result.geometry,
    distanceKm: result.distanceKm,
    provider: result.provider,
    requiresReview: result.requiresReview,
    warnings: result.warnings
  });
}

function nullResponse(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}
