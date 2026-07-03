# Meaningful Routes Implementation Report

Updated: 2026-07-02

## Summary

This report tracks the audit-package implementation against the P0/P1 backlog preserved in `docs/audits/2026-07-02/`.

Current status: non-visual P0 foundation and hardening slice completed and deployed live. The updated private Stitch mockup package has now been inspected and mapped to the current app. The public MVP surfaces are implemented through existing production components; remaining Stitch concepts are either consolidated, gated, deferred, or excluded by current scope.

Continuation slice on 2026-07-02: the public report issue form now keeps route-context selected reports compact by limiting place choices to the selected route's published stops, while still allowing a no-route place-only report path. This advances P0 report issue cleanup without changing the approved Stitch style lock.

Search continuation slice on 2026-07-02: place search now shares a tested ranking helper with visible "Why this matched" explanations on published place results. This completes the remaining local-first search MVP gap without introducing AI generation or changing the approved Stitch layout.

Stitch P0 source/trust continuation slice on 2026-07-02: place detail pages now use reusable source-trust panels, an accessible source drawer, and honest then-now media states backed by existing source/media metadata. Live route pages now show estimated steps, pace, and current-stop context from local session data, and completion pages include a browser-local walk journal card. Admin route QA now surfaces source-readiness status behind the existing `ENABLE_ADMIN_TOOLS` gate.

Follow-up closure slice on 2026-07-02: contextual report links were added to route/place detail heroes, search now shows optional route matches for theme/location queries with explicit match explanations, place search handles plural category queries such as `churches`, card-level save/refresh persistence is covered by smoke tests, the `/cities` count copy now distinguishes published area filters from featured neighborhood guides, and the expanded smoke suite verifies 404, sitemap/robots, security headers, search, persistence, report context, and The Illuminated Crowd fallback behavior.

## Stitch Implementation Status

Active Stitch project inspected: `https://stitch.withgoogle.com/projects/7741303272075430847`

Active intake docs:

- `docs/design/stitch-screen-inventory.md`
- `docs/design/stitch-component-map.md`
- `docs/design/stitch-style-lock.md`

| Stitch screen/section | App route/component | Status | Evidence | Deviations |
|---|---|---|---|---|
| Landing Page | `/` | Implemented | `app/page.tsx` | Uses live production data/components, not Stitch static HTML. |
| App Home | `/app` | Implemented | `app/app/page.tsx`, `components/app/app-home-experience.tsx` | Current green visual MVP retained. |
| Places Catalog / Discover Monuments / Filters | `/places` | Implemented | `app/places/page.tsx`, `components/places/places-page-client.tsx` | Named as places/catalog to avoid monument-only scope. |
| Place/Monument Detail | `/places/[slug]` | Implemented | `app/places/[slug]/page.tsx`, `components/visual/visuals.tsx`, `components/places/place-trust-panels.tsx`, `lib/content-trust.ts` | Public place examples consolidated into one dynamic template with source-trust, source drawer, then-now media states, and contextual report links. |
| Route Results | `/routes` | Implemented | `app/routes/page.tsx`, `components/routes/routes-page-client.tsx` | Optional-route language retained. |
| Route Detail / Public Route Page | `/routes/[slug]` | Implemented | `app/routes/[slug]/page.tsx`, `components/visual/visuals.tsx`, `components/routes/route-guide-client.tsx` | Public route page consolidated with route detail to avoid duplicate surfaces; route reports now carry route context. |
| Live Route | `/routes/[slug]/live` | Implemented | `app/routes/[slug]/live/page.tsx`, `components/walk/live-route-client.tsx`, `lib/walk-metrics.ts` | Local route session with estimated steps/pace; no required geolocation or device integration. |
| Completion / Share | `/routes/[slug]/complete` | Implemented/partial | `app/routes/[slug]/complete/page.tsx`, `components/walk/completion-summary-client.tsx`, share component | Browser-local journal card added. Advanced share-card generation remains deferred. |
| Search | `/search` | Implemented | `app/search/page.tsx`, `components/search/search-page-client.tsx`, `components/routes/route-card.tsx`, `lib/search/place-search.ts` | Deterministic local place and route ranking with visible match reasons instead of real AI. |
| Saved / History / Settings | `/saved`, `/history`, `/settings` | Implemented | App routes and `components/library`, `components/walk` | Browser-local state by design. |
| Issue Reporting | `/report-issue` | Implemented for mock mode | `app/report-issue/page.tsx`, `components/feedback/issue-report-form.tsx` | Durable backend remains deferred. |
| Admin QA | `/admin/route-qa` | Implemented, disabled by default | `app/admin/layout.tsx`, `app/admin/route-qa/page.tsx` | Uses `ENABLE_ADMIN_TOOLS` gate rather than public exposure. |
| Premium, tickets, audio, road-trip, pilgrimage, partner, offline cards | None public | Excluded/gated | `docs/design/stitch-screen-inventory.md` | Excluded by `AGENTS.md` current scope. |

