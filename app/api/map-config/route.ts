import { NextResponse } from "next/server";
import { resolvePublicMapConfig } from "@/lib/map/map-config";

export const dynamic = "force-dynamic";

export function GET() {
  const config = resolvePublicMapConfig({
    styleUrl: process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? process.env.PUBLIC_MAP_STYLE_URL,
    attribution: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ?? process.env.PUBLIC_MAP_ATTRIBUTION,
    provider: process.env.NEXT_PUBLIC_MAP_PROVIDER ?? process.env.PUBLIC_MAP_PROVIDER ?? process.env.MAP_PROVIDER_NAME,
    defaultCity: process.env.NEXT_PUBLIC_DEFAULT_CITY ?? process.env.PUBLIC_MAP_DEFAULT_CITY,
    centerLat: process.env.NEXT_PUBLIC_DEFAULT_CENTER_LAT,
    centerLng: process.env.NEXT_PUBLIC_DEFAULT_CENTER_LNG
  });

  return NextResponse.json(config);
}
