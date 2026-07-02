# Stitch Audit

## Source Materials

- Active private Stitch project: `https://stitch.withgoogle.com/projects/7741303272075430847`
- Active Stitch intake docs:
  - `docs/design/stitch-screen-inventory.md`
  - `docs/design/stitch-component-map.md`
  - `docs/design/stitch-style-lock.md`
- `C:\Users\valen\Downloads\stitch_meaningful_routes_web_platform.zip`
- `stitch_meaningful_routes_web_platform/meaningful_routes/DESIGN.md`
- `stitch_meaningful_routes_web_platform/meaningful_routes_reorganized_inventory.md`
- `.stitch/designs/` extracted reference assets
- `meaningful_routes_codex_handoff/` product handoff package
- `C:\Users\valen\Downloads\FULL_PROJECT_ANALYSIS.md`

The Stitch zip is a static visual export. The private Stitch project is the current visual reference. Both have standalone generated HTML/screens, but neither is a runnable production app scaffold with TypeScript source, reusable React components, backend, package manifest, routing layer, or stable map implementation.

Use the active `docs/design/` intake docs for current implementation mapping. Keep this audit as supporting historical context.

## Screen Inventory And Grouping

### P0A - Build In This Run

These screens define the first Montreal web MVP user journey and are canonical visual references.

| Screen folder | Canonical use |
|---|---|
| `landing_page_desktop` | Landing page desktop reference |
| `landing_page_mobile` | Landing page mobile reference |
| `meaningful_routes_app_flow` | Product flow reference, not a page |
| `app_home_desktop` | `/app` desktop around-me reference |
| `app_home_mobile` | `/app` mobile around-me reference |
| `natural_language_search_desktop` | `/search` desktop reference |
| `natural_language_search_mobile` | `/search` mobile reference |
| `route_results_desktop` | `/routes` desktop list and map reference |
| `route_results_mobile` | `/routes` mobile list-first reference |
| `route_detail_desktop` | `/routes/[slug]` desktop reference |
| `route_detail_mobile` | `/routes/[slug]` mobile reference |
| `live_route_desktop_1` | `/routes/[slug]/live` canonical desktop reference |
| `live_route_desktop_2` | Live route alternate reference, consolidate into `live_route_desktop_1` |
| `live_route_mobile` | `/routes/[slug]/live` mobile reference |
| `route_completed_desktop` | `/routes/[slug]/complete` desktop reference |
| `route_completed_mobile` | `/routes/[slug]/complete` mobile reference |
| `discover_monuments_desktop` | `/places` desktop reference |
| `discover_monuments_mobile` | `/places` mobile reference, replace placeholder data |
| `monument_list_filters_desktop` | Places filter reference |
| `monument_list_filters_mobile` | Mobile places filter reference |
| `monument_detail_desktop` | `/places/[slug]` desktop reference |
| `monument_detail_mobile` | `/places/[slug]` mobile reference |

### P0B - Build After P0A Compiles

These belong in the MVP, but should follow the core browse-search-detail-live-complete journey.

| Screen folder | Planned use |
|---|---|
| `saved_library_desktop` | `/saved` desktop |
| `saved_library_mobile` | `/saved` mobile |
| `history_desktop` | `/history` desktop, low screenshot confidence |
| `history_mobile` | `/history` mobile canonical reference |
| `settings_desktop` | `/settings` desktop |
| `settings_mobile` | `/settings` mobile |
| `route_issue_report_desktop` | `/report-issue` desktop |
| `route_issue_report_mobile` | `/report-issue` mobile |
| `route_comparison_desktop` | Compare mode or future `/routes/compare` |
| `route_comparison_mobile` | Mobile compare reference |
| `next_stop_preview_desktop` | Fold into live route mode |
| `next_stop_preview_mobile` | Fold into live route mode |

### Admin/Internal

These are internal tools, not user-side discovery pages.

| Screen folder | Planned use |
|---|---|
| `admin_route_qa_dashboard` | `/admin/route-qa`, after P0A/P0B user flow |
| `admin_route_qa_dashboard_mobile` | Responsive QA dashboard reference |

### P1 - Strong V1 After MVP

These are useful after the Montreal MVP proves the user-side journey.

| Screen folder | Notes |
|---|---|
| `public_route_page_desktop` | SEO/public variant; consolidate with route detail first |
| `public_route_page_mobile` | SEO/public variant; consolidate with route detail first |
| `public_place_page_place_d_armes_desktop` | SEO/public variant; consolidate with place detail first |
| `place_d_armes_public_page_mobile` | SEO/public variant; consolidate with place detail first |
| `neighborhood_page_desktop` | City/neighborhood SEO content |
| `neighborhood_page_mobile` | City/neighborhood SEO content |
| `accessibility_route_notes_desktop` | Full accessibility page; P0 uses route detail notes |
| `accessibility_route_notes_mobile` | Full accessibility page; P0 uses route detail notes |
| `best_time_to_walk_mobile` | Dynamic timing concept; P0 can show static best-time notes |
| `weather_time_suggestions_desktop` | Requires real weather/time context later |
| `share_route_completion_desktop` | Advanced sharing; P0 keeps simple share CTA |
| `share_route_completion_mobile` | Advanced sharing; P0 keeps simple share CTA |
| `map_explorer_desktop` | Map control patterns only |
| `map_explorer_mobile` | Mobile map control patterns only |

### P2 - Document Only

These screens are outside the first app implementation and should not become routes now.