## Baseline

Repository state at start:

- Branch created: `codex/audit-p0-mvp-hardening`.
- Worktree was clean before edits.
- Remote: `origin` -> `https://github.com/Berky01/meaningful-routes.git`.
- Framework: Next.js 15 App Router, React 19, TypeScript.
- Package manager: npm with `package-lock.json`.
- Data source default: mock/local data.
- Test stack: Vitest and Playwright.
- Deploy target: Unraid/Docker for `https://routeapp.plexplease.xyz/`.

Baseline commands:

| Command | Result |
|---|---|
| `npm test` | Pass: 26 test files, 102 tests. |
| `npm run validate:data` | Pass: 32 routes, 190 places; public readiness 12 routes, 60 places. |
| `npm run validate:routes` | Pass: 32 routes, 32 ready. |
| `npm run validate:media` | Pass: 293 assets, 71 approved real photos, 222 generated fallbacks. |
| `npm run typecheck` | Pass. |
| `npm run lint` | Pass. |
| `npm run build` | Pass: 126 static pages generated. |
| `npm run test:smoke` | Fail before edits: Playwright could not connect to `http://127.0.0.1:3105`; no web server was started by `playwright.config.ts`. |

Final validation after implementation:

| Command | Result |
|---|---|
| `npm run lint` | Pass. |
| `npm run typecheck` | Pass. |
| `npm run validate:content` | Pass: 12 public routes, 60 public places, 105 crawl paths. |
| `npm run validate:data` | Pass: 32 routes, 190 places; public readiness 12 routes, 60 places. |
| `npm run validate:routes` | Pass: 32 routes, 32 ready. |
| `npm run validate:media` | Pass: 293 assets, 71 approved real photos, 222 generated fallbacks. |
| `npm test` | Pass: 26 test files, 104 tests. |
| `npm run build` | Pass: 128 static pages generated. |
| `npm run test:smoke` | Pass: 6 Playwright smoke tests. |

## P0 Backlog Status

| Area | Status | Evidence |
|---|---:|---|
| Repository access/docs | Done | Remote is configured. Audit inputs preserved under `docs/audits/2026-07-02/`. README/docs updated for content health and smoke commands. |
| Broken place links | Done | Smoke crawler visits `/places`, every linked public place detail, `/routes`, every linked public route detail, and every linked route live page. Unknown place/route slugs return 404. |
| Error handling | Done | Existing designed `app/not-found.tsx` retained; added `app/error.tsx` with non-sensitive error ID display and console logging. |
| Map fallback | Done | Local static map remains the no-key default. Removed raw "Map preview" fallback copy from normal no-key state; tile-load failure shows concise static-map fallback copy. |
| Issue reporting | Done for mock mode | Public form posts to `/api/report-issue`, validates published context, has honeypot/rate-limit guard, writes to mock provider queue, keeps local browser fallback, and limits place selectors to the selected route's public stops unless the user chooses a no-route place-only report. Durable DB store remains deferred. |
| Publish-state gating | Done | Public helpers expose 12 public routes and 60 public places only; tests verify generated/draft discovery content is blocked from public lookups and crawl manifest. |
| Search MVP | Done | Existing route ranking and new tested place ranking map to the Stitch search surface while staying deterministic and local-first. Place cards now explain why each published result matched. |
| Saved loop | Existing/prepared | Existing local-storage saved loop verified by smoke. No layout changes made. |
| History loop | Existing/prepared | Existing route completion/history loop verified by smoke. No layout changes made. |
| Live route state | Existing/prepared | Existing durable local route session loop verified by smoke. No layout changes made. |
| Content validation | Done | Added `getAllPublicSlugsForCrawl()` and `scripts/content-health.ts`; `npm run validate:content` passes with 105 public crawl paths. |
| CI smoke tests | Done | Playwright config now starts a local app server; smoke covers public route/place crawler, required paths, headers, SEO files, images, persistence flows, and viewport overflow. |
| Security baseline | Done | Added security headers in `next.config.mjs`: CSP, HSTS, frame denial/frame-ancestors, nosniff, referrer policy, and permissions policy. |
| Follow-up audit checks | Done and deployed | Expanded smoke verifies contextual report links, card save persistence after refresh, search URL and match explanations, unknown slugs, sitemap/robots, security headers, city count copy, The Illuminated Crowd visual fallback, and viewport overflow. |

