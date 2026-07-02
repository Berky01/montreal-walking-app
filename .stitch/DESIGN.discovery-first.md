---
name: Meaningful Routes Discovery First
colors:
  background: "#F7F8F3"
  surface: "#FFFFFF"
  surface-muted: "#EEF2EA"
  primary: "#137A3F"
  primary-dark: "#0E4F2C"
  accent: "#C78335"
  text: "#172016"
  text-muted: "#657064"
  border: "#DDE5DA"
  danger: "#C2413C"
  warning: "#C88A1A"
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: "700"
    lineHeight: 56px
  headline:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: "650"
    lineHeight: 40px
  title:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: "650"
    lineHeight: 30px
  body:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
  label:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: "650"
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  full: 9999px
spacing:
  base: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
---

# Brand and Product Direction

Meaningful Routes is a Montreal-first city discovery app. The design system should feel warm, editorial, trustworthy, practical outdoors, and map-led. Places are the primary discovery object; routes are curated ways to experience meaningful places.

The UI should not feel like a fitness tracker, generic tourism booking page, AI chatbot, heavy dashboard, or glossy marketing site. It should preserve the current MVP's compact cards, readable route metrics, clear CTAs, route timelines, place cards, cultural context, and mobile usability.

# Layout

Desktop screens use split map/list layouts where the map is useful, with dense but calm information panels. Public content screens prioritize a clear title, category/neighborhood metadata, why-it-matters copy, practical notes, trust/source notes, and obvious save/build-route actions.

Mobile screens use single-column flows, sticky action areas where appropriate, and bottom sheets over maps for discovery and live route mode. No control should require tiny tap targets.

# Components

Primary buttons are reserved for high-intent actions such as Explore places, Build a route, Start route, Save memory, and Submit report. Secondary actions cover save, share, add to route, preview discoveries, and report issue.

Place cards include image, alt-text expectation, category, neighborhood, estimated time needed, a short why-it-matters line, save, add-to-route, route inclusion hint, and trust indicator.

Route cards include theme, discovery count, total time, distance, map thumbnail, top included places, mood tags, start route, preview discoveries, save, weather fit, and accessibility hints.

Map panels always have a static fallback and a list alternative. Loading, unavailable, offline, and tile-failure states must be designed rather than blank.

# Accessibility

Use high contrast text, visible focus states, keyboard-friendly controls, clear labels, non-color-only status indicators, image alt-text expectations, map/list alternatives, and touch-friendly live route controls.

# Content Rules

Public MVP surfaces show Montreal as active. Coming-soon cities appear only on city expansion/waitlist screens: Quebec City, Toronto, Paris, and Rome.

Public report forms must be context-aware and must not expose draft, future, or placeholder content. Admin and QA screens may show draft, QA, ready to publish, published, and archived states.

# P0 Trust/Walk/Planner/QA Prototype Addendum

The 2026-07-02 P0 prototype extension is documented in `.stitch/DESIGN.p0-trust-walk-planner-qa.md`.

This addendum is a design/reference package only. It explores rich historical POI trust, source transparency, historical media, then/now comparison, live walk metrics, completion journal, planning workspace patterns, and admin source QA.

Deferred concepts from the broader design brief, including offline downloads, partner dashboards, audio stories, premium packs, tickets/tours, and health/device integrations, are marked mock-only and must not be promoted into public MVP surfaces without a separate scope decision.
