"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CircleLayerSpecification,
  GeoJSONSource,
  LineLayerSpecification,
  Map as MapLibreMap,
  MapLayerMouseEvent,
  SymbolLayerSpecification
} from "maplibre-gl";
import { placesToFeatureCollection, routesToFeatureCollection, validateCoordinates } from "@/lib/data/geojson";
import { buildMapFitPoints, buildMapMarkers, getActivePlace, getActiveRoute } from "@/lib/map/markers";
import { mapMarkersToFeatureCollection, placeStyleColors, toMapLibreLngLat } from "@/lib/map/maplibre";
import { resolvePublicMapConfig, type PublicMapConfig } from "@/lib/map/map-config";
import type { Coordinates, GeoJsonFeatureCollection, GeoJsonLineString, GeoJsonPoint, Place, Route } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { MapFallback } from "./MapFallback";
import { MapPreviewCard } from "./MapPreviewCard";
import type { MapSelection, MeaningfulMapProps } from "./mapTypes";

type MapLibreModule = typeof import("maplibre-gl");
type CirclePaint = NonNullable<CircleLayerSpecification["paint"]>;

const PLACE_SOURCE_ID = "meaningful-places";
const ROUTE_SOURCE_ID = "meaningful-routes";
const MAP_MARKER_SOURCE_ID = "meaningful-map-markers";
const ROUTE_LINE_LAYER_ID = "meaningful-route-lines";
const PLACE_CLUSTER_LAYER_ID = "meaningful-place-clusters";
const PLACE_CLUSTER_COUNT_LAYER_ID = "meaningful-place-cluster-counts";
const PLACE_LAYER_ID = "meaningful-place-pins";
const MAP_MARKER_LAYER_ID = "meaningful-route-stop-pins";
const MAP_MARKER_LABEL_LAYER_ID = "meaningful-route-stop-labels";

type MapData = {
  places: GeoJsonFeatureCollection<GeoJsonPoint>;
  routes: GeoJsonFeatureCollection<GeoJsonLineString>;
  markers: GeoJsonFeatureCollection<GeoJsonPoint>;
};

export function MapShell(props: MeaningfulMapProps) {
  const config = useMemo(
    () =>
      resolvePublicMapConfig({
        styleUrl: process.env.NEXT_PUBLIC_MAP_STYLE_URL,
        attribution: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION,
        provider: process.env.NEXT_PUBLIC_MAP_PROVIDER,
        defaultCity: process.env.NEXT_PUBLIC_DEFAULT_CITY,
        centerLat: process.env.NEXT_PUBLIC_DEFAULT_CENTER_LAT,
        centerLng: process.env.NEXT_PUBLIC_DEFAULT_CENTER_LNG
      }),
    []
  );

  if (!config.configured || !config.styleUrl) {
    return (
      <MapFallback
        {...props}
        fallbackReason="Map preview - live tile style not configured"
      />
    );
  }

  return <MapLibreMapShell {...props} config={config} />;
}

