import type { MetadataRoute } from "next";
import { getPlaces, getRoutes } from "@/lib/data/index";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://routeapp.plexplease.xyz";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ["", "/app", "/places", "/routes", "/search", "/saved", "/history", "/settings", "/cities", "/report-issue"];
  const staticEntries = staticPaths.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date()
  }));
  const placeEntries = getPlaces().map((place) => ({
    url: `${siteUrl}/places/${place.slug}`,
    lastModified: new Date(place.lastReviewedAt)
  }));
  const routeEntries = getRoutes().map((route) => ({
    url: `${siteUrl}/routes/${route.slug}`,
    lastModified: new Date(route.lastReviewedAt)
  }));

  return [...staticEntries, ...placeEntries, ...routeEntries];
}
