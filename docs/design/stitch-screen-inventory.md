# Stitch Screen Inventory

Updated: 2026-07-02

## Source

- Approved Stitch project: `Meaningful Routes Web Platform`
- Project URL: `https://stitch.withgoogle.com/projects/7741303272075430847`
- Project id: `7741303272075430847`
- Project visibility: private
- Stitch update time inspected: `2026-07-02T23:10:12Z`
- Inventory source screen: `Meaningful Routes - Reorganized Inventory`, `projects/7741303272075430847/screens/77d5e526a1284d4183578c9376ba5dd0`
- Style lock source screen inspected: `00 Style Lock - Original Meaningful Routes`, `projects/7741303272075430847/screens/c9645119069f42d2a8b26cc2ebb3934c`

This inventory maps the approved Stitch mockups to the current Next.js app. Do not copy static Stitch HTML into production. Build reusable components and preserve the current Montreal MVP boundaries in `AGENTS.md`.

## Current MVP Screen Map

| Stitch screen or group | App route/component | Desktop source | Mobile source | Priority | Status | Notes |
|---|---|---|---|---|---|---|
| Landing Page | `/` | `Landing Page (Desktop)` `acfcfb43b7fb454491494732a8233366` | `Landing Page (Mobile)` `1390a16b4d3744baa409038ffd849677` | P0 | Implemented | Current landing uses discovery-first copy, map preview, place cards, route cards, and real Montreal data. |
| App Home | `/app` | `App Home (Desktop)` `d4ddd8802505418786eaea041f09ff5e` | Inventory ref `SCREEN_45` | P0 | Implemented | Uses `AppHomeExperience`, split map/list layout, place-first sections, route cards, local-state summary, and quick filters. |
| Map Explorer | Folded into `/app`, `/places`, `/routes`, `/search` | `Map Explorer (Desktop)` `fca08ee193bd4ce1b25bdf16455d8587` | Inventory ref `SCREEN_37` | P0 | Implemented as pattern | `MapShell` and `SplitMapLayout` provide map/list parity and static fallback. No standalone public map route is required for MVP. |
| Discover Monuments | `/places` | `Discover Monuments (Desktop)` `7f7a5529e5de489aa9f3c43238e4d089` | Inventory ref `SCREEN_7` | P0 | Implemented | Current route is named places/catalog to avoid monument-only narrowing. |
| Monument List & Filters | `/places` filters | Inventory ref `SCREEN_67` | `Monument List & Filters (Mobile)` `8e05e1b8feaa4386a85f2a74be4667af` | P0 | Implemented | Search, category, neighborhood, and tag filters are backed by published Montreal places. |
| Places Catalog | `/places` | `Places Catalog (Desktop)` `48f249666da345bc8ce76f1b4390fd6b` | N/A | P0 | Implemented | Same public catalog surface as Discover Monuments. |
| Monument Detail | `/places/[slug]` | `Monument Detail (Desktop)` `757faf096ecb4695988c511502c23c96` | `Monument Detail (Mobile)` `06d5bcb0cb984c7eb24f48ca86e58742` | P0 | Implemented | Uses current `PlaceHero`, story/practical cards, map, safety/accessibility notes, related routes, and nearby places. |
| Place Detail - Kondiaronk Belvedere | `/places/kondiaronk-belvedere` style/content reference | `Place Detail - Kondiaronk Belvedere` `7f8fadc90d67475fb92075fdfadc147e` | N/A | P0 | Implemented as dynamic route | Specific Stitch example maps to the generic place detail template. |
| Route Results | `/routes` | Inventory ref `SCREEN_65` | `Route Results (Mobile)` `11c0aa4f71714ed09f5af715dfa2ee57` | P0 | Implemented | Current route listing supports route filters, compare basket, map selection, and public route gating. |
| Route Detail | `/routes/[slug]` | `Route Detail - Old Montreal Loop` `3acf62670dc9433bbf08ec1fb56e3a25`; `Route Detail (Desktop)` `0c24733a88214d0b85a9ea69f801c33d` | Inventory ref `SCREEN_34`; `Route Detail + Live Walk Completeness (Mobile)` `0f1f2a673ad74c27b5561a1a05512c1e` | P0 | Implemented | Current template includes hero, preference metrics, why/practical/detail cards, stop timeline, map, and sticky actions. |
| Public Route Page | `/routes/[slug]` SEO metadata | `Public Route Page (Desktop)` `1e8b9bbe23554d2aa842246224508d02` | `Public Route Page (Mobile)` `42121c2264a34b1a9580f05a876dc5f0` | P0 | Implemented through dynamic route | Separate public route page is consolidated with route detail to avoid duplicate URL surfaces. |
| Route Comparison | `/routes/compare` | Inventory ref `SCREEN_32` | `Route Comparison (Mobile)` `96967772c08e4138887b4cf3b412e556` | P1 | Implemented | Current compare surface is local-first and only compares published routes. |
| Natural Language Search | `/search` | Inventory ref for desktop search | `Natural Language Search (Mobile)` `a51d42f736d94314ab9efcfd7cefebba` | P0 | Implemented as deterministic search | No external AI dependency. Route-like queries use local ranking and explanation chips. |
| Live Route | `/routes/[slug]/live` | `Live Route (Desktop)` `af8f7a66243148d8b442d9889e95282b` | `Live Route (Mobile)` `151eef8ec3c048c68ff5475224e7eeff` | P0 | Implemented | Uses local route session state and map/list alternatives. |
| Next Stop Preview | Folded into live route | Inventory refs `SCREEN_70`, `SCREEN_27` | Inventory refs `SCREEN_70`, `SCREEN_27` | P1 | Implemented as pattern | The active/live route surface owns this behavior rather than a separate page. |
| Route Completion | `/routes/[slug]/complete` | `Route Completed (Desktop)` `44b1e7c226a04ed5aff5f16d48ca2625` | Inventory ref `SCREEN_53` | P0 | Implemented | Completion can save route history locally and link to history. |
| Share & Completion | `/routes/[slug]/complete` and share controls | `Share Route & Completion (Desktop)` `c14575512c6d43528d946755a09e96d5` | `Share Route & Completion (Mobile)` `2b868980b8864012af266948f1725111` | P1 | Partially implemented | Current share action is lightweight; advanced share-card generation remains deferred. |
| Accessibility Notes | Route/place detail notes | `Accessibility Route Notes (Desktop)` `abea2342aaf9400bade6427059b01209` | `Accessibility Route Notes (Mobile)` `90a586a62694423989b6610df9c2e620` | P1 | Implemented as route/place sections | Dedicated accessibility page is deferred; accessibility data appears on relevant detail pages. |
| Weather/Time Tips | Static route best-time fields | Inventory ref `SCREEN_66` | `Best Time to Walk (Mobile)` `04bb7dd25e344efcb941c185b47d431a` | P1 | Partially implemented | Real weather/time suggestions stay deferred behind no external API requirement. |
| Issue Reporting | `/report-issue` | Inventory ref `SCREEN_72` | Inventory ref `SCREEN_58` | P0 | Implemented | Public form validates published place/route context and uses mock/in-process queue plus browser fallback. |
| Saved Library | `/saved` | Inventory ref `SCREEN_64` | Inventory ref `SCREEN_20` | P0 | Implemented | Local-first saved places/routes with empty states. |
| History | `/history` | Inventory ref `SCREEN_46` | `History (Mobile)` `c62b560b7b0c493ba006ce8f960b9636` | P0 | Implemented | Local-first completed route history. |
| Settings | `/settings` | Inventory ref `SCREEN_33` | `Settings (Mobile)` `c11a2166108546fc86f0d0e4f8016a8f` | P0 | Implemented | Browser-local preferences control discovery and route ranking. |
| Explore Cities / More Cities | `/cities` | `More Cities Explorer (Desktop)` `1cbbbe619a074b048628bb2465a17aa3` | Inventory ref `SCREEN_76` | P1 | Implemented as constrained waitlist/info surface | Montreal remains the only active city. Quebec City, Toronto, Paris, and Rome can appear only as coming-soon content. |