function MapLibreMapShell({
  route,
  routes,
  places = [],
  className,
  id,
  title = "Montreal discovery map",
  selected,
  onSelect,
  currentStopId,
  nextStopId,
  visitedStopIds = [],
  skippedStopIds = [],
  config
}: MeaningfulMapProps & { config: PublicMapConfig }) {
  const routeList = useMemo(() => (route ? [route] : routes ?? []), [route, routes]);
  const controlledSelection = selected !== undefined && Boolean(onSelect);
  const [internalSelection, setInternalSelection] = useState<MapSelection>(selected ?? null);
  const activeSelection = (controlledSelection ? selected : internalSelection) ?? defaultSelection(route, routeList, places);
  const activeRoute = getActiveRoute(routeList, activeSelection) ?? routeList[0];
  const activePlace = getActivePlace(places, activeSelection);
  const markers = useMemo(
    () =>
      buildMapMarkers({
        route,
        routes,
        places,
        selected: activeSelection,
        currentStopId,
        nextStopId,
        visitedStopIds,
        skippedStopIds
      }),
    [activeSelection, currentStopId, nextStopId, places, route, routes, skippedStopIds, visitedStopIds]
  );
  const fitPoints = useMemo(
    () => buildMapFitPoints({ route, routes, places, selected: activeSelection }),
    [activeSelection, places, route, routes]
  );
  const mapData = useMemo(() => buildMapData(places, routeList, markers, activeSelection), [activeSelection, markers, places, routeList]);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const moduleRef = useRef<MapLibreModule | null>(null);
  const onSelectRef = useRef(onSelect);
  const latestFitPointsRef = useRef(fitPoints);
  const latestMapDataRef = useRef(mapData);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (controlledSelection) {
      setInternalSelection(selected ?? null);
    }
  }, [controlledSelection, selected]);

  useEffect(() => {
    onSelectRef.current = (nextSelection) => {
      if (!controlledSelection) {
        setInternalSelection(nextSelection);
      }

      onSelect?.(nextSelection);
    };
  }, [controlledSelection, onSelect]);

  useEffect(() => {
    latestFitPointsRef.current = fitPoints;
    latestMapDataRef.current = mapData;
  }, [fitPoints, mapData]);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!containerRef.current || mapRef.current) {
        return;
      }

      try {
        const maplibregl = await import("maplibre-gl");

        if (cancelled || !containerRef.current || !config.styleUrl) {
          return;
        }

        moduleRef.current = maplibregl;
        const map = new maplibregl.Map({
          attributionControl: false,
          center: toMapLibreLngLat({ lat: config.center.lat, lng: config.center.lng }),
          container: containerRef.current,
          cooperativeGestures: true,
          dragRotate: false,
          pitchWithRotate: false,
          scrollZoom: false,
          style: config.styleUrl,
          zoom: 12
        });

        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
        if (config.attribution) {
          map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: config.attribution }), "bottom-right");
        }
        map.touchZoomRotate.disableRotation();
        map.once("load", () => {
          if (cancelled) {
            return;
          }

          ensureMapSourcesAndLayers(map, latestMapDataRef.current);
          fitMapToPoints(map, maplibregl, latestFitPointsRef.current, true);
          setReady(true);
        });
        map.on("error", () => {
          if (!map.isStyleLoaded()) {
            setFailed(true);
          }
        });
        mapRef.current = map;
      } catch {
        setFailed(true);
      }
    }

    initMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      moduleRef.current = null;
      setReady(false);
    };
  }, [config.attribution, config.center.lat, config.center.lng, config.styleUrl]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !ready) {
      return;
    }

    ensureMapSourcesAndLayers(map, mapData);
    updateMapSources(map, mapData);
  }, [mapData, ready]);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = moduleRef.current;

    if (!map || !maplibregl || !ready) {
      return;
    }

    fitMapToPoints(map, maplibregl, fitPoints);
  }, [fitPoints, ready]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !ready) {
      return;
    }

    const handleClusterClick = async (event: MapLayerMouseEvent) => {
      const clusterId = event.features?.[0]?.properties?.cluster_id;
      const coordinates = getFeatureCoordinates(event);
      const source = map.getSource(PLACE_SOURCE_ID) as GeoJSONSource | undefined;

      if (typeof clusterId !== "number" || !coordinates || !source) {
        return;
      }

      const zoom = await source.getClusterExpansionZoom(clusterId);
      map.easeTo({ center: coordinates, duration: getMapMotionDuration(), zoom });
    };
    const handlePlaceClick = (event: MapLayerMouseEvent) => {
      const slug = getFeatureString(event, "slug");
      if (slug) {
        onSelectRef.current?.({ type: "place", slug });
      }
    };
    const handleRouteLineClick = (event: MapLayerMouseEvent) => {
      const slug = getFeatureString(event, "slug");
      if (slug) {
        onSelectRef.current?.({ type: "route", slug });
      }
    };
    const handleMarkerClick = (event: MapLayerMouseEvent) => {
      const slug = getFeatureString(event, "slug");
      const selectionType = getFeatureString(event, "selectionType");

      if ((selectionType === "route" || selectionType === "place") && slug) {
        onSelectRef.current?.({ type: selectionType, slug });
      }
    };
    const setPointer = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const clearPointer = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("click", PLACE_CLUSTER_LAYER_ID, handleClusterClick);
    map.on("click", PLACE_LAYER_ID, handlePlaceClick);
    map.on("click", ROUTE_LINE_LAYER_ID, handleRouteLineClick);
    map.on("click", MAP_MARKER_LAYER_ID, handleMarkerClick);

    [PLACE_CLUSTER_LAYER_ID, PLACE_LAYER_ID, ROUTE_LINE_LAYER_ID, MAP_MARKER_LAYER_ID].forEach((layerId) => {
      map.on("mouseenter", layerId, setPointer);
      map.on("mouseleave", layerId, clearPointer);
    });

    return () => {
      map.off("click", PLACE_CLUSTER_LAYER_ID, handleClusterClick);
      map.off("click", PLACE_LAYER_ID, handlePlaceClick);
      map.off("click", ROUTE_LINE_LAYER_ID, handleRouteLineClick);
      map.off("click", MAP_MARKER_LAYER_ID, handleMarkerClick);
      [PLACE_CLUSTER_LAYER_ID, PLACE_LAYER_ID, ROUTE_LINE_LAYER_ID, MAP_MARKER_LAYER_ID].forEach((layerId) => {
        map.off("mouseenter", layerId, setPointer);
        map.off("mouseleave", layerId, clearPointer);
      });
    };
  }, [ready]);

  if (failed) {
    return (
      <MapFallback
        className={className}
        currentStopId={currentStopId}
        fallbackReason="Map preview - live tile style unavailable"
        id={id}
        nextStopId={nextStopId}
        onSelect={onSelect}
        places={places}
        route={route}
        routes={routes}
        selected={selected}
        skippedStopIds={skippedStopIds}
        title={title}
        visitedStopIds={visitedStopIds}
      />
    );
  }

  return (
    <section
      aria-label={title}
      className={cn("relative min-h-[320px] overflow-hidden rounded-card border border-outline-variant bg-surface-container-high shadow-card", className)}
      data-map-shell="true"
      id={id}
    >
      <div className="absolute inset-0" ref={containerRef} />
      <div className="absolute left-4 top-4 z-[5] rounded-control bg-surface-container-lowest px-3 py-2 text-label-sm text-on-surface shadow-card">
        {activeSelection?.type === "route" ? "Optional route overlay" : "Discovery map"} · {config.defaultCity === "montreal" ? "Montreal" : config.defaultCity}
      </div>
      <MapPreviewCard fallbackRoute={activeRoute} place={activePlace} route={activeRoute} selected={activeSelection} />
    </section>
  );
}

