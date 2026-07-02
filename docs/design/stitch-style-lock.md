# Stitch Style Lock

Updated: 2026-07-02

## Source

- Stitch project: `Meaningful Routes Web Platform`
- Project URL: `https://stitch.withgoogle.com/projects/7741303272075430847`
- Style lock screen inspected: `00 Style Lock - Original Meaningful Routes`
- Local production token owner: `tailwind.config.ts` and `app/globals.css`

## Product Direction

Meaningful Routes is a Montreal-first city/place/monument/culture discovery app. The UI should feel warm, editorial, trustworthy, practical outdoors, and map-led. Places are the primary discovery object. Routes are curated ways to connect meaningful places.

The app must not drift into a fitness tracker, generic tourism booking site, glossy marketing page, AI trip planner, road-trip planner, pilgrimage planner, marketplace, or premium-pack storefront.

## Production Visual Tokens

The production app currently preserves the approved original-style green discovery MVP:

| Role | Production token | Value | Use |
|---|---|---:|---|
| Primary | `primary` | `#154212` | Primary CTAs, selected map route, key badges |
| Primary container | `primary-container` | `#2d5a27` | Primary hover and strong green surfaces |
| Background/surface | `background`, `surface` | `#f7f8f3` | Main page canvas |
| Card surface | `surface-container-lowest` | `#ffffff` | Cards, panels, inputs |
| Muted surfaces | `surface-container-low`, `surface-container`, `surface-container-high` | `#eef2ea`, `#e6ece4`, `#dde6da` | Tonal panels, map fallbacks, hover states |
| Text | `on-surface` | `#1a1b22` | Primary readable text |
| Muted text | `on-surface-variant` | `#42493e` | Metadata and secondary copy |
| Border | `outline-variant` | `#dde5da` | Card/input borders |
| Secondary | `secondary` | `#3f627e` | Secondary map/status accents |
| Tertiary | `tertiary` | `#5a2e00` | Warm accent/status color |
| Error | `error` | `#ba1a1a` | Destructive/error states |

If the Stitch project design metadata conflicts with these tokens, preserve the current production tokens unless the user explicitly asks for a redesign. This follows `AGENTS.md`: preserve the current visual MVP and improve the backing system in small slices.

## Typography

- Font family: Inter.
- Display: 48px / 56px / 700 for true hero contexts only.
- Headline: 32px / 40px / 600 for desktop page headers.
- Mobile/page headline: 24px / 32px / 600.
- Body: 16px / 24px for dense readable public content.
- Labels: 12-14px with medium/semibold weight for metadata, filters, and chips.
- Letter spacing should remain 0 in production CSS unless a token already defines otherwise.

## Shape And Elevation

- Cards: 16px radius via `rounded-card`, soft card shadow.
- Buttons and inputs: 8px radius via `rounded-control`.
- Chips: pill shape.
- Map panels: 16px radius with border and shadow, never a blank tile area.
- Use shadow only to clarify layers. Do not make shadow-heavy marketing cards.

## Layout Principles

- Mobile: single-column content, 16px page margins, map access through a bottom sheet or clear fallback.
- Desktop: split map/list layouts where map context matters.
- Public pages should be content-first and usable without an interactive map.
- Cards are for repeated items and framed tools, not for wrapping every page section.
- Do not place UI cards inside UI cards.

## Scope Boundaries From Style Lock

- Public MVP surfaces may show Montreal as active.
- Coming-soon cities may appear only on city expansion/waitlist pages.
- Admin and QA screens stay gated.
- Premium packs, tickets/tours, audio stories, road-trip mode, pilgrimage mode, partner dashboards, and offline downloads stay out of public MVP.
