import type { Place, Route } from "@/lib/types";

export type MapSelection =
  | { type: "route"; slug: string }
  | { type: "place"; slug: string }
  | null;

export type ProjectedPoint = {
  x: number;
  y: number;
};

export type MeaningfulMapProps = {
  route?: Route;
  routes?: Route[];
  places?: Place[];
  className?: string;
  id?: string;
  title?: string;
  selected?: MapSelection;
  onSelect?: (selection: MapSelection) => void;
  currentStopId?: string;
  fallbackReason?: string;
  nextStopId?: string;
  visitedStopIds?: string[];
  skippedStopIds?: string[];
};
