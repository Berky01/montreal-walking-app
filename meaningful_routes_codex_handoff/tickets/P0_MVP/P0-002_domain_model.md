# P0-002 — Domain Model Normalization

## Goal

Create or align shared TypeScript types for City, Place, Route, RouteStop, RouteSession, SavedRoute, UserPreferences.

## Tasks

- Inspect existing domain package.
- Add missing fields from `docs/05_data_model.md` where compatible.
- Add formatters for distance, duration, stops, difficulty.
- Add route filtering by time/distance/interests/route type.
- Add route comparison helper.
- Add session progress/completion helper.

## Acceptance

- Shared domain exports reusable route/filter/session helpers.
- Mobile screens do not duplicate comparison/completion math.
- Tests cover key domain helpers.
