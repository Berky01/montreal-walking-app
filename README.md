# Montreal Walking App

Open-source urban walking route planner and walk companion for Montreal.

The project helps people generate, compare, save, and follow city walks based on distance, time, interests, and points of interest. It is built as a practical reference implementation for route scoring, POI selection, walk progress tracking, and mobile/web walking UX.

## Why this exists

Most mapping tools optimize for driving, transit, or point-to-point directions. Montreal Walking App focuses on the walking use case: choosing a useful loop, understanding route tradeoffs, seeing discoveries along the way, and tracking completion in a mobile-first flow.

The codebase is intended to be useful for developers building open-source city walking, tourism, local discovery, urban mobility, and route-planning tools.

## Current scope

- Montreal-first route planning
- Web prototype with React and Vite
- Fastify API for route generation, POI search, provider health checks, and route persistence
- Shared TypeScript domain package for route options, scoring, walk metrics, and companion state
- Expo mobile app with route comparison, route details, saved routes, history, settings, and active walk flows
- Seeded/local provider support for development without paid API keys
- Optional live provider hooks for MapTiler, Geoapify, and Mapbox

## Monorepo structure

```text
apps/mobile/        Expo mobile app
packages/shared/    Shared TypeScript domain logic
src/                Web prototype, API server, providers, tests
data/               Seed POI cache for local Montreal development
deploy/             Docker and deployment notes
docs/               Project documentation
```

## Tech stack

- TypeScript
- React 19
- Vite
- Fastify
- Expo / React Native
- Vitest
- Jest Expo
- Playwright
- MapLibre
- Zod

## Quick start

```bash
npm install
npm run test
npm run dev:api
npm run dev
```

Open the Vite URL printed by the terminal. The default local setup can use seeded providers, so you can explore the app before configuring live map or routing keys.

## Mobile development

```bash
npm install
npm run dev:api
npm run dev:mobile
npm run test:mobile
```

For a physical phone, set a device-reachable API URL, for example:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.8:5174
```

Do not use `127.0.0.1` from a physical device unless the API is running on that device.

## Environment

Copy `.env.example` to `.env` for local API work:

```bash
cp .env.example .env
npm run setup:env
```

Optional live-provider variables:

```text
USE_SEEDED_PROVIDERS=true
MAPTILER_API_KEY=
GEOAPIFY_API_KEY=
MAPBOX_ACCESS_TOKEN=
ADMIN_TOKEN=
DATABASE_URL=
```

`MAPTILER_API_KEY` is exposed to the browser through `/api/client-config`, so use a browser-restricted key in production.

## Tests

```bash
npm run test
npm run lint
npm run typecheck
npm run validate:data
npm run validate:routes
npm run validate:media
npm run build
npm run test:smoke
npm run test:mobile:unit
npm run doctor
```

`npm run doctor` checks API readiness, provider configuration, public endpoints, and canonical Montreal route smoke tests.

## Source trust audit routes

This repo exposes source/trust audit surfaces for public review:

- `/places/place-darmes`
- `/places/notre-dame-basilica`
- `/places/saint-joseph-oratory`
- `/routes/old-montreal-monuments-loop/live`
- `/routes/churches-courtyards-walk/live`
- `/admin/route-qa` and `/admin/route-qa?admin=1`

See `docs/source-trust-data-model.md`, `docs/stitch-component-mapping.md`, and `docs/source-trust-deployment-evidence.md`.

## Open-source roadmap

See [ROADMAP.md](ROADMAP.md).

## Codex-friendly maintenance areas

This repository is intentionally structured so AI coding agents can help maintain it through small, reviewable changes:

- Route scoring and route comparison logic
- POI importer and provider adapters
- Web/mobile UI states and accessibility
- Tests for route metrics, completion, saved state, and local provider behavior
- Documentation and onboarding improvements
- PR review, issue triage, release notes, and regression checks

See [AGENTS.md](AGENTS.md) for repository-specific guidance for coding agents.

## Contributing

Contributions are welcome. Good first areas include documentation, test coverage, accessibility states, seeded POI improvements, and route scoring explanations.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

MIT. See [LICENSE](LICENSE).
