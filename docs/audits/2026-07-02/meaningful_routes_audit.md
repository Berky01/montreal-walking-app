# Meaningful Routes — Repo/Prototype + Live App Audit

Audit date: 2026-07-02

## Scope actually audited

- Live app: `https://routeapp.plexplease.xyz/`
- Supplied repository artifact: `/mnt/data/stitch_meaningful_routes_web_platform.zip`
- GitHub URLs supplied by user:
  - `https://github.com/Berky01/meaningful-routes.git`
  - `https://github.com/Berky01/meaningful-route`

The GitHub repository itself was not reachable from the audit environment: the web fetch returned 404 for both `meaningful-routes` and `meaningful-route`, and the local container could not resolve GitHub. I therefore audited the live app plus the uploaded Stitch/web-platform export.

---

## Executive summary

Meaningful Routes has a strong product direction: city discovery through meaningful places, optional walking routes, maps, safety/accessibility notes, saved/history, and route guidance. The live app already renders useful SSR content for Montreal: a home/explore surface, 60 listed places, 12 optional route collections, route detail pages, live route mode, saved/history/settings, and an issue-reporting page.

The main gap is production hardening. The live app currently behaves like a high-quality content prototype rather than a resilient product. The highest-risk issues are:

1. **Broken production deep links:** a sample of listed place pages returns HTTP 530, including Montreal City Hall, Crew Collective & Cafe, Kondiaronk Belvedere, Lachine Canal, Atwater Market, Habitat 67 Viewpoint, Laurier Park, The Illuminated Crowd, Place Jean-Riopelle, and others.
2. **Map fallback appears in the public UI:** many pages expose fallback text instead of a reliable map experience.
3. **Issue-reporting page leaks large placeholder/future regional data:** the form includes huge lists of future regions/routes/places that are not ready as public UX.
4. **Search and personalization are mostly static:** natural-language search, saved/history, preferences, and route comparison are visible but not yet a complete product loop.
5. **Repository/prototype artifact is not production code:** the supplied ZIP contains 82 static `code.html` screens with Tailwind CDN and duplicate font imports; it is a design inventory, not a maintainable source repository.

Recommendation: deploy a **Launch Hardening Sprint** before adding premium or long-distance features. The first deploy should make the existing Montreal experience reliable: fix deep links, map render/fallback, search/filter state, saved/history persistence, issue-reporting backend, QA status, and crawlable metadata.

---

## Live app audit

### What is working well

- Clear Montreal-first positioning and content direction.
- The app has meaningful server-rendered content, which is good for SEO, sharing, and accessibility compared with a client-only shell.
- Public place pages include story, practical notes, attribution, safety notes, and accessibility notes.
- Route detail pages include distance, time, stop count, difficulty, route purpose, stop timeline, safety, and accessibility notes.
- There is a coherent route catalog with 12 optional walks.
- Settings/saved/history/report-issue surfaces are present, which means the product loop has been designed.

### Critical live issues

#### P0-1: Broken place deep links

Several place cards on `/places` link to pages that return HTTP 530. This is the most urgent launch blocker because listed content appears clickable but fails when opened.

Examples observed:

- `/places/montreal-city-hall` -> 530
- `/places/crew-collective-cafe` -> 530
- `/places/st-patricks-basilica` -> 530
- `/places/kondiaronk-belvedere` -> 530
- `/places/lachine-canal` -> 530
- `/places/atwater-market` -> 530
- `/places/habitat-67-viewpoint` -> 530
- `/places/saint-louis-square` -> 530
- `/places/rialto-theatre` -> 530
- `/places/fairmount-bagel-area` -> 530
- `/places/la-fontaine-park` -> 530
- `/places/mcgill-arts-building` -> 530
- `/places/redpath-museum` -> 530
- `/places/laurier-park` -> 530
- `/places/illuminated-crowd` -> 530
- `/places/place-jean-riopelle` -> 530

Likely causes to investigate:

- Missing generated static params for place detail pages.
- Data records exist in list data but not in detail data.
- Image/media lookup fails for certain records.
- Slug mismatch between list cards and detail route resolver.
- Runtime exception during SSR for draft/placeholder records.
- Edge deployment/proxy returning 530 for unhandled server errors.

Acceptance criteria:

- Every place listed on `/places` returns 200.
- Every route stop link returns 200.
- Unknown slugs return a designed 404 page, not 530.
- CI includes link crawl for all place and route slugs.

#### P0-2: Map fallback visible instead of reliable map

The live app repeatedly renders fallback copy such as “Map preview - live tile style is loading or unavailable in this browser.” This may be acceptable as hidden accessibility text, but not as the primary public map experience. A routes app must have a reliable, visible, responsive map.

Fix direction:

- Use a stable map renderer such as MapLibre GL with OpenStreetMap-compatible tiles, Mapbox, or self-hosted vector tiles/PMTiles.
- Render a static image fallback for SSR/no-JS situations.
- Lazy-load interactive map only when visible.
- Show route geometry and POIs with keyboard-accessible list synchronization.
- Add telemetry for map tile failures.

Acceptance criteria:

