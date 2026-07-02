import { getNearbyPlaces } from "@/lib/data/index";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = toNumber(searchParams.get("lat"));
  const lng = toNumber(searchParams.get("lng"));

  if (lat === undefined || lng === undefined) {
    return Response.json({ error: "lat and lng query parameters are required" }, { status: 400 });
  }

  return Response.json({
    places: getNearbyPlaces({
      coordinates: { lat, lng },
      radiusKm: toNumber(searchParams.get("radiusKm")),
      limit: toNumber(searchParams.get("limit"))
    })
  });
}

function toNumber(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
