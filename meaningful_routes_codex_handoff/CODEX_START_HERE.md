# Codex Start Here — Meaningful Routes

## Mission

Build one coherent product from the previous walking / heritage / UNESCO / Compostelle concepts:

**A responsive webapp that helps people find and follow beautiful, interesting, and meaningful routes around them or wherever they travel.**

The product is **discovery-first**, not planner-first. It can be used spontaneously for everyday walking discovery or intentionally to prepare a city visit, weekend trip, road trip, or long-distance route.

## Current implementation target

Build **website/webapp first** to reduce development complexity and make the MVP easy to test on desktop and mobile browsers. Native iOS/Android apps are not the first delivery target.

Expected first implementation shape:

- Responsive webapp for desktop and mobile browser.
- Route-first UI for Explore, Compare, Detail, Active Walk, Completion, Saved, History, and Settings.
- Shared TypeScript domain logic for route filtering, comparison labels, save/history state, and session metrics.
- Static Montreal seed data first; API endpoints can follow when needed.
- Web map component that can render static seed geometry without going blank.

If an existing codebase appears later, inspect it first and adapt. Do not rewrite unnecessarily. Prefer incremental improvements against the existing architecture.

## Product scope for MVP

MVP is **Montreal only**, but the app must be architected to expand globally city by city.

MVP outcome:

> Open the webapp, find a beautiful or interesting walk in Montreal, compare options, save a route, follow it live, and save the completed memory afterward.

## Non-goals for MVP

Do **not** build these first:

- Full global coverage
- Full UNESCO database ingestion
- Road-trip planner
- Full Compostelle/pilgrimage product
- Social network
- Dating/matching
- Public comments/reviews
- User-generated public routes
- Heavy AI route generation
- Generic fitness tracker positioning
- Generic Google Maps clone

## Required P0 delivery sequence

1. Confirm product naming, scope labels, and Montreal-only MVP copy.
2. Normalize domain model: city, route, place/stop, route session, saved route, user preferences.
3. Make Explore / Around Me route discovery useful.
4. Make route cards compact, accurate, and differentiated.
5. Make route comparison labels match actual metrics.
6. Make route detail confidence-building and outdoor-readable.
7. Make the web route map nonblank, fitted to full route geometry, with stops visible.
8. Make save state obvious: saving, saved, unsaved, error.
9. Make Active Walk the primary live web experience: map, progress, elapsed, next stop, safe controls.
10. Make Completion use actual session metrics before planned estimates.
11. Make Saved and History cards distinguishable.
12. Add route issue reporting and basic feedback.
13. Add tests, typecheck, build, API readiness if used, and browser screenshots at desktop and mobile widths.

## Design rule

The webapp should feel like a practical outdoor route tool:

- Compact and readable outdoors
- Explicit state
- Route-first, not pin-first
- Discovery-first, not planning-heavy
- Responsive on desktop and mobile browsers
- Safe around fixed navigation, bottom controls, and mobile browser viewport constraints
- No huge marketing hero layouts
- No decorative glows/gradients as a crutch
- No vague fitness copy

## First file to read in this package

Read in this order:

1. `docs/01_product_brief.md`
2. `docs/02_mvp_scope.md`
3. `docs/03_screen_specs.md`
4. `docs/04_feature_backlog.md`
5. `docs/05_data_model.md`
6. `tickets/P0_MVP/README.md`
7. `qa/mvp_acceptance_checklist.md`

Then implement ticket-by-ticket.

For this workspace, translate any remaining mobile/native wording in older tickets into the responsive webapp equivalent unless a ticket explicitly says native app work is now in scope.
