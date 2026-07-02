import { getPlaceBySlug } from "@/lib/data/index";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const place = getPlaceBySlug(slug);

  if (!place) {
    return Response.json({ error: "Place not found" }, { status: 404 });
  }

  return Response.json({ place });
}
