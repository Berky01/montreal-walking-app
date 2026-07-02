import type { Route } from "@/lib/types";
import { geometryDistanceKm } from "./distance";
import type { RoutingProvider } from "./types";

export const manualProvider: RoutingProvider = {
  name: "manual",
  async getRouteGeometry(route: Route) {
    return {
      provider: "manual",
      geometry: route.geometry,
      distanceKm: geometryDistanceKm(route.geometry),
      requiresReview: false,
      warnings: []
    };
  }
};
