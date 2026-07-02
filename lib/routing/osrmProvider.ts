import { createExternalRoutingProvider } from "./externalProvider";
import type { RoutingProviderConfig } from "./types";

export function createOsrmProvider(config: RoutingProviderConfig) {
  return createExternalRoutingProvider("osrm", config);
}
