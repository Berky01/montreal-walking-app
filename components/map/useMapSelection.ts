"use client";

import { useCallback, useState } from "react";
import type { MapSelection } from "./mapTypes";

export function useMapSelection(initialSelection: MapSelection = null) {
  const [selected, setSelected] = useState<MapSelection>(initialSelection);

  const selectRoute = useCallback((slug: string) => {
    setSelected({ type: "route", slug });
  }, []);

  const selectPlace = useCallback((slug: string) => {
    setSelected({ type: "place", slug });
  }, []);

  const clearSelection = useCallback(() => {
    setSelected(null);
  }, []);

  return {
    selected,
    setSelected,
    selectRoute,
    selectPlace,
    clearSelection
  };
}
