import { useEffect, useMemo, useRef } from 'react';
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import { buildMapTilerStyleUrl, mapRendererId } from '../domain/mapConfig';
import type { ScoredRoute } from '../domain/mvpTypes';
import { interestOptions } from '../domain/walkOptions';
import { stitchTokens } from '../design/stitchTokens';

interface RouteMapProps {
  route?: ScoredRoute;
  mapTilerKey?: string;
  activePoiId?: string;
  completedPoiIds?: string[];
  compact?: boolean;
  companionStrip?: boolean;
}

const MAX_VISIBLE_STOPS = 8;

function categoryLabel(category: string) {
  return interestOptions.find((option) => option.id === category)?.label ?? category;
}

function routeBounds(route: ScoredRoute): [[number, number], [number, number]] {
  const lngs = route.geometry.map((point) => point.lng);
  const lats = route.geometry.map((point) => point.lat);

  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

function routeGeoJson(route: ScoredRoute) {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { id: route.id },
        geometry: {
          type: 'LineString',
          coordinates: route.geometry.map((point) => [point.lng, point.lat]),
        },
      },
    ],
  } as GeoJSON.FeatureCollection;
}

function poiGeoJson(route: ScoredRoute, activePoiId?: string, completedPoiIds: string[] = []) {
  return {
    type: 'FeatureCollection',
    features: route.pois.slice(0, MAX_VISIBLE_STOPS).map((poi, index) => ({
      type: 'Feature',
      properties: {
        id: poi.id,
        name: poi.name,
        category: poi.category,
        categoryLabel: categoryLabel(poi.category),
        indexLabel: String(index + 1),
        active: poi.id === activePoiId,
        completed: completedPoiIds.includes(poi.id),
      },
      geometry: {
        type: 'Point',
        coordinates: [poi.coordinate.lng, poi.coordinate.lat],
      },
    })),
  } as GeoJSON.FeatureCollection;
}

function startFinishGeoJson(route: ScoredRoute) {
  const start = route.geometry[0];

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { label: 'S' },
        geometry: {
          type: 'Point',
          coordinates: [start.lng, start.lat],
        },
      },
    ],
  } as GeoJSON.FeatureCollection;
}

function projectRoutePoint(
  point: { lat: number; lng: number },
  bounds: [[number, number], [number, number]],
) {
  const [[minLng, minLat], [maxLng, maxLat]] = bounds;
  const lngRange = Math.max(maxLng - minLng, 0.0001);
  const latRange = Math.max(maxLat - minLat, 0.0001);
  const padding = 28;
  const width = 320 - padding * 2;
  const height = 190 - padding * 2;

  return {
    x: padding + ((point.lng - minLng) / lngRange) * width,
    y: padding + ((maxLat - point.lat) / latRange) * height,
  };
}

function RouteStopList({
  route,
  activePoiId,
  completedPoiIds = [],
}: {
  route: ScoredRoute;
  activePoiId?: string;
  completedPoiIds?: string[];
}) {
  const visiblePois = route.pois.slice(0, MAX_VISIBLE_STOPS);
  const hiddenPoiCount = Math.max(route.pois.length - visiblePois.length, 0);

  return (
    <ol className="route-stops" aria-label="Route stops">
      <li>
        <span className="start-marker">S</span>
        <div>
          <strong>Start / finish</strong>
          <small>Loop returns to your starting point</small>
        </div>
      </li>
      {visiblePois.map((poi, index) => (
        <li
          key={poi.id}
          className={[
            poi.id === activePoiId ? 'active' : '',
            completedPoiIds.includes(poi.id) ? 'completed' : '',
            `category-${poi.category}`,
          ].filter(Boolean).join(' ')}
        >
          <span>{index + 1}</span>
          <div>
            <strong>{poi.name}</strong>
            <small>
              {categoryLabel(poi.category)}
              {poi.id === activePoiId ? <em aria-label="Next discovery">Next</em> : null}
            </small>
          </div>
        </li>
      ))}
      {hiddenPoiCount > 0 ? (
        <li>
          <span>+</span>
          <div>
            <strong>{hiddenPoiCount} more POI{hiddenPoiCount === 1 ? '' : 's'}</strong>
            <small>Open the route details below for the full list</small>
          </div>
        </li>
      ) : null}
    </ol>
  );
}

