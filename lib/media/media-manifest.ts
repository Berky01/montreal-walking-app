import rawMediaAssets from "@/data/media/media-assets.json";
import type { MediaAsset } from "@/lib/types";

export const mediaAssets = rawMediaAssets as MediaAsset[];

export function getMediaAssetsForPlace(placeId: string): MediaAsset[] {
  return mediaAssets.filter((asset) => asset.placeId === placeId);
}

export function getMediaAssetsForRoute(routeIdOrSlug: string): MediaAsset[] {
  return mediaAssets.filter((asset) => asset.routeId === routeIdOrSlug);
}

export function createGeneratedFallbackMedia({
  alt,
  id,
  title
}: {
  alt: string;
  id: string;
  title: string;
}): MediaAsset {
  return {
    id,
    type: "generated",
    role: "fallback",
    alt,
    sourceType: "generated_local",
    provider: "meaningful_routes",
    creator: "Meaningful Routes",
    title,
    attributionText: "Generated local visual by Meaningful Routes.",
    licenseName: "Internal generated visual",
    licenseAllowsCommercialUse: true,
    licenseRequiresAttribution: false,
    licenseRequiresShareAlike: false,
    confidence: "verified",
    status: "fallback_only"
  };
}

export function clonePlaceMediaForRoute(asset: MediaAsset, routeSlug: string, routeTitle: string): MediaAsset {
  return {
    ...asset,
    id: `${routeSlug}-${asset.id}`,
    role: "hero",
    routeId: routeSlug,
    alt: `${routeTitle} route preview featuring ${asset.alt}`
  };
}
