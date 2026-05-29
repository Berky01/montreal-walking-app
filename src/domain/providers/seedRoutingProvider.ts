import type { RoutingProvider, WalkingRouteInput } from '../mvpTypes';

export function createSeedRoutingProvider(): RoutingProvider {
  return {
    async walkingRoute(input: WalkingRouteInput) {
      const geometry = [
        input.start,
        ...input.waypoints.map((waypoint) => waypoint.coordinate),
        input.start,
      ];
      const interestBoost = input.waypoints.length * 115;

      return {
        geometry,
        distanceMeters: Math.round(input.targetMeters + interestBoost),
        durationSeconds: Math.round((input.targetMeters + interestBoost) / 1.35),
        provider: 'seed-routing-provider',
      };
    },
  };
}
