import type { Route } from "@/lib/types";
import type { RoutingProvider, RoutingProviderConfig, RoutingProviderName } from "./types";

export function createExternalRoutingProvider(
  name: Exclude<RoutingProviderName, "none" | "manual">,
  config: RoutingProviderConfig
): RoutingProvider {
  return {
    name,
    async getRouteGeometry(_route: Route) {
      void _route;

      if (!config.baseUrl) {
        throw new Error(`${name} routing requires ROUTING_BASE_URL and must run in an admin/build flow.`);
      }

      throw new Error(`${name} routing adapter is configured but request generation is not implemented yet.`);
    }
  };
}
