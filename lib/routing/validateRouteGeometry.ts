import type { Route } from "@/lib/types";
import { hasUsableGeometry } from "./geometry";

export function validateRouteGeometry(route: Route): string[] {
  const errors: string[] = [];

  if (!hasUsableGeometry(route.geometry)) {
    errors.push(`${route.slug} is missing usable LineString geometry.`);
  }

  if (route.stops.length < 3) {
    errors.push(`${route.slug} must have at least three stops.`);
  }

  return errors;
}