function buildMapData(places: Place[], routes: Route[], markers: ReturnType<typeof buildMapMarkers>, selected: MapSelection): MapData {
  return {
    places: withSelectedPlaces(placesToFeatureCollection(places), selected),
    routes: withSelectedRoutes(routesToFeatureCollection(routes), selected),
    markers: mapMarkersToFeatureCollection(markers.filter((marker) => marker.kind !== "place"))
  };
}

function withSelectedPlaces(collection: GeoJsonFeatureCollection<GeoJsonPoint>, selected: MapSelection): GeoJsonFeatureCollection<GeoJsonPoint> {
  return {
    ...collection,
    features: collection.features.map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        selected: selected?.type === "place" && feature.properties.slug === selected.slug
      }
    }))
  };
}

function withSelectedRoutes(collection: GeoJsonFeatureCollection<GeoJsonLineString>, selected: MapSelection): GeoJsonFeatureCollection<GeoJsonLineString> {
  const singleRoute = collection.features.length === 1;

  return {
    ...collection,
    features: collection.features.map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        selected: singleRoute || (selected?.type === "route" && feature.properties.slug === selected.slug)
      }
    }))
  };
}

function defaultSelection(route: Route | undefined, routes: Route[], places: Place[]): MapSelection {
  if (route) {
    return { type: "route", slug: route.slug };
  }

  if (places[0]) {
    return { type: "place", slug: places[0].slug };
  }

  if (routes[0]) {
    return { type: "route", slug: routes[0].slug };
  }

  return null;
}

