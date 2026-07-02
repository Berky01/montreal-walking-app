import type { Route, RouteGeometry } from "@/lib/types";

export type RoutingProviderName = "none" | "manual" | "osrm" | "valhalla" | "graphhopper";

export type RoutingProviderConfig = {
  provider?: RoutingProviderName;
  baseUrl?: string;
  profile?: string;
  timeoutMs?: number;
};

export type RoutingGeometryResult = {
  provider: Exclude<RoutingProviderName, "none">;
  geometry: RouteGeometry;
  distanceKm: number;
  requiresReview: boolean;
  warnings: string[];
};

export type RoutingProvider = {
  name: RoutingProviderName;
  getRouteGeometry(route: Route): Promise<RoutingGeometryResult>;
};
