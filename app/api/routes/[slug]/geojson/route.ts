import { getRouteGeoJson } from "@/lib/data/index";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const geojson = getRouteGeoJson(slug);

  if (!geojson) {
    return Response.json({ error: "Route not found" }, { status: 404 });
  }

  return Response.json(geojson);
}