- Map loads on desktop and mobile for home, places, routes, route detail, and live route.
- No public fallback text is visible during successful map render.
- Fallback state contains a static map image and accessible list.
- Map failure logs include route/page, tile provider, browser, and error code.

#### P0-3: Report issue page leaks placeholder/future data

The report page includes huge lists of future regions, regional highlight routes, and placeholder place names. This is not ready for public submission UX and makes the product feel untrustworthy.

Fix direction:

- Scope report form to the current context route/place/stop.
- Move future regions to seed/admin-only data.
- Replace massive select menus with typeahead/autocomplete.
- Add backend submission endpoint with validation, spam protection, and admin triage.
- Store report evidence, severity, status, reviewer, and resolution.

Acceptance criteria:

- A report opened from route live mode only preselects that route and stop.
- General reports can search current published places/routes only.
- Placeholder/future content is hidden behind admin flags.
- Submitted reports appear in admin QA inbox.

#### P0-4: Search is not yet a real discovery engine

The `/search` page shows suggested queries and featured places, but the SSR output does not demonstrate true natural-language search or filtered route generation. This needs to become the core value proposition.

Fix direction:

- Implement indexed search across place name, tags, neighborhood, content, accessibility, safety, best time, indoor/outdoor, route inclusion, and route metadata.
- Support natural-language intent parsing: “quiet rainy-day churches under 1 hour,” “food walk near Mile End,” “step-free scenic route,” etc.
- Add result ranking and explanations.
- Persist query state in the URL.

Acceptance criteria:

- Search results update by query and URL params.
- Results include both places and routes.
- Results explain why each item matched.
- Empty states suggest useful fallback searches.

#### P0-5: Saved/history are local-shell surfaces, not complete loops

Saved and history pages are present but feel incomplete. Saved says no saved discoveries yet while also showing suggested places/routes. History is nearly empty and depends on route completion.

Fix direction:

- Support anonymous local saves first, then optional account sync.
- Add save buttons with optimistic state on place/route cards.
- Add completed route writes from live mode.
- Add import/export of local library as JSON for privacy-first users.

Acceptance criteria:

- Save state persists after refresh.
- Saved page separates “saved” from “suggested.”
- Completing a route creates a history entry with date, route, stops visited, rating, notes, and share card.
- Clear data/reset controls are available.

---

## Repo/prototype artifact audit

The uploaded ZIP is a large design/prototype export:

- 82 `code.html` files
- 81 `screen.png` files
- 1 inventory markdown file
- Approximately 1.77 MB of HTML across the static screens
- 161 image tags across screens; 138 image tags have no `alt` attribute
- 851 buttons and 431 links across static screens
- Every HTML file imports Tailwind via CDN
- Every HTML file imports Material Symbols at least twice
- The export includes rich future surfaces: dynamic route generation, natural-language search, live route, next stop preview, route completion, offline cards, weather/time suggestions, issue reporting, saved/history/settings, premium city packs, tickets/tours, audio stories, admin QA dashboard, partner portal, road trip mode, pilgrimage mode, UNESCO/heritage layers.

Production concerns if these files are used directly:

1. **Tailwind CDN in production** — good for prototypes, bad for production performance, cache control, CSP, and deterministic builds.
2. **Duplicate font imports** — repeated Material Symbols imports add unnecessary requests and render cost.
3. **Static HTML duplication** — no reusable components or data-driven rendering.
4. **Accessibility gaps** — many image tags lack alt text in the export; form labels and interactive states need audit.
5. **No source-of-truth data model** — features are present as screens, not as integrated data/API flows.
6. **No testable business logic** — search, routing, saved/history, admin QA, offline, and monetization need real implementation.

Recommendation: treat the ZIP as a **product/design inventory**, then rebuild/merge it into a real app architecture with components, typed data, API routes, and tests.

---

## Launch hardening plan

### Week 1 — Reliability and content integrity

- Restore/publicize correct GitHub repo or provide private access for full code audit.
- Add CI link crawl for every published place, route, route-live page, and nav link.
- Fix all 530 place detail pages.
- Add typed content validation with required fields per publish status.
- Split content states: `draft`, `qa_ready`, `published`, `archived`.
- Hide draft/future content from public forms and routes.
- Add designed 404/500 pages and error logging.

### Week 2 — Map and search MVP

- Ship reliable map component with static fallback.
- Add route geometry, POI markers, selected stop state, and list/map sync.
- Implement real query/filter state for places and routes.
- Add query params for filters and search.
- Implement search ranking with match explanations.

### Week 3 — Live route and local library loop

- Implement live route state machine: start, visited, skip, pause, resume, end, abandon.
- Persist local saves/history/preferences in local storage or IndexedDB.
- Add optional login later; do not block the anonymous loop.
- Build route completion page and share card from real history data.
- Add report-issue submission and admin queue.

### Week 4 — Performance, accessibility, SEO, and deployment gates

- Remove Tailwind CDN and compile CSS at build time.
- Remove duplicate font requests; self-host or subset fonts if licensing permits.
- Add metadata, Open Graph images, sitemap, robots, canonical URLs.
- Add security headers: CSP, HSTS, X-Frame-Options/frame-ancestors, referrer policy, permissions policy.
- Run Lighthouse/WebPageTest and Playwright accessibility flows.
- Add production observability: errors, web vitals, failed map loads, failed route starts, report submissions.