function FallbackRoutePreview({
  route,
  activePoiId,
  completedPoiIds = [],
  showStopList = true,
}: {
  route: ScoredRoute;
  activePoiId?: string;
  completedPoiIds?: string[];
  showStopList?: boolean;
}) {
  const bounds = routeBounds(route);
  const routePoints = route.geometry.map((point) => projectRoutePoint(point, bounds));
  const path = routePoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');
  const startPoint = projectRoutePoint(route.geometry[0], bounds);

  return (
    <div className="fallback-map">
      <svg viewBox="0 0 320 190" role="img" aria-label="Fallback route preview">
        <rect x="0" y="0" width="320" height="190" rx="8" />
        <path d={path} data-route-color={stitchTokens.color.primary} />
        <g className="fallback-start-marker">
          <circle cx={startPoint.x} cy={startPoint.y} r="8" />
          <text x={startPoint.x} y={startPoint.y + 4}>S</text>
        </g>
        {route.pois.slice(0, MAX_VISIBLE_STOPS).map((poi, index) => {
          const point = projectRoutePoint(poi.coordinate, bounds);
          const className = [
            poi.id === activePoiId ? 'active-stop' : '',
            completedPoiIds.includes(poi.id) ? 'completed-stop' : '',
            `category-${poi.category}`,
          ].filter(Boolean).join(' ');

          return (
            <g key={poi.id} className={className}>
              <circle cx={point.x} cy={point.y} r="6" />
              <text x={point.x + 9} y={point.y + 4}>{index + 1}</text>
            </g>
          );
        })}
      </svg>
      {showStopList ? (
        <RouteStopList route={route} activePoiId={activePoiId} completedPoiIds={completedPoiIds} />
      ) : null}
    </div>
  );
}

function CompanionStopSummary({ route, activePoiId }: { route: ScoredRoute; activePoiId?: string }) {
  const activePoi = route.pois.find((poi) => poi.id === activePoiId) ?? route.pois[0];

  return (
    <div className="companion-map-summary">
      <span>Next stop</span>
      <strong>{activePoi?.name ?? 'Loop finish'}</strong>
    </div>
  );
}

