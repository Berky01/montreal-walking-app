import packageJson from "@/package.json";
import { getPlaces, getRoutes } from "@/lib/data/index";
import { featureFlagDefaults } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

export function GET() {
  const routes = getRoutes();
  const places = getPlaces();

  return Response.json({
    appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Meaningful Routes",
    gitSha: process.env.BUILD_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "unavailable",
    buildTime: process.env.BUILD_TIME ?? "unavailable",
    appVersion: packageJson.version,
    dataSource: process.env.DATA_SOURCE ?? "mock",
    routeCount: routes.length,
    placeCount: places.length,
    environment: process.env.NODE_ENV ?? "development",
    featureFlags: {
      enabled: Object.entries(featureFlagDefaults).filter(([, enabled]) => enabled).map(([key]) => key),
      disabled: Object.entries(featureFlagDefaults).filter(([, enabled]) => !enabled).map(([key]) => key)
    }
  });
}
