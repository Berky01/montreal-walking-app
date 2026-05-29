# Architecture

Montreal Walking App is a TypeScript monorepo with three main layers.

## Web and API

`src/` contains the React web prototype, Fastify API, provider adapters, deployment checks, and tests.

Important areas:

- `src/App.tsx`: web prototype shell
- `src/domain/`: web/domain route logic and provider abstractions
- `src/server/`: Fastify API, environment validation, provider self-tests, POI import, route persistence
- `src/components/`: web components such as the map surface

## Mobile

`apps/mobile/` contains the Expo app. It uses the API as the backend source of truth and shares domain logic through the workspace package.

Important areas:

- `apps/mobile/app/`: Expo Router entrypoints
- `apps/mobile/src/screens/`: mobile screens
- `apps/mobile/src/state/`: app state and persistence
- `apps/mobile/src/platform/`: location, storage, and sharing wrappers

## Shared package

`packages/shared/` contains domain logic that can be reused across web, API, and mobile.

Important areas:

- route and walk companion types
- walk option helpers
- feedback utilities
- route/walk progress helpers

## Providers

The project supports seeded/local providers for development and optional live providers for production-style testing.

- Seeded providers allow local work without paid keys.
- Geoapify can provide geocoding and walking routes.
- MapTiler can provide browser map tiles.
- Mapbox is kept as an optional routing fallback.

## Data

`data/montreal-pois.json` is a seeded POI cache for local Montreal development. `data/route-store.json` is local runtime output and is intentionally ignored by Git.