## P1/P2/P3 Work Completed

- SEO basics: added `app/robots.ts`, `app/sitemap.ts`, Open Graph/Twitter metadata basics, and route/place Open Graph metadata.
- No wholesale UI rewrite was done. The current production UI already maps to the approved Stitch public MVP hierarchy through reusable app components, and deferred screens are now tracked in `docs/design/stitch-screen-inventory.md`.

## Follow-up Audit Evidence

| Item | Evidence | Status |
|---|---|---:|
| 1. Contextual report links | `tests/playwright-smoke.pw.ts` visits `/routes/old-montreal-monuments-loop`, `/routes/old-montreal-monuments-loop/live`, and `/places/place-darmes`, then verifies `/report-issue` preserves selected route, stop, and place context. | Pass local/live |
| 2. Save/unsave on cards | `components/places/place-card.tsx` and `components/routes/route-card.tsx` render card-level `SaveButton`s; smoke saves from `/places` and `/routes`, refreshes, and verifies `aria-pressed="true"`. | Pass local/live |
| 3. Search query URLs and explanations | Smoke verifies `/search?q=architecture`, `/search?q=old+montreal`, `/search?q=rainy+day`, and `/search?q=churches` keep `q=` in the URL, show published place results and optional route results, include `Why this matched`, and exclude draft/future/regional terms. | Pass local/live |
| 4. Persistence flows | Smoke verifies saved place refresh, saved route refresh, live route progress refresh, completion history persistence, and report context from route/live/place paths. | Pass local/live |
| 5. Unknown slugs | Smoke verifies `/places/not-a-real-place-123`, `/routes/not-a-real-route-123`, and `/not-a-real-page-123` return 404 and render `This page is not on the map`. | Pass local/live |
| 6. Sitemap and robots | Smoke verifies `/robots.txt` and `/sitemap.xml` exist, sitemap includes 60 place URLs and 12 route URLs, and excludes `/admin`, `/api`, regional, day-trip, and bike-friendly content. | Pass local/live |
| 7. Security headers | Smoke verifies `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and CSP `frame-ancestors 'none'`; source config remains `next.config.mjs`. | Pass local/live |
| 8. City copy mismatch | `/cities` now says 60 published places across 23 area filters with 6 featured neighborhood guides; smoke verifies the copy. | Pass local/live |
| 9. The Illuminated Crowd media | Smoke visits `/places/illuminated-crowd`, verifies no broken images, confirms media labels include Illuminated Crowd, and confirms no placeholder or pending-media copy appears. | Pass local/live |
| 10. Implementation report | This section records command, test, backlog, and deployment status for the follow-up closure slice. | Updated |

## Files Changed

Current follow-up closure slice:

- `app/cities/page.tsx` - makes the city summary count public area filters separately from featured neighborhood guides.
- `components/visual/visuals.tsx` - adds contextual report links to route and place detail heroes.
- `components/search/search-page-client.tsx` - includes optional route results for theme, mood, and area search queries.
- `components/routes/route-card.tsx` - renders route search `Why this matched` explanations.
- `lib/search/place-search.ts` - adds plural-aware matching for categories and tags such as `churches`.
- `lib/search/place-search.test.ts` - covers plural category search matching.
- `tests/playwright-smoke.pw.ts` - expands smoke coverage for persistence, search, report context, 404s, security/SEO, city copy, and The Illuminated Crowd; replaces brittle `networkidle` readiness with page load plus visible `main`.
- `docs/implementation-report.md` - records current follow-up evidence.

## Commands Run

- `git status --short`
- `git branch --show-current`
- `git remote -v`
- `git log --oneline -n 12`
- `git diff --stat`
- `npm test`
- `npm run validate:data`
- `npm run validate:routes`
- `npm run validate:media`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run test:smoke`
- `npm test -- lib/search/place-search.test.ts` (red: missing module / behavior before helper; green after implementation)
- `npx playwright test --config=playwright.config.ts tests/playwright-smoke.pw.ts -g "saved, share"`
- `npm run lint`
- `npm run typecheck`
- `npm run validate:content`
- `npm run validate:data`
- `npm run validate:routes`
- `npm run validate:media`
- `npm test`
- `npm run build`
- `npm run test:smoke`
- `git archive --format=tar HEAD | ssh plexplease "mkdir -p /mnt/user/appdata/routeapp && cd /mnt/user/appdata/routeapp && tar -xf -"`
- `ssh plexplease "cd /mnt/user/appdata/routeapp && BUILD_SHA=6577c089ee3087d9a632a905b95fec77f576bd25 BUILD_TIME=2026-07-02T20:17:33.6445445-04:00 docker compose -f docker-compose.routeapp.yml up -d --build routeapp"`
- `ssh plexplease "docker ps --filter name=routeapp --format '{{.Names}} {{.Status}} {{.Image}}'"`
- `curl.exe -sS -D - https://routeapp.plexplease.xyz/api/health`
- `curl.exe -sS https://routeapp.plexplease.xyz/api/build-info`
- `ssh plexplease "docker exec cloudflared cloudflared tunnel --config /etc/cloudflared/config.yml ingress validate"`
- `PLAYWRIGHT_BASE_URL=https://routeapp.plexplease.xyz npx playwright test --config=playwright.config.ts tests/playwright-smoke.pw.ts` (initial run: 10 passed, viewport overflow smoke timed out at brittle `networkidle` wait despite rendered `/settings`; green after smoke helper fix)
- `npm run test:smoke`
- `PLAYWRIGHT_BASE_URL=https://routeapp.plexplease.xyz npx playwright test --config=playwright.config.ts tests/playwright-smoke.pw.ts`
- `npm ci --dry-run`
- `git rev-parse HEAD`
- `git archive --format=tar HEAD | ssh plexplease "cd /mnt/user/appdata/routeapp && tar -xf -"`
- `ssh plexplease "cd /mnt/user/appdata/routeapp && BUILD_SHA=72811f8045717f65ac09ed94736418984ffae4b3 BUILD_TIME=2026-07-02T19:50:56.6455115-04:00 docker compose -f docker-compose.routeapp.yml up -d --build routeapp"`
- `ssh plexplease "docker ps --filter name=routeapp --format '{{.Names}} {{.Status}} {{.Image}}'"`
- `curl.exe -sS -D - https://routeapp.plexplease.xyz/api/health`
- `curl.exe -sS https://routeapp.plexplease.xyz/api/build-info`
- `PLAYWRIGHT_BASE_URL=https://routeapp.plexplease.xyz npx playwright test --config=playwright.config.ts tests/playwright-smoke.pw.ts -g "saved, share"`
- `ssh plexplease "docker exec cloudflared cloudflared tunnel --config /etc/cloudflared/config.yml ingress validate"`
- `npm run validate:content`
- `npx playwright test --config=playwright.config.ts tests/playwright-smoke.pw.ts -g "saved, share"`
- `npm test -- lib/issue-reports.test.ts` (red: missing `getIssueReportPlaceOptions`; green after implementation)
- `npx playwright test --config=playwright.config.ts tests/playwright-smoke.pw.ts -g "production pages do not expose"`
- `npm run lint`
- `npm run typecheck`
- `npm run validate:content`
- `npm run validate:data`
- `npm run validate:routes`
- `npm run validate:media`
- `npm test`
- `npm run build`
- `npm run test:smoke`
- `npm test -- lib/content-trust.test.ts lib/walk-metrics.test.ts`
- `npm run lint`
- `npm run typecheck`
- `npm run validate:data`
- `npm run validate:routes`
- `npm run validate:media`
- `npm test`
- `npm run build`
- `npm run test:smoke`
- `git archive --format=tar HEAD | ssh plexplease "mkdir -p /mnt/user/appdata/routeapp && cd /mnt/user/appdata/routeapp && tar -xf -"`
- `ssh plexplease "cd /mnt/user/appdata/routeapp && BUILD_SHA=acb5a4167ccc8b038a74cf34d59668fea749daef BUILD_TIME=2026-07-02T20:07:58.6336910-04:00 docker compose -f docker-compose.routeapp.yml up -d --build routeapp"`
- `ssh plexplease "docker ps --filter name=routeapp --format '{{.Names}} {{.Status}} {{.Image}}'"`
- `curl.exe -sS -D - https://routeapp.plexplease.xyz/api/health`
- `curl.exe -sS https://routeapp.plexplease.xyz/api/build-info`
- `ssh plexplease "docker exec cloudflared cloudflared tunnel --config /etc/cloudflared/config.yml ingress validate"`
- `PLAYWRIGHT_BASE_URL=https://routeapp.plexplease.xyz npx playwright test --config=playwright.config.ts tests/playwright-smoke.pw.ts -g "core route and place pages render local photo assets without broken images"`
- `npx playwright test --config=playwright.config.ts tests/playwright-smoke.pw.ts -g "search query|report issue links|city copy|illuminated|unknown slugs|saved, share"` (red before implementation: missing optional route search results, missing route detail report link, stale `/cities` copy; green after implementation)
- `npm test -- lib/search/place-search.test.ts` (red before implementation: `churches` did not match singular `church`; green after plural-aware matching)
- `npm ci --dry-run`
- `npm run lint`
- `npm run typecheck`
- `npm run validate:content`
- `npm run validate:data`
- `npm run validate:routes`
- `npm run validate:media`
- `npm test`
- `npm run build`
- `npm run test:smoke`

