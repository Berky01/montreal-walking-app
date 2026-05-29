# Agent Instructions

This file gives coding agents durable project context for this repository.

## Project

Montreal Walking App is an open-source urban walking route planner and walk companion.

Main surfaces:

- `src/` web prototype, API server, providers, and tests
- `apps/mobile/` Expo mobile app
- `packages/shared/` shared TypeScript domain logic
- `data/` seeded Montreal POI cache for local development

## Working rules

- Keep the MVP Montreal-first unless a task explicitly expands geography.
- Make the smallest complete change in the owning layer.
- Read the full file before editing it.
- Do not commit secrets, `.env`, generated output, screenshots, local traces, or `node_modules`.
- For UI changes, verify the affected screen when practical.
- For route/provider changes, run focused tests and document the exact behavior touched.
- Avoid unrelated refactors and broad rewrites.

## Useful commands

```bash
npm run test
npm run build
npm run test:mobile:unit
npm run dev:api
npm run dev
npm run dev:mobile
npm run doctor
```

## High-risk areas

- Location tracking
- Route metric correctness
- Provider/live API behavior
- Persistence and route-store behavior
- Deployment and environment validation

## Product priorities

- Reliable route planning
- Clear route comparison
- Visible save state
- Trustworthy live walk progress
- Safe mobile layout and readable outdoor UI
- Concrete Montreal discovery value
