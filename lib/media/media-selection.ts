import type { MediaAsset, MediaCoverageReport, Place, Route } from "@/lib/types";
import { isApprovedProductionImageAsset, isGeneratedFallbackAsset } from "./licenses";

export function getPrimaryMediaAsset(assets: MediaAsset[], role: NonNullable<MediaAsset["role"]>): MediaAsset | undefined {
  const approved = assets.filter(isApprovedProductionImageAsset);
  const exactRole = approved.find((asset) => asset.role === role);

  if (exactRole) {
    return exactRole;
  }

  if (approved[0]) {
    return approved[0];
  }

  return assets.find((asset) => isGeneratedFallbackAsset(asset) && (asset.role === role || asset.role === "fallback")) ?? assets.find(isGeneratedFallbackAsset);
}

export function getRouteMediaAsset(route: Route, places: Place[], role: NonNullable<MediaAsset["role"]> = "card"): MediaAsset | undefined {
  const routeAsset = getPrimaryMediaAsset(route.media, role);

  if (routeAsset && isApprovedProductionImageAsset(routeAsset)) {
    return routeAsset;
  }

  for (const stop of route.stops) {
    const place = places.find((item) => item.id === stop.placeId);
    const placeAsset = place ? getPrimaryMediaAsset(place.media, role) : undefined;

    if (placeAsset && isApprovedProductionImageAsset(placeAsset)) {
      return placeAsset;
    }
  }

  return routeAsset;
}

export function buildMediaCoverageReport({ routes, places }: { routes: Route[]; places: Place[] }): MediaCoverageReport {
  const routeAssets = routes.flatMap((route) => route.media);
  const placeAssets = places.flatMap((place) => place.media);
  const allAssets = [...routeAssets, ...placeAssets];
  const approvedRealPhotos = allAssets.filter(isApprovedProductionImageAsset).length;
  const generatedFallbacks = allAssets.filter(isGeneratedFallbackAsset).length;
  const rejectedOrNeedsReview = allAssets.filter((asset) => asset.status === "rejected" || asset.status === "needs_review").length;
  const routesWithPhotos = routes.filter((route) => isApprovedProductionImageAsset(getRouteMediaAsset(route, places, "hero")));
  const placesWithPhotos = places.filter((place) => isApprovedProductionImageAsset(getPrimaryMediaAsset(place.media, "hero")));

  return {
    totalMediaAssets: allAssets.length,
    approvedRealPhotos,
    generatedFallbacks,
    rejectedOrNeedsReview,
    missingRouteHeroPhotos: routes.filter((route) => !isApprovedProductionImageAsset(getRouteMediaAsset(route, places, "hero"))).map((route) => route.slug),
    missingRouteCardPhotos: routes.filter((route) => !isApprovedProductionImageAsset(getRouteMediaAsset(route, places, "card"))).map((route) => route.slug),
    missingPlaceHeroPhotos: places.filter((place) => !isApprovedProductionImageAsset(getPrimaryMediaAsset(place.media, "hero"))).map((place) => place.slug),
    missingPlaceCardPhotos: places.filter((place) => !isApprovedProductionImageAsset(getPrimaryMediaAsset(place.media, "card"))).map((place) => place.slug),
    routePhotoCoverage: {
      total: routes.length,
      covered: routesWithPhotos.length,
      percent: percent(routesWithPhotos.length, routes.length)
    },
    placePhotoCoverage: {
      total: places.length,
      covered: placesWithPhotos.length,
      percent: percent(placesWithPhotos.length, places.length)
    }
  };
}

function percent(value: number, total: number): number {
  return total ? Number(((value / total) * 100).toFixed(1)) : 0;
}