## Test Evidence

Latest follow-up closure validation:

| Command | Result |
|---|---|
| `npm ci --dry-run` | Pass; npm repeated the existing `allow-scripts` warning for `esbuild`, `sharp`, and `unrs-resolver`. |
| `npm run lint` | Pass. |
| `npm run typecheck` | Pass. |
| `npm run validate:content` | Pass: 12 public routes, 60 public places, 105 crawl paths. |
| `npm run validate:data` | Pass: 32 routes, 190 places; public readiness 12 routes, 60 places. |
| `npm run validate:routes` | Pass: 32 routes, 32 ready. |
| `npm run validate:media` | Pass: 293 assets, 71 approved real photos, 222 generated fallbacks. |
| `npm test -- lib/search/place-search.test.ts` | Pass: 1 test file, 2 tests. |
| `npm test` | Pass: 28 test files, 111 tests. |
| `npm run build` | Pass: 128 static pages generated. |
| `npm run test:smoke` | Pass: 11 Playwright smoke tests. |
| `PLAYWRIGHT_BASE_URL=https://routeapp.plexplease.xyz npx playwright test --config=playwright.config.ts tests/playwright-smoke.pw.ts` | Pass: 11 live Playwright smoke tests after replacing the brittle `networkidle` wait. |

## Deploy Notes

