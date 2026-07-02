import { createExternalRoutingProvider } from "./externalProvider";
import type { RoutingProviderConfig } from "./types";

export function createValhallaProvider(config: RoutingProviderConfig) {
  return createExternalRoutingProvider("valhalla", config);
}
