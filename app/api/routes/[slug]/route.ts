import { getRouteBySlug } from "@/lib/data/index";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const route = getRouteBySlug(slug);

  if (!route) {
    return Response.json({ error: "Route not found" }, { status: 404 });
  }

  return Response.json({ route });
}
