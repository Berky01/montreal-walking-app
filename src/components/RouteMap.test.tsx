import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RouteMap } from './RouteMap';
import type { ScoredRoute } from '../domain/mvpTypes';
import { stitchTokens } from '../design/stitchTokens';

const route = {
  id: 'route-1',
  label: 'Recommended',
  cityId: 'montreal',
  geometry: [
    { lat: 45.5234, lng: -73.5996 },
    { lat: 45.5272, lng: -73.5897 },
    { lat: 45.5234, lng: -73.5996 },
  ],
  pois: [
    {
      id: 'poi-1',
      cityId: 'montreal',
      name: 'Laurier metro access',
      category: 'transit',
      coordinate: { lat: 45.5272, lng: -73.5897 },
      source: 'osm-seed',
      moods: ['calm'],
      interestTags: ['transit'],
      computedRouteValue: 60,
      lastImportedAt: '2026-05-26T00:00:00.000Z',
    },
  ],
  distanceMeters: 5000,
  durationSeconds: 3600,
  estimatedSteps: 6667,
  provider: 'seed-routing-provider',
  debug: { targetMeters: 5000, waypointStrategy: '1 POI loop' },
  score: {
    total: 80,
    breakdown: {
      stepFit: 90,
      timeFit: 80,
      moodMatch: 70,
      interestMatch: 70,
      poiSpacing: 80,
      detourPenalty: 4,
      parkWaterfrontBonus: 0,
      excessTurnPenalty: 0,
    },
  },
  explanation: 'Good loop.',
  scoreSummary: ['90/100 step fit'],
  exportLinks: { googleMaps: '#', gpx: '<gpx></gpx>' },
} satisfies ScoredRoute;

describe('RouteMap', () => {
  it('shows an inspectable fallback route preview without a MapTiler key', () => {
    render(<RouteMap route={route} mapTilerKey="" />);

    expect(screen.getByText('Map provider not configured')).toBeInTheDocument();
    expect(screen.getByLabelText('Fallback route preview')).toBeInTheDocument();
    expect(screen.getByText('Map provider not configured').closest('.map-preview')).toHaveAttribute('data-route-color', stitchTokens.color.primary);
    expect(screen.getByText('Laurier metro access')).toBeInTheDocument();
  });

  it('renders a MapLibre container with route and POI data when configured', () => {
    render(<RouteMap route={route} mapTilerKey="map-key" />);

    expect(screen.getByLabelText('Interactive route map')).toBeInTheDocument();
    expect(screen.getByLabelText('Interactive route map')).toHaveAttribute('data-route-color', stitchTokens.color.primary);
    expect(screen.getByText('1 POI marker')).toBeInTheDocument();
  });

  it('shows ordered route stops with the loop start and finish in every map mode', () => {
    const { rerender } = render(<RouteMap route={route} mapTilerKey="" />);

    let stopList = screen.getByLabelText('Route stops');
    expect(within(stopList).getByText('Start / finish')).toBeInTheDocument();
    expect(within(stopList).getByText('1')).toBeInTheDocument();
    expect(within(stopList).getByText('Laurier metro access')).toBeInTheDocument();

    rerender(<RouteMap route={route} mapTilerKey="map-key" />);

    stopList = screen.getByLabelText('Route stops');
    expect(within(stopList).getByText('Start / finish')).toBeInTheDocument();
    expect(within(stopList).getByText('1')).toBeInTheDocument();
    expect(within(stopList).getByText('Laurier metro access')).toBeInTheDocument();
  });

  it('adds category context to POI stops without losing ordered route numbers', () => {
    render(<RouteMap route={route} mapTilerKey="" activePoiId="poi-1" />);

    const stopList = screen.getByLabelText('Route stops');
    expect(within(stopList).getByText('1')).toBeInTheDocument();
    expect(within(stopList).getByText('Transit access')).toBeInTheDocument();
    expect(within(stopList).getByLabelText('Next discovery')).toBeInTheDocument();
  });

  it('renders the companion strip summary without the full stop list', () => {
    render(<RouteMap route={route} activePoiId="poi-1" completedPoiIds={[]} compact companionStrip />);

    expect(screen.getByLabelText('Companion route map')).toBeInTheDocument();
    expect(screen.getByText('Laurier metro access')).toBeInTheDocument();
    expect(screen.queryByText('Start / finish')).not.toBeInTheDocument();
  });
});
