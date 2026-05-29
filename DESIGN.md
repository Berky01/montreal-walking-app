# Walking App Design Context

## Design Direction

The interface should feel like a practical mobile route tool for people walking around Montreal: compact, readable outdoors, and explicit about state. Design serves the task; avoid promotional composition.

## Visual Principles

- Use restrained color with one primary route/action accent and clear semantic states.
- Keep cards simple: subtle borders, small radius, and no decorative shadows.
- Preserve stable layout dimensions for controls, route cards, map regions, and fixed footers.
- Use familiar mobile patterns for tabs, route lists, sticky actions, sheets, toggles, and segmented choices.
- Put primary actions where thumbs can reach them, with safe-area spacing.

## Information Hierarchy

- Explore: current location, goal, interests, and generate action.
- Compare: best fit, route tradeoffs, step/time fit, discoveries, and why a route differs.
- Detail: map/route preview, route summary, discoveries, primary start action, save state, secondary export actions.
- Active Walk: elapsed time, distance, steps, next move, route progress, live tracking status, pause/complete actions.
- Complete: actual session metrics first, then discoveries and feedback.
- Saved/History: dates, neighborhood anchors, route names, and human-readable saved/discovered actions.
- Settings: plain controls, formatted values, disabled states when dependent features are off.

## Component Rules

- Buttons: consistent shape, clear disabled/loading/pressed states, icons where useful.
- Chips: never clip selected choices; selected state should be visible without dominating the page.
- Fixed footers: always account for platform safe area and tab/gesture bars.
- Maps: blank map areas need a fallback state or smaller footprint until rendering is fixed.
- Empty states: explain what the user can do next without marketing copy.
- Errors: use direct user-facing messages and recoverable actions.

## Verification Expectations

- For UI edits, inspect the affected screen in browser or emulator when practical.
- Use existing visual evidence under `output/visual-audit/` and `output/mobile-emulator/` as a baseline.
- Do not claim a visual fix from code inspection alone when a screenshot or runtime check is available.
