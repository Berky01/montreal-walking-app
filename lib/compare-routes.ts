import type { Route } from "@/lib/types";

export type ComparedRoutesResult = {
  routes: Route[];
  usedFallback: boolean;
  missingSlugs: string[];
};

export function resolveComparedRoutes(routes: Route[], selectedSlugs: string[], fallbackLimit = 4): ComparedRoutesResult {
  const routeBySlug = new Map(routes.map((route) => [route.slug, route]));
  const uniqueSlugs = [...new Set(selectedSlugs.filter(Boolean))];
  const missingSlugs = uniqueSlugs.filter((slug) => !routeBySlug.has(slug));
  const selectedRoutes = uniqueSlugs.map((slug) => routeBySlug.get(slug)).filter(Boolean) as Route[];

  if (!selectedRoutes.length) {
    return {
      routes: routes.slice(0, fallbackLimit),
      usedFallback: true,
      missingSlugs
    };
  }

  return {
    routes: selectedRoutes,
    usedFallback: false,
    missingSlugs
  };
}