## Internal And Gated Screens

| Stitch screen or group | App route/component | Source | Status | Boundary |
|---|---|---|---|---|
| Admin Dashboard / Route QA | `/admin/route-qa` | `Admin Route QA Dashboard` `22e714c50fe14a77b6ecc94d5c0dc1fc`; mobile `09634b3496b149b4a97aa5800a4edd9a` | Implemented, disabled by default | `app/admin/layout.tsx` returns not found unless `ENABLE_ADMIN_TOOLS=true`. |
| Admin content/issue tools | `/admin/content`, `/admin/issues` | Stitch admin group | Implemented, disabled by default | Same admin layout gate. No public nav exposure. |
| Dynamic Route Generation | Deferred | `Dynamic Route Generation` `79d12998557e47ab8cbafc157c6e2d66` | Gated/deferred | Real AI generation is out of scope. Local deterministic route ranking remains public. |
| Heritage & UNESCO Explorer | Deferred | `Heritage & UNESCO Explorer` `76f9fd6943db45cea08f107f8fbe6cc3`; mobile `712999d782f448f580a1682e1ef85579` | Gated/deferred | Advanced layer explorer is not part of public MVP. Heritage tags can appear as content metadata. |
| Offline Route Cards | Deferred | `Offline Route Cards (Desktop)` `447a6baf1bb34e969afa08d7e51a063e`; mobile `dd277ed5a3f042cfb980c9b218576d69` | Gated/deferred | Offline downloads are explicitly out of scope. |
| Route Export Workspace | Deferred | `Route Export Workspace (Desktop)` `d5be518a97144138b12cb48b4a78c75a`; mobile `1513a00e28fa48ccb974a0984846c6c6` | Gated/deferred | Export workspace is post-MVP. |

