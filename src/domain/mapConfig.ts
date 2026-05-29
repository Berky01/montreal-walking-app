export const mapRendererId = 'maplibre';
export const mapTileProviderId = 'maptiler';
export const mapTileProviderLabel = 'MapTiler';

export function buildMapTilerStyleUrl(apiKey: string) {
  return `https://api.maptiler.com/maps/streets-v2/style.json?key=${encodeURIComponent(apiKey)}`;
}