Deployment completed to Unraid.

Evidence:

- Current Stitch source/trust implementation slice:
  - Branch pushed: `codex/stitch-discovery-redesign`.
  - Deployed commit: `acb5a4167ccc8b038a74cf34d59668fea749daef`.
  - Container: `routeapp` rebuilt and restarted on Unraid; Docker status healthy.
  - Live health: `https://routeapp.plexplease.xyz/api/health` returned HTTP 200 with `status="healthy"`, `publicRoutes=12`, `publicPlaces=60`, and `publicCrawlPaths=105`.
  - Live build info: `https://routeapp.plexplease.xyz/api/build-info` returned `gitSha="acb5a4167ccc8b038a74cf34d59668fea749daef"`.
  - Live focused smoke: `PLAYWRIGHT_BASE_URL=https://routeapp.plexplease.xyz npx playwright test --config=playwright.config.ts tests/playwright-smoke.pw.ts -g "core route and place pages render local photo assets without broken images"` passed.
  - Live rendered place check confirmed `Source drawer`, `Then and now`, `Source checked`, and `Approved media` on `/places/place-darmes`.
  - Cloudflared ingress validation returned `OK` through the running `cloudflared` container.

- Current search explanation slice:
  - Branch pushed: `codex/stitch-discovery-redesign`.
  - Deployed commit: `72811f8045717f65ac09ed94736418984ffae4b3`.
  - Container: `routeapp` rebuilt and restarted on Unraid; Docker status healthy.
  - Live health: `https://routeapp.plexplease.xyz/api/health` returned HTTP 200 with `status="healthy"`, `publicRoutes=12`, `publicPlaces=60`, and `publicCrawlPaths=105`.
  - Live build info: `https://routeapp.plexplease.xyz/api/build-info` returned `gitSha="72811f8045717f65ac09ed94736418984ffae4b3"`.
  - Live focused smoke: `PLAYWRIGHT_BASE_URL=https://routeapp.plexplease.xyz npx playwright test --config=playwright.config.ts tests/playwright-smoke.pw.ts -g "saved, share"` passed.
  - Cloudflared ingress validation returned `OK` through the running `cloudflared` container.

