import { createGraphhopperProvider } from "./graphhopperProvider";
import { manualProvider } from "./manualProvider";
import { createOsrmProvider } from "./osrmProvider";
import type { RoutingProviderConfig, RoutingProviderName } from "./types";
import { createValhallaProvider } from "./valhallaProvider";

export function getRoutingProvider(config: RoutingProviderConfig = {}) {
  const provider = config.provider ?? readEnvProvider();

  if (provider === "none" || provider === "manual") {
    return manualProvider;
  }

  const providerConfig: RoutingProviderConfig = {
    baseUrl: config.baseUrl ?? process.env.ROUTING_BASE_URL,
    profile: config.profile ?? process.env.ROUTING_PROFILE ?? "walking",
    timeoutMs: config.timeoutMs ?? Number(process.env.ROUTING_TIMEOUT_MS ?? 10000),
    provider
  };

  if (provider === "osrm") {
    return createOsrmProvider(providerConfig);
  }

  if (provider === "valhalla") {
    return createValhallaProvider(providerConfig);
  }

  return createGraphhopperProvider(providerConfig);
}

function readEnvProvider(): RoutingProviderName {
  const value = process.env.ROUTING_PROVIDER;

  if (value === "manual" || value === "osrm" || value === "valhalla" || value === "graphhopper") {
    return value;
  }

  return "none";
}

export type { RoutingGeometryResult, RoutingProvider, RoutingProviderConfig, RoutingProviderName } from "./types";