function ensureMapSourcesAndLayers(map: MapLibreMap, data: MapData) {
  if (!map.getSource(ROUTE_SOURCE_ID)) {
    map.addSource(ROUTE_SOURCE_ID, {
      type: "geojson",
      data: toMapLibreGeoJson(data.routes)
    });
  }

  if (!map.getSource(PLACE_SOURCE_ID)) {
    map.addSource(PLACE_SOURCE_ID, {
      type: "geojson",
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 44,
      data: toMapLibreGeoJson(data.places)
    });
  }

  if (!map.getSource(MAP_MARKER_SOURCE_ID)) {
    map.addSource(MAP_MARKER_SOURCE_ID, {
      type: "geojson",
      data: toMapLibreGeoJson(data.markers)
    });
  }

  addMapLayers(map);
}

function addMapLayers(map: MapLibreMap) {
  if (!map.getLayer(ROUTE_LINE_LAYER_ID)) {
    map.addLayer({
      id: ROUTE_LINE_LAYER_ID,
      type: "line",
      source: ROUTE_SOURCE_ID,
      layout: {
        "line-cap": "round",
        "line-join": "round"
      },
      paint: {
        "line-color": ["case", ["boolean", ["get", "selected"], false], "#154212", "#3f627e"],
        "line-opacity": ["case", ["boolean", ["get", "selected"], false], 0.92, 0.42],
        "line-width": ["case", ["boolean", ["get", "selected"], false], 5, 3]
      }
    } as LineLayerSpecification);
  }

  if (!map.getLayer(PLACE_CLUSTER_LAYER_ID)) {
    map.addLayer({
      id: PLACE_CLUSTER_LAYER_ID,
      type: "circle",
      source: PLACE_SOURCE_ID,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#154212",
        "circle-opacity": 0.88,
        "circle-radius": ["step", ["get", "point_count"], 18, 12, 22, 30, 28],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2
      }
    } as CircleLayerSpecification);
  }

  if (!map.getLayer(PLACE_CLUSTER_COUNT_LAYER_ID)) {
    map.addLayer({
      id: PLACE_CLUSTER_COUNT_LAYER_ID,
      type: "symbol",
      source: PLACE_SOURCE_ID,
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-size": 12
      },
      paint: {
        "text-color": "#ffffff"
      }
    } as SymbolLayerSpecification);
  }

  if (!map.getLayer(PLACE_LAYER_ID)) {
    map.addLayer({
      id: PLACE_LAYER_ID,
      type: "circle",
      source: PLACE_SOURCE_ID,
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": placeColorExpression(),
        "circle-opacity": 0.96,
        "circle-radius": ["case", ["boolean", ["get", "selected"], false], 10, 7],
        "circle-stroke-color": ["case", ["boolean", ["get", "selected"], false], "#5a2e00", "#ffffff"],
        "circle-stroke-width": ["case", ["boolean", ["get", "selected"], false], 3, 2]
      }
    } as CircleLayerSpecification);
  }

  if (!map.getLayer(MAP_MARKER_LAYER_ID)) {
    map.addLayer({
      id: MAP_MARKER_LAYER_ID,
      type: "circle",
      source: MAP_MARKER_SOURCE_ID,
      layout: {
        "circle-sort-key": ["get", "sortKey"]
      },
      paint: {
        "circle-color": markerColorExpression(),
        "circle-radius": ["case", ["==", ["get", "kind"], "stop"], 12, 8],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2
      }
    } as CircleLayerSpecification);
  }

  if (!map.getLayer(MAP_MARKER_LABEL_LAYER_ID)) {
    map.addLayer({
      id: MAP_MARKER_LABEL_LAYER_ID,
      type: "symbol",
      source: MAP_MARKER_SOURCE_ID,
      filter: ["==", ["get", "kind"], "stop"],
      layout: {
        "text-field": ["get", "label"],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-size": 12
      },
      paint: {
        "text-color": "#ffffff"
      }
    } as SymbolLayerSpecification);
  }
}

