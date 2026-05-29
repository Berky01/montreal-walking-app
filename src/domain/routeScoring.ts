import type { CityProfile, MVPWalkRequest, RouteCandidate, RouteFitCategory, ScoredRoute } from './mvpTypes';
import { normalizeMVPWalkRequest } from './routeEngine';

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function gpxForRoute(route: RouteCandidate): string {
  const waypoints = route.pois
    .map((poi, index) => [
      `<wpt lat="${poi.coordinate.lat}" lon="${poi.coordinate.lng}">`,
      `<name>${index + 1}. ${escapeXml(poi.name)}</name>`,
      `<type>${escapeXml(poi.category)}</type>`,
      '</wpt>',
    ].join(''))
    .join('');
  const points = route.geometry
    .map((point) => `<trkpt lat="${point.lat}" lon="${point.lng}"></trkpt>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="Montreal Walking MVP">${waypoints}<trk><name>${escapeXml(route.label)}</name><trkseg>${points}</trkseg></trk></gpx>`;
}

function googleMapsLink(route: RouteCandidate): string {
  const start = route.geometry[0];
  const end = route.geometry.at(-1) ?? start;
  const waypointStops = (route.routingWaypoints ?? route.pois.slice(0, 8).map((poi) => poi.coordinate)).slice(0, 8);
  const url = new URL('https://www.google.com/maps/dir/');

  url.searchParams.set('api', '1');
  url.searchParams.set('travelmode', 'walking');
  url.searchParams.set('origin', `${start.lat},${start.lng}`);
  url.searchParams.set('destination', `${end.lat},${end.lng}`);

  if (waypointStops.length > 0) {
    url.searchParams.set(
      'waypoints',
      waypointStops.map((point) => `${point.lat},${point.lng}`).join('|'),
    );
  }

  return url.toString();
}

export function scoreRouteCandidate(
  route: RouteCandidate,
  request: MVPWalkRequest,
  city: CityProfile,
): ScoredRoute {
  const normalizedRequest = normalizeMVPWalkRequest(request, city);
  const targetMeters = normalizedRequest.stepGoal * city.defaultStepLengthMeters;
  const targetSeconds = normalizedRequest.timeGoalMinutes * 60;
  const distanceDelta = Math.abs(route.distanceMeters - targetMeters) / targetMeters;
  const timeDelta = Math.abs(route.durationSeconds - targetSeconds) / targetSeconds;
  const matchingInterestCount = route.pois.filter((poi) =>
    poi.interestTags.some((tag) => normalizedRequest.interests.includes(tag)),
  ).length;
  const moodMatchCount = route.pois.filter((poi) => poi.moods.includes(normalizedRequest.mood)).length;
  const parkWaterfrontCount = route.pois.filter((poi) =>
    poi.interestTags.includes('parks') || poi.interestTags.includes('waterfront'),
  ).length;
  const excessTurnCount = Math.max(0, route.geometry.length - 7);

  const breakdown = {
    stepFit: clampScore(100 - distanceDelta * 220),
    timeFit: clampScore(100 - timeDelta * 160),
    moodMatch: clampScore(route.pois.length > 0 ? (moodMatchCount / route.pois.length) * 100 : 0),
    interestMatch: clampScore(route.pois.length > 0 ? (matchingInterestCount / route.pois.length) * 100 : 0),
    poiSpacing: clampScore(route.pois.length >= 2 && route.pois.length <= 5 ? 88 : 62),
    detourPenalty: clampScore(distanceDelta * 70),
    parkWaterfrontBonus: clampScore(parkWaterfrontCount * 18),
    excessTurnPenalty: clampScore(excessTurnCount * 8),
  };
  const total = clampScore(
    breakdown.stepFit * 0.34 +
      breakdown.timeFit * 0.12 +
      breakdown.moodMatch * 0.16 +
      breakdown.interestMatch * 0.18 +
      breakdown.poiSpacing * 0.1 +
      breakdown.parkWaterfrontBonus * 0.08 -
      breakdown.detourPenalty * 0.08 -
      breakdown.excessTurnPenalty * 0.04,
  );
  const bestPoiNames = route.pois.slice(0, 3).map((poi) => poi.name).join(', ');
  const explanation = bestPoiNames
    ? `This loop stays close to your step goal, matches the ${normalizedRequest.mood} mood, and anchors the walk around ${bestPoiNames}.`
    : `This loop stays close to your step goal but was generated without matching POI anchors.`;

  return {
    ...route,
    score: { total, breakdown },
    explanation,
    scoreSummary: [
      `${breakdown.stepFit}/100 step fit`,
      `${breakdown.interestMatch}/100 interest fit`,
      `${breakdown.moodMatch}/100 mood fit`,
    ],
    exportLinks: {
      googleMaps: googleMapsLink(route),
      gpx: gpxForRoute(route),
    },
  };
}

export function rankScoredRoutes(routes: ScoredRoute[]): ScoredRoute[] {
  const sorted = [...routes].sort((a, b) => b.score.total - a.score.total);
  const best = sorted[0];

  return sorted
    .map((route, index) => {
      const differentiator = routeDifferentiatorFor(route, index, best);
      const labelledRoute = {
        ...route,
        label: differentiator.label,
        fitCategory: differentiator.fitCategory,
        fitReason: differentiator.fitReason,
      };

      return {
        ...labelledRoute,
        exportLinks: {
          ...labelledRoute.exportLinks,
          gpx: gpxForRoute(labelledRoute),
        },
      };
    });
}

function routeDifferentiatorFor(route: ScoredRoute, index: number, best?: ScoredRoute): {
  label: string;
  fitCategory: RouteFitCategory;
  fitReason: string;
} {
  if (index === 0 || !best) {
    return {
      label: 'Best fit',
      fitCategory: 'best-fit',
      fitReason: 'Closest overall match for your goal, mood, and interests.',
    };
  }

  const muchShorter = route.estimatedSteps < best.estimatedSteps * 0.8
    || route.durationSeconds < best.durationSeconds * 0.85
    || route.distanceMeters < best.distanceMeters * 0.85;
  if (muchShorter) {
    return {
      label: 'Shorter loop',
      fitCategory: 'shorter',
      fitReason: 'A shorter alternative when you want the walk to feel easier.',
    };
  }

  if (route.pois.length > 0 && best.pois.length > 0 && route.pois.length < best.pois.length) {
    return {
      label: 'Fewer stops',
      fitCategory: 'fewer-stops',
      fitReason: 'Keeps the walk simpler with fewer discovery stops.',
    };
  }

  if (route.distanceMeters > best.distanceMeters * 1.08) {
    return {
      label: 'Scenic stretch',
      fitCategory: 'scenic',
      fitReason: 'A roomier route with more scenic walking time.',
    };
  }

  if (route.score.breakdown.parkWaterfrontBonus > 0) {
    return {
      label: 'Scenic stretch',
      fitCategory: 'scenic',
      fitReason: 'Adds more park or waterfront interest without calling it the shorter option.',
    };
  }

  return {
    label: `Alternative ${index + 1}`,
    fitCategory: 'fallback-option',
    fitReason: 'Another Montreal loop that still fits your selected interests.',
  };
}
