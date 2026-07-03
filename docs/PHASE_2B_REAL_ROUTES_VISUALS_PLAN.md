# Phase 2B Real Routes And Visuals Plan

## Goal

Make the existing Meaningful Routes MVP feel like a real map-backed Montreal walking product while preserving the current UI and keeping all external services optional.

## Completed Foundation

- Provider-backed catalog remains the frontend contract.
- Catalog baseline raised to 12 routes and 60 places.
- Required route themes are present:
  - Old Montreal Monuments Loop
  - Churches & Courtyards Walk
  - Architecture & River Views
  - Mount Royal Sunrise Loop
  - Plateau Architecture & Cafe Crawl
  - Lachine Canal Heritage Walk
  - Old Port & Foundries Walk
  - Place d'Armes Circuit
  - Public Art Downtown Walk
  - Hidden Squares & Quiet Streets
  - Markets and Neighborhood Food Walk
  - Museums and Campus Walk
- `validate:data`, `validate:routes`, and `validate:media` enforce the current content floor.
- MapLibre uses `NEXT_PUBLIC_MAP_STYLE_URL` when configured; when it is blank, the app uses the local static map fallback.
- `/routes/compare` now uses the browser-local compare basket when routes are selected, with a featured-route fallback when the basket is empty.
- `lib/routing/` exposes a manual fallback provider and optional external provider boundaries for OSRM, Valhalla, and GraphHopper.
- `/admin/route-builder` provides a read-only ordered-stop and geometry preview.
- Dry-run route scripts exist under `scripts/routes/`.
- Public/admin API coverage now includes nearby places, admin issues, data validation, and geometry preview.

## Next Implementation Slices

1. Implement real request generation in one routing adapter, starting with local OSRM or another configured provider.
2. Add route geometry review storage so generated geometry can be compared before curated replacement.
3. Add dry-run Wikimedia Commons candidate search that writes review JSON, not public media.
4. Add gated route-builder write actions behind `ENABLE_ADMIN_TOOLS` and `ENABLE_ADMIN_WRITE_ACTIONS` in a protected admin environment.
5. Add optional JSON provider before Postgres so curated data can move out of TypeScript without forcing a database.

## Non-Goals

- No real auth, payments, premium city packs, ticketing, social accounts, real AI route generation, road-trip mode, pilgrimage mode, audio stories, or offline downloads.
- No external API is required for local boot.
- No import script may overwrite curated content without an explicit future `--force` path and review queue.