function updateMapSources(map: MapLibreMap, data: MapData) {
  setSourceData(map, ROUTE_SOURCE_ID, data.routes);
  setSourceData(map, PLACE_SOURCE_ID, data.places);
  setSourceData(map, MAP_MARKER_SOURCE_ID, data.markers);
}

function setSourceData(map: MapLibreMap, sourceId: string, data: GeoJsonFeatureCollection) {
  const source = map.getSource(sourceId) as GeoJSONSource | undefined;
  source?.setData(toMapLibreGeoJson(data));
}

function fitMapToPoints(map: MapLibreMap, maplibregl: MapLibreModule, points: Coordinates[], immediate = false) {
  const validPoints = points.filter(validateCoordinates);

  if (!validPoints.length) {
    return;
  }

  if (validPoints.length === 1) {
    map.easeTo({
      center: toMapLibreLngLat(validPoints[0]),
      duration: immediate ? 0 : getMapMotionDuration(),
      zoom: 14
    });
    return;
  }

  const bounds = new maplibregl.LngLatBounds(toMapLibreLngLat(validPoints[0]), toMapLibreLngLat(validPoints[0]));
  validPoints.slice(1).forEach((point) => bounds.extend(toMapLibreLngLat(point)));
  map.fitBounds(bounds, {
    duration: immediate ? 0 : getMapMotionDuration(),
    maxZoom: 15,
    padding: 56
  });
}

function getFeatureString(event: MapLayerMouseEvent, propertyName: string): string | undefined {
  const value = event.features?.[0]?.properties?.[propertyName];
  return typeof value === "string" && value ? value : undefined;
}

function getFeatureCoordinates(event: MapLayerMouseEvent): [number, number] | undefined {
  const geometry = event.features?.[0]?.geometry;

  if (geometry?.type !== "Point") {
    return undefined;
  }

  const [lng, lat] = geometry.coordinates;
  return typeof lng === "number" && typeof lat === "number" ? [lng, lat] : undefined;
}

function getMapMotionDuration(): number {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return 0;
  }

  return 420;
}

function toMapLibreGeoJson(data: GeoJsonFeatureCollection): GeoJSON.GeoJSON {
  return data as unknown as GeoJSON.GeoJSON;
}

function placeColorExpression(): CirclePaint["circle-color"] {
  return [
    "match",
    ["get", "styleKey"],
    "heritage",
    placeStyleColors.heritage,
    "culture",
    placeStyleColors.culture,
    "landscape",
    placeStyleColors.landscape,
    "street-life",
    placeStyleColors["street-life"],
    "civic",
    placeStyleColors.civic,
    placeStyleColors.landmark
  ] as unknown as CirclePaint["circle-color"];
}

function markerColorExpression(): CirclePaint["circle-color"] {
  return [
    "match",
    ["get", "state"],
    "current",
    "#5a2e00",
    "next",
    "#3f627e",
    "visited",
    "#154212",
    "skipped",
    "#72796e",
    "route",
    "#3f627e",
    "place",
    "#154212",
    "#154212"
  ] as unknown as CirclePaint["circle-color"];
}
