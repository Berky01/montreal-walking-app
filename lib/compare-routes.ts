import type { Route } from "@/lib/types";

export type ComparedRoutesResult = {
  routes: Route[];
  usedFallback: boolean;
  missingSlugs: string[];
};

export type ParsedCompareRouteIds = {
  validSlugs: string[];
  missingSlugs: string[];
};

export function parseCompareRouteIds(value: string | null | undefined, routes: Route[], limit = 4): ParsedCompareRouteIds {
  const routeBySlug = new Set(routes.map((route) => route.slug));
  const requestedSlugs = uniqueSlugs((value ?? "").split(",").map((slug) => slug.trim()));
  const missingSlugs = requestedSlugs.filter((slug) => !routeBySlug.has(slug));
  const validSlugs = requestedSlugs.filter((slug) => routeBySlug.has(slug)).slice(0, limit);

  return {
    validSlugs,
    missingSlugs
  };
}

export function resolveComparedRoutes(routes: Route[], selectedSlugs: string[], fallbackLimit = 4): ComparedRoutesResult {
  const routeBySlug = new Map(routes.map((route) => [route.slug, route]));
  const uniqueSlugs = uniqueSlugsFromList(selectedSlugs).slice(0, fallbackLimit);
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

function uniqueSlugs(values: string[]): string[] {
  return uniqueSlugsFromList(values);
}

function uniqueSlugsFromList(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
