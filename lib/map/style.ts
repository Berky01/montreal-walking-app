import { DEFAULT_MAP_ATTRIBUTION, DEFAULT_MAP_STYLE_URL, resolveMapAttribution, resolveMapStyle } from "@/lib/map/map-config";

export { DEFAULT_MAP_ATTRIBUTION, DEFAULT_MAP_STYLE_URL };

export function getMeaningfulMapStyle(configuredStyleUrl?: string): string | undefined {
  return resolveMapStyle(configuredStyleUrl);
}

export function getMeaningfulMapAttribution(configuredStyleUrl?: string, configuredAttribution?: string): string {
  return resolveMapAttribution(configuredStyleUrl, configuredAttribution);
}
