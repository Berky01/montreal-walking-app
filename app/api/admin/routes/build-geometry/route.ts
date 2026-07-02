import { getRouteBySlug } from "@/lib/data/index";
import { getRoutingProvider } from "@/lib/routing/index";

export async function POST(request: Request) {
  const adminError = requireAdminWriteIfEnabled(request);
  if (adminError) {
    return adminError;
  }

  const body = (await request.json().catch(() => null)) as { routeSlug?: string; provider?: string } | null;
  const routeSlug = body?.routeSlug;

  if (!routeSlug) {
    return Response.json({ error: "routeSlug is required" }, { status: 400 });
  }

  const route = getRouteBySlug(routeSlug);
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

function requireAdminWriteIfEnabled(request: Request): Response | null {
  if (process.env.ENABLE_ADMIN_WRITE_ACTIONS !== "true") {
    return null;
  }

  const expected = process.env.ADMIN_TOKEN;
  const provided = request.headers.get("x-admin-token") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!expected || expected === "change-me-local-only" || provided !== expected) {
    return Response.json({ error: "admin token required" }, { status: 401 });
  }

  return null;
}
