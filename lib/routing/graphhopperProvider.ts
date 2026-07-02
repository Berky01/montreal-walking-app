import { createExternalRoutingProvider } from "./externalProvider";
import type { RoutingProviderConfig } from "./types";

export function createGraphhopperProvider(config: RoutingProviderConfig) {
  return createExternalRoutingProvider("graphhopper", config);
}
