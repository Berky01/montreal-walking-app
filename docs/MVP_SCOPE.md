# Montreal MVP Scope

## Product Positioning

Meaningful Routes is a web-first walking discovery product for finding and following curated routes, monuments, heritage places, scenic walks, architectural routes, hidden gems, and local itineraries.

It is not a generic map app, generic trip planner, fitness tracker, social network, or UNESCO directory.

## MVP City

The first MVP is Montreal only.

All first-pass data, route cards, search results, place listings, map shells, and route detail pages should show Montreal routes and places. Multi-city, road-trip, pilgrimage, premium pack, and partner workflows are documented but excluded from this implementation slice.

## Core User Journey

1. Land on the product and understand the promise: meaningful walking routes in Montreal.
2. Enter `/app` to browse Montreal route suggestions and nearby places.
3. Search naturally or use quick filters for time, mood, and interests.
4. Review ranked route results with clear metrics and match explanations.
5. Open a route detail page with story, stops, map shell, safety notes, and accessibility notes.
6. Start live route mode.
7. Follow current-step and next-stop guidance in a mocked live experience.
8. Complete the route and review actual-looking mock session metrics.
9. Browse places/monuments and find related routes.

## Included P0A Pages

- `/` landing page
- `/app` app home / around me
- `/search` natural-language route search
- `/routes` route listing and filters
- `/routes/[slug]` route detail
- `/routes/[slug]/live` live route mode mock
- `/routes/[slug]/complete` route completion summary
- `/places` places/monuments listing
- `/places/[slug]` place/monument detail

## Included P0B Mock Pages

After the P0A pages compiled, this run added lightweight P0B surfaces so MVP navigation does not dead-end:

- `/saved`
- `/history`
- `/settings`
- `/report-issue`
- `/admin/route-qa`
- `/routes/compare`
- expanded next-stop preview content inside live route mode

These pages remain mock/local-state only. Saved/history persistence can be expanded in a later pass.

## Explicit Non-Goals For This Run

- Real AI route generation or AI search calls
- Real routing APIs
- Paid Mapbox/Google providers and key-required map providers
- Real weather APIs
- Real auth/accounts
- Payments or premium city packs
- Offline route downloads
- Audio stories
- Ticket/tour booking
- Partner dashboards
- Road-trip mode
- Long-distance pilgrimage mode
- Multi-city expansion
- Advanced social share or QR image generation
- PDF/GPX export workspace

## Data And State

The MVP uses TypeScript mock data and deterministic local logic only.

- Route and place content is local mock data.
- Search interpretation is deterministic and transparent.
- Live route mode is a mock session, not GPS tracking.
- Local storage can be used where needed, but no backend or environment variables are required.

## Acceptance Criteria For This Run

- Montreal-only mock routes and places render across the P0A pages.
- Natural-language search returns ranked routes with interpretation chips and explanations.
- Route detail, live route, and completion pages form a working flow.
- Place list and place detail pages form a working flow.
- Saved, history, settings, issue reporting, route QA, and compare pages exist as mock P0B surfaces.
- Important route data appears in text, not only on map visuals.
- The app uses Meaningful Routes naming throughout.
- The app compiles without backend/auth/payment/API dependencies.
