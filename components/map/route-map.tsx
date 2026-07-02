import { MapShell } from "./map-shell";
import type { MeaningfulMapProps } from "./mapTypes";

export function RouteMap(props: MeaningfulMapProps) {
  return <MapShell {...props} />;
}
