# Design System Direction

## Product feel

Practical, calm, outdoor-readable, route-first.

The app should not feel like:

- a marketing landing page
- a generic dashboard
- a fitness leaderboard
- a glossy travel magazine
- a heavy trip-planning spreadsheet

## Visual principles

- Compact cards
- Large readable route metrics
- Clear CTAs
- Map-first where useful, list-first where faster
- Muted natural palette
- Strong contrast for outdoor use
- Minimal decorative effects
- No oversized hero blocks in operational screens
- Every badge/tag must mean something

## Suggested palette

Use as directional tokens, not strict final branding.

```json
{
  "background": "#F7F8F3",
  "surface": "#FFFFFF",
  "surfaceMuted": "#EEF2EA",
  "primary": "#137A3F",
  "primaryDark": "#0E4F2C",
  "accent": "#C78335",
  "text": "#172016",
  "textMuted": "#657064",
  "border": "#DDE5DA",
  "danger": "#C2413C",
  "warning": "#C88A1A"
}
```

## Typography

- Mobile-first type scale
- Route title: strong but compact
- Metrics: numeric clarity
- Stop notes: readable body text
- Avoid small low-contrast captions outdoors

## Component principles

### Route card

- Image thumbnail or map preview
- Title
- 2–3 metrics max in first line
- Tags below
- Save state visible
- Short “why this route” optional

### Primary CTA

Use for:

- Start Route
- Show Routes
- Save to History
- Download City Pack later

### Secondary CTA

Use for:

- Save
- Share
- View Details
- Report Issue

### Active walk controls

- Large touch targets
- Always safe-area aware
- Pause and End must be visually distinct
- Avoid accidental end action

## Accessibility

- Minimum 44x44pt tap targets
- Color cannot be the only state signal
- Support large text
- Screen-reader labels for map controls and buttons
- Strong focus order on web
- Route warnings written plainly
