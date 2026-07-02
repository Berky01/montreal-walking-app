# Meaningful Routes Mockup Analysis And Stitch Prompts

## Source Evidence

- Stitch project: `7741303272075430847`
- Project title: `Meaningful Routes Web Platform`
- Design system: `assets/7afda6fefe6b4e6baeab8ab7fa4ea0b6`
- Local screenshots: `meaningful_routes_codex_handoff/qa/mockup_audit/`

## Existing Mockup Coverage

The Stitch project already covers the core discovery loop well:

- Desktop and mobile Home / Around Me
- Desktop and mobile route results
- Desktop route detail
- Desktop route comparison
- Desktop map explorer
- Mobile live route
- Mobile completion
- Desktop saved library
- A design system tuned for route-first, outdoor-readable webapp UI

## Main Strengths

- The desktop split-map pattern is a strong fit for the webapp-first direction.
- Route detail includes confidence-building sections: route summary, stops, map, why this route, know before you go, and start/save actions.
- Mobile live route has a clear next-action hierarchy and avoids looking like a generic fitness tracker.
- The visual system is restrained, readable, and close to the project brief.

## Main Gaps Against P0

- Several screens still skew toward monuments/heritage objects instead of broad route discovery.
- Route cards need stronger save states, start area, loop/one-way, pace/difficulty, and route-type differentiation.
- Comparison needs more decision rows: best for, start distance, loop/one-way, scenery, history/culture, cafe/food density, and crowd/quiet signals.
- Active walk needs the full metric set: elapsed time, completed distance, remaining distance, progress percent, visited stops, next stop, pause/resume, and distinct end flow.
- Completion needs actual session metrics labeled clearly before planned estimates, plus completion percentage and route tags.
- Missing or underrepresented surfaces: History, Settings, route issue reporting, location denied, loading, empty, error, save error, and browser-restart persistence states.
- Mobile web is missing route detail, map/stops, and next-stop preview as a coherent browser-phone flow.

## Stitch Screens Generated

1. `MVP Missing Surfaces`
   - Screen ID: `9136bee5797e421b9f57d00d5ea7a880`
   - Purpose: Desktop History, Settings, route issue feedback, and state patterns.
   - Local screenshot: `12-generated-mvp-missing-surfaces.png`

2. `Route Detail + Live Walk Completeness (Mobile)`
   - Screen ID: `0f1f2a673ad74c27b5561a1a05512c1e`
   - Purpose: Mobile route detail, map/stops, next stop preview, active walk, completion, and persistence/error mini-states.
   - Note: Stitch returned the screen record, but did not return a screenshot download URL for this very tall mobile flow board.

## Follow-Up Stitch Prompts To Consider

### Route Cards And Comparison Refinement

Edit the route results and comparison screens to make route choice clearer and to match the MVP acceptance criteria.

**Prompt:**

Update the desktop and mobile route results plus route comparison screens for Meaningful Routes. Keep the existing design system and layout direction.

For route cards, add visible save state, start area, loop/one-way, route type, pace/difficulty, stop count, estimated time, distance, and 2-3 meaningful tags. Make each route feel clearly different from the others.

For route comparison, add rows for start distance from user, loop/one-way, best-for label, scenery score, history/culture density, cafe/food density, and quiet/crowd level. Ensure labels are derived from the visible metrics and do not contradict distance, duration, elevation, or difficulty.

Keep the MVP Montreal-only. Do not add global coverage, social features, public reviews, subscriptions, road-trip planning, or UNESCO ingestion.

### Discovery State Variants

Generate or edit a state-pattern screen for discovery states.

**Prompt:**

Create compact discovery state variants for the Meaningful Routes webapp. Include location permission unknown, location denied, loading nearby routes, no routes matching filters, route data error with retry, save in progress, saved, unsaved, and save error. Use realistic Montreal route copy and keep the UI route-first.