export function RouteMap({
  route,
  mapTilerKey,
  activePoiId,
  completedPoiIds = [],
  compact = false,
  companionStrip = false,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const styleUrl = useMemo(
    () => mapTilerKey ? buildMapTilerStyleUrl(mapTilerKey) : '',
    [mapTilerKey],
  );
  const completedPoiKey = completedPoiIds.join('|');

  useEffect(() => {
    if (
      !route ||
      !mapTilerKey ||
      !containerRef.current ||
      mapRef.current ||
      typeof HTMLCanvasElement !== 'undefined' &&
        !HTMLCanvasElement.prototype.getContext.toString().includes('[native code]')
    ) {
      return;
    }

    let disposed = false;
    let loadedMap: MapLibreMap | null = null;

    void (async () => {
      await import('maplibre-gl/dist/maplibre-gl.css');
      const { default: maplibregl } = await import('maplibre-gl');

      if (disposed || !containerRef.current || !route || mapRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: styleUrl,
        center: [route.geometry[0].lng, route.geometry[0].lat],
        zoom: 13,
        attributionControl: {},
      });

      loadedMap = map;
      mapRef.current = map;

      map.on('load', () => {
        map.addSource('route', { type: 'geojson', data: routeGeoJson(route) });
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: {
            'line-color': stitchTokens.color.primary,
            'line-width': 5,
          },
        });
        map.addSource('pois', { type: 'geojson', data: poiGeoJson(route, activePoiId, completedPoiIds) });
        map.addLayer({
          id: 'poi-points',
          type: 'circle',
          source: 'pois',
          paint: {
            'circle-color': [
              'case',
              ['get', 'completed'],
              stitchTokens.color.secondary,
              ['get', 'active'],
              '#ffffff',
              [
                'match',
                ['get', 'category'],
                'cafes',
                stitchTokens.color.primary,
                'parks',
                stitchTokens.color.secondary,
                'waterfront',
                '#285c73',
                'viewpoints',
                '#7a4a10',
                'architecture',
                stitchTokens.color.tertiary,
                'churches',
                '#76505f',
                'transit',
                '#285c73',
                'public-toilets',
                '#5d5f33',
                stitchTokens.color.primary,
              ],
            ],
            'circle-radius': ['case', ['get', 'active'], 10, 7],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': ['case', ['get', 'active'], 4, 2],
          },
        });
        map.addLayer({
          id: 'poi-labels',
          type: 'symbol',
          source: 'pois',
          layout: {
            'text-field': ['get', 'indexLabel'],
            'text-size': 12,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-offset': [0, 0],
            'text-allow-overlap': true,
          },
          paint: {
            'text-color': '#292524',
          },
        });
        map.addSource('start-finish', { type: 'geojson', data: startFinishGeoJson(route) });
        map.addLayer({
          id: 'start-finish-point',
          type: 'circle',
          source: 'start-finish',
          paint: {
            'circle-color': stitchTokens.color.secondary,
            'circle-radius': 9,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2,
          },
        });
        map.addLayer({
          id: 'start-finish-label',
          type: 'symbol',
          source: 'start-finish',
          layout: {
            'text-field': ['get', 'label'],
            'text-size': 12,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-allow-overlap': true,
          },
          paint: {
            'text-color': '#ffffff',
          },
        });
        map.fitBounds(routeBounds(route), { padding: 42, duration: 0 });
      });
    })();

    return () => {
      disposed = true;
      loadedMap?.remove();
      if (mapRef.current === loadedMap) mapRef.current = null;
    };
  }, [activePoiId, completedPoiKey, mapTilerKey, route, styleUrl]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !route || !map.isStyleLoaded()) return;

    const routeSource = map.getSource('route') as GeoJSONSource | undefined;
    const poiSource = map.getSource('pois') as GeoJSONSource | undefined;
    const startFinishSource = map.getSource('start-finish') as GeoJSONSource | undefined;

    routeSource?.setData(routeGeoJson(route));
    poiSource?.setData(poiGeoJson(route, activePoiId, completedPoiIds));
    startFinishSource?.setData(startFinishGeoJson(route));
    map.fitBounds(routeBounds(route), { padding: 42, duration: 250 });
  }, [activePoiId, completedPoiKey, route]);

  if (!route) {
    return (
      <div className="map-preview empty-map">
        <span>Generate routes to preview a Montréal loop.</span>
      </div>
    );
  }

  const mapClassName = [
    'map-preview',
    mapTilerKey ? 'map-live' : 'fallback-map-shell',
    compact ? 'compact-map' : '',
    companionStrip ? 'companion-map-strip' : '',
  ].filter(Boolean).join(' ');
  const mapLabel = companionStrip ? 'Companion route map' : 'Interactive route map';

  if (!mapTilerKey) {
    return (
      <div className={mapClassName} aria-label={companionStrip ? mapLabel : undefined} data-route-color={stitchTokens.color.primary}>
        <FallbackRoutePreview
          route={route}
          activePoiId={activePoiId}
          completedPoiIds={completedPoiIds}
          showStopList={!companionStrip}
        />
        {companionStrip ? <CompanionStopSummary route={route} activePoiId={activePoiId} /> : null}
        <div className="map-note">
          <strong>Map provider not configured</strong>
          <span>{route.pois.length} POI marker{route.pois.length === 1 ? '' : 's'} shown without basemap</span>
        </div>
      </div>
    );
  }

  return (
    <div className={mapClassName} aria-label={mapLabel} data-route-color={stitchTokens.color.primary}>
      <div ref={containerRef} className="map-container" />
      {companionStrip ? (
        <CompanionStopSummary route={route} activePoiId={activePoiId} />
      ) : (
        <RouteStopList route={route} activePoiId={activePoiId} completedPoiIds={completedPoiIds} />
      )}
      <div className="map-note">
        <strong>{mapRendererId === 'maplibre' ? 'MapLibre' : mapRendererId} route preview</strong>
        <span>{route.pois.length} POI marker{route.pois.length === 1 ? '' : 's'}</span>
      </div>
    </div>
  );
}