| Screen folder | Reason excluded |
|---|---|
| `audio_stories_mobile` | Audio stories are post-MVP |
| `audio_stories_old_montreal_historic_walk` | Audio stories are post-MVP |
| `build_route_mobile` | Custom route building depends on route generation |
| `dynamic_route_generation` | Real AI/dynamic routing is post-MVP |
| `explore_cities_mobile` | Multi-city conflicts with Montreal-only MVP |
| `heritage_unesco_explorer` | Advanced heritage layer explorer |
| `heritage_unesco_layers_mobile` | Advanced heritage layer explorer |
| `long_distance_pilgrimage_mode_mobile_1` | Long-distance mode is post-MVP |
| `long_distance_pilgrimage_mode_mobile_2` | Low-confidence long-distance concept |
| `more_cities_explorer_desktop` | Multi-city expansion |
| `offline_route_cards_desktop` | Offline downloads are post-MVP |
| `offline_route_cards_mobile` | Offline downloads are post-MVP |
| `partner_dashboard_guest_route_kits` | B2B partner workflow |
| `partner_portal_guest_route_kits` | B2B partner workflow |
| `pilgrimage_planner_st._lawrence_heritage_way` | Long-distance planning |
| `premium_city_packs_desktop` | Monetization |
| `premium_city_packs_mobile` | Monetization |
| `montreal_heritage_pack_detail` | Premium pack detail |
| `montreal_heritage_pack_detail_mobile` | Premium pack detail |
| `road_trip_mode_planner_1` | Road-trip mode |
| `road_trip_mode_planner_2` | Road-trip mode alternate |
| `road_trip_mode_planner_mobile` | Road-trip mode |
| `route_export_mobile` | PDF/GPX export is post-MVP |
| `route_export_workspace_desktop` | PDF/GPX export workspace |
| `tickets_tours_mobile` | Marketplace/affiliate booking |
| `tickets_tours_old_montreal_loop` | Marketplace/affiliate booking |
| `tickets_tours_old_montreal_loop_mobile` | Marketplace/affiliate booking |

### Spec/Reference

These are documentation-like screens and should inform scope, not become pages.

| Screen folder | Use |
|---|---|
| `complete_p0_feature_inventory_desktop` | P0 scope reference |
| `complete_p0_feature_inventory_mobile` | P0 scope reference |
| `mvp_missing_surfaces` | Missing-state reference |
| `post_mvp_feature_inventory_desktop` | Roadmap reference |
| `post_mvp_feature_inventory_mobile` | Roadmap reference |

## Duplicate And Canonical Screens

- Landing: `landing_page_desktop` and `landing_page_mobile` are one route, `/`.
- App home: `app_home_desktop` and `app_home_mobile` are one route, `/app`.
- Search: `natural_language_search_desktop` and `natural_language_search_mobile` are one route, `/search`.
- Route results: `route_results_desktop` is canonical; `route_results_mobile` is layout reference only.
- Route detail: `route_detail_desktop` and `route_detail_mobile` are one dynamic route, `/routes/[slug]`.
- Live route: `live_route_desktop_1` is canonical; `live_route_desktop_2` and `live_route_mobile` inform responsive variants.
- Completion: `route_completed_desktop` and `route_completed_mobile` are one dynamic route, `/routes/[slug]/complete`.
- Places: `discover_monuments_*` and `monument_list_filters_*` merge into `/places`.
- Place detail: `monument_detail_*` and public place screens merge into `/places/[slug]`.
- Route comparison: desktop and mobile screens become a compare mode later, not separate first-pass pages.
- Next stop preview: fold into live route mode later instead of a standalone page.

## Naming Drift

Normalize all product UI to **Meaningful Routes**. Treat these names as export drift:

- `Pathfinder`
- `HeritageQuest`
- `PartnerPortal`
- `RouteAdmin`

Internal/admin copy can describe route QA, but the product brand stays Meaningful Routes.

## Non-Montreal Or Generic Placeholder Data

Replace these with Montreal-specific data in implementation:

- Colosseum
- Pantheon
- Whispering Woods Trail
- Eagle's Peak Summit
- Old Town Historic Walk
- The Grand Arch
- generic "Old Town" references
- generic multi-city placeholders
- Rome/UNESCO/road-trip/pilgrimage content unless documented as future roadmap

## Visual Source Of Truth

`meaningful_routes/DESIGN.md` is stronger than individual exported Tailwind configs.

Core tokens to preserve:

- Forest green primary: `#154212`
- Off-white background: `#fbf8ff`
- White card surfaces: `#ffffff`
- Tonal surface layers: `#f4f2fd`, `#eeedf7`, `#e8e7f1`, `#e3e1ec`
- Inter typography
- 4px spacing rhythm
- 16px mobile page margin and 48px desktop page margin
- 16px card radius, 8px button/input radius
- subtle shadows for cards and floating map controls

## Missing MVP States

The implementation needs states not consistently represented in the Stitch screens:

- Empty route results after filtering/search.
- Empty places results after filtering.
- Unknown, denied, and unavailable location permission states.
- Missing map geometry or unavailable map provider fallback.
- Saved, unsaved, saving, and save error states.
- Active walk paused state.
- Active walk end confirmation.
- Completion/history persistence fallback for localStorage failures.
- Route not found and place not found pages.
- Search interpretation when the query is empty or unclear.
- Filters reset state.
- Form validation for issue reporting.
- Admin queue empty state and QA status state.

## Implementation Rule

Do not translate every `code.html` file into a route. Build one coherent component system and implement the P0A pages first with Montreal mock data, local state where needed, and a replaceable `MapShell`.