## Explicitly Excluded By Project Rules

These Stitch screens must not become public active product surfaces in the current MVP.

| Stitch screen or group | Source example | Reason |
|---|---|---|
| Premium City Packs and Pack Detail | `Premium City Packs (Desktop)` `a16695318a1042829817f35bb0c2bcc4`; mobile `85a27ff2ba294f3692ed44fdcd170650`; `Montreal Heritage Pack Detail` `a4fa4e5c4d474c1d99ded2fe28e1fd69` | Premium, payments, subscriptions, and monetized packs are out of scope. |
| Partner Dashboard / Portal | Inventory refs `SCREEN_9`, `SCREEN_78` | Partner dashboard workflows are out of scope. |
| Audio Stories | `Audio Stories - Old Montreal Historic Walk` `2ecc79f7fba94fce9543de037ec664e4` | Audio stories are out of scope. |
| Tickets & Tours | `Tickets & Tours - Old Montreal Loop (Mobile)` `e371c5aebbf643c59e04b06c9c50c015` | Ticket marketplace and affiliate booking are out of scope. |
| Road-trip Mode Planner | `Road-trip Mode Planner` `97d4801b451f48e1bd0a2491ca58de3e`; alternate `a3dbfd39983d48bca1fef90bc863a4d1`; mobile `926ed747bffc482786ed9a179ff16e13` | Road trip mode is out of scope. |
| Pilgrimage Planner | `Pilgrimage Planner - St. Lawrence Heritage Way` `fc132247bf3b4d23ae603b88d1bd905a` | Pilgrimage/long-distance mode is out of scope. |

## Implementation Notes

- The current app already uses the correct owning layers for the Stitch-backed MVP: `AppShell`, `PageContainer`, `SplitMapLayout`, `MapShell`, `PlaceCard`, `RouteCard`, local state helpers, and mock data providers.
- Public surfaces must continue to use published Montreal data from `lib/data/index.ts`.
- Feature screens without backend/data readiness should remain disabled, consolidated into existing routes, or documented as deferred.
- If a future design task changes a public route, update this inventory and `docs/design/stitch-component-map.md` in the same change.