- Latest runtime deploy for the report issue selector slice:
  - Branch pushed: `codex/stitch-discovery-redesign`.
  - Deployed commit: `98f049597f0c04352c2d69f34915d90968d04f7f`.
  - Container: `routeapp` rebuilt and restarted on Unraid; Docker status healthy.
  - Live health: `https://routeapp.plexplease.xyz/api/health` returned HTTP 200 with `status="healthy"`, `publicRoutes=12`, `publicPlaces=60`, and `publicCrawlPaths=105`.
  - Live build info: `https://routeapp.plexplease.xyz/api/build-info` returned `gitSha="98f049597f0c04352c2d69f34915d90968d04f7f"`.
  - Live focused smoke: `PLAYWRIGHT_BASE_URL=https://routeapp.plexplease.xyz npx playwright test --config=playwright.config.ts tests/playwright-smoke.pw.ts -g "production pages do not expose"` passed.
  - Cloudflared ingress validation returned `OK`.

- Current follow-up closure slice:
  - Branch pushed: `codex/stitch-discovery-redesign`.
  - Deployed runtime commit: `6577c089ee3087d9a632a905b95fec77f576bd25`.
  - Container: `routeapp` rebuilt and restarted on Unraid; Docker status reported `Up ... (healthy) routeapp:latest`.
  - Live health: `https://routeapp.plexplease.xyz/api/health` returned HTTP 200 with `status="healthy"`, `publicRoutes=12`, `publicPlaces=60`, and `publicCrawlPaths=105`.
  - Live build info: `https://routeapp.plexplease.xyz/api/build-info` returned `gitSha="6577c089ee3087d9a632a905b95fec77f576bd25"`.
  - Live security headers include CSP `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, HSTS, and `Permissions-Policy`.
  - Live full smoke: `PLAYWRIGHT_BASE_URL=https://routeapp.plexplease.xyz npx playwright test --config=playwright.config.ts tests/playwright-smoke.pw.ts` passed 11 tests.
  - Cloudflared ingress validation returned `OK`.

Previous deployment evidence:

- Branch pushed: `codex/stitch-discovery-redesign`.
- Deployed commit: `6ee5cc814f1e89284e996f61033f5a6d465cf422`.
- Container: `routeapp` rebuilt and restarted on Unraid; Docker status healthy.
- Live health: `https://routeapp.plexplease.xyz/api/health` returned HTTP 200 with `status="healthy"`, `publicRoutes=12`, `publicPlaces=60`, and `publicCrawlPaths=105`.
- Live build info: `https://routeapp.plexplease.xyz/api/build-info` returned `gitSha="6ee5cc814f1e89284e996f61033f5a6d465cf422"`.
- Live route/place checks: `/places/montreal-city-hall` returned 200; `/routes/not-a-real-route` returned 404.
- Live security headers include `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and CSP `frame-ancestors 'none'`.
- Cloudflared ingress validation returned `OK`.

Notes:

- `DATA_SOURCE=mock` remains the default.
- The public issue queue is in-process for mock mode and is not durable across server restarts.
- The local map fallback is still the no-key default; configure `NEXT_PUBLIC_MAP_STYLE_URL` only when a browser-safe MapLibre style URL is available.

## Remaining Work

- Add durable server-side persistence for issue reports before switching away from mock/in-process storage.
- Consider addressing `npm ci` audit output from Docker build separately: 7 vulnerabilities reported by npm audit in existing dependencies.
- Use `docs/design/stitch-screen-inventory.md` and `docs/design/stitch-component-map.md` before future Stitch-backed layout work.
