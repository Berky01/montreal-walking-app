# MVP Acceptance Checklist

## Product scope

- [ ] All user-facing copy says Montreal MVP or only shows Montreal routes.
- [ ] App positioning is broad discovery, not UNESCO-only, planner-only, or fitness-only.
- [ ] No social/dating/global features leak into MVP UI.

## Explore / Around Me

- [ ] Home loads with Montreal routes.
- [ ] Location permission denied state is useful.
- [ ] Search/filter states do not break layout.
- [ ] Route cards show meaningful differences.

## Filters

- [ ] Time filter changes results.
- [ ] Distance filter changes results.
- [ ] Interest filters change results.
- [ ] Reset works.
- [ ] Empty result state suggests alternatives.

## Route cards

- [ ] Each card shows title, distance, duration, stops, tags, start area.
- [ ] Save icon state is visible.
- [ ] No vague or contradictory labels.

## Route comparison

- [ ] Comparison data is sourced from actual route metrics.
- [ ] “Easiest,” “shortest,” “most scenic,” and other labels are explainable.
- [ ] Longer/steeper route is not labeled easier without a clear reason.

## Map

- [ ] Web map is nonblank in supported desktop and mobile browsers.
- [ ] Route line fits screen bounds.
- [ ] Stops are visible and ordered.
- [ ] Map handles missing geometry gracefully.

## Route detail

- [ ] Save button works and state is visible.
- [ ] Start route opens Active Walk.
- [ ] Stops list is readable.
- [ ] Practical notes are shown.

## Active Walk

- [ ] Active walk shows map, route, user position, elapsed, progress, next stop.
- [ ] Pause and End controls are safe-area aware.
- [ ] Controls never overlap CTAs, fixed navigation, or mobile browser viewport controls.
- [ ] Progress updates while session is active.
- [ ] End walk opens Completion.

## Completion

- [ ] Actual elapsed time is shown before planned time.
- [ ] Actual distance is shown before planned distance.
- [ ] Stops visited count is shown.
- [ ] Save to History works.
- [ ] Similar routes CTA is available.

## Saved and History

- [ ] Saved routes persist across browser restart.
- [ ] History persists completed route sessions.
- [ ] Cards include enough context to distinguish routes.

## Settings

- [ ] Units are formatted correctly.
- [ ] Disabled controls clearly belong to their toggles.
- [ ] Permission state is clear.

## QA evidence

- [ ] Typecheck passes.
- [ ] Unit tests pass.
- [ ] Build passes.
- [ ] API readiness check passes if API used.
- [ ] Desktop browser screenshots captured for key screens.
- [ ] Mobile viewport browser screenshots captured for key screens.