---

## Recommended production architecture

### Data model

Core tables/entities:

- `cities`
- `neighborhoods`
- `places`
- `place_media`
- `routes`
- `route_stops`
- `route_segments`
- `tags`
- `place_tags`
- `route_tags`
- `safety_notes`
- `accessibility_notes`
- `reports`
- `reviews/qa_checks`
- `user_saves`
- `route_sessions`
- `route_session_events`
- `history_entries`
- `city_packs` later
- `partner_kits` later

Suggested DB stack:

- Postgres + PostGIS for coordinates, bounding boxes, route geometry, proximity, and spatial search.
- Object storage for images/audio/offline cards.
- Search index: Postgres full-text for MVP; Meilisearch/Typesense later if needed.
- Queue for ingestion, image processing, route generation, and QA checks.

### Place publish validation

Required for `published` place:

- `name`
- `slug`
- `city_id`
- `lat`, `lng`
- `neighborhood_id`
- `type`
- `short_description`
- `why_it_matters`
- `story`
- `practical_info`
- `safety_notes`
- `accessibility_notes`
- at least one media item with license/attribution
- `last_reviewed_at`
- `source_quality` not `draft`

### Route publish validation

Required for `published` route:

- `name`
- `slug`
- `city_id`
- `distance_meters`
- `estimated_minutes`
- `shape`: loop/one_way/out_and_back
- `difficulty`
- `route_geometry`
- at least 3 stops
- stop order + segment distances
- safety/accessibility summary
- best time/weather fit
- QA score threshold

---

## Feature roadmap

### P0: Must ship before serious public traffic

- Fix deep links and 500/530 handling.
- Real map rendering and static fallback.
- Real search/filter state.
- Local saved/history/preferences loop.
- Report issue backend and admin triage.
- Publish-state gates for draft/future content.
- SEO metadata and sitemap.
- Performance/security baseline.
- Automated E2E tests.

### P1: Differentiating MVP features

- Dynamic route builder: user chooses time, interests, pace, accessibility, start area, indoor/outdoor preference.
- Natural-language discovery with explainable matching.
- Live route guidance with visited/skip/pause/end state.
- Route completion and share cards.
- Weather/time suggestions.
- Offline route cards.
- “Around me” mode with privacy-preserving geolocation.
- Admin QA dashboard.

### P2: Growth and retention

- Account sync for saved routes/history.
- Multi-city expansion once the city data pipeline is reliable.
- Community suggestions with moderation.
- Audio stories for selected routes.
- Partner guest route kits.
- Premium city packs.

### P3: Advanced expansion

- Tickets/tours marketplace integrations.
- Long-distance pilgrimage mode.
- Road trip mode.
- Heritage/UNESCO layers.
- Multi-day itinerary planner.
- Partner analytics.

---

## Deployment checklist

Before next deploy:

- [ ] All public pages return 200 or designed 404.
- [ ] No public page returns 530/500.
- [ ] All published places/routes pass schema validation.
- [ ] Draft/future data hidden from public surfaces.
- [ ] Map works and has static fallback.
- [ ] Search/filter state works and is URL-addressable.
- [ ] Saved/history/preferences persist after refresh.
- [ ] Report issue submits to backend and appears in admin queue.
- [ ] Sentry/Logtail/Datadog or equivalent captures server/client errors.
- [ ] Web vitals tracked.
- [ ] Security headers enabled.
- [ ] Lighthouse/accessibility pass on home, places, route detail, live route, settings.
- [ ] Sitemap/robots/canonical/Open Graph configured.
- [ ] CI runs typecheck, lint, unit tests, Playwright smoke tests, and link crawl.

---

## Suggested smoke tests

1. Home page loads.
2. `/places` lists 60 places.
3. Every place card link returns 200.
4. `/routes` lists 12 optional routes.
5. Every route detail link returns 200.
6. Every route live/start link returns 200.
7. Search query `churches rainy day` returns churches and routes.
8. Search query `food Mile End` returns market/food routes and places.
9. Save a place, refresh, saved page shows it.
10. Save a route, refresh, saved page shows it.
11. Start route, mark first stop visited, refresh, progress persists.
12. End route, history entry appears.
13. Submit issue from live route, admin queue receives it.
14. Unknown place slug returns 404.
15. Map failure renders static fallback, not blank UI.

---

## Highest-value next implementation sequence

The best next deploy is not premium packs or tickets. It is a reliable Montreal MVP:

1. **Content routing integrity:** all listed places/routes resolve.
2. **Map MVP:** route geometry + markers + selected stop + static fallback.
3. **Search MVP:** query + filters + ranking + route/place results.
4. **Local user loop:** save, preferences, active route session, completion/history.
5. **Feedback loop:** issue report backend + admin QA.
6. **Deploy gates:** tests, telemetry, accessibility, performance, security.

After that, build dynamic route generation and weather/time suggestions. Only then should premium packs, partner kits, tickets/tours, and long-distance modes be deployed.
