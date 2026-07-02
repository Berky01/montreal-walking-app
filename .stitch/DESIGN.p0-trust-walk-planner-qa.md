# P0 Trust, Walk, Planner, QA Prototype

Updated: 2026-07-02

## Scope

This design pass extends the Stitch project with a scope-reconciled P0 prototype set for richer historical trust, live walk clarity, journal completion, planning workspace patterns, and admin source QA.

Project-local `AGENTS.md` remains the boundary for production work. The following requested concepts are documented as deferred/mock-only and must not become active public MVP surfaces without a separate scope decision:

- Offline city pack downloads
- Partner/creator dashboards
- Audio stories
- Ticket/tour marketplace behavior
- Premium packs, payments, or subscriptions
- Health/device integrations beyond phone GPS and estimated steps

## Stitch Screens

Project: `Meaningful Routes Web Platform`
Project id: `7741303272075430847`
Design system: `assets/7afda6fefe6b4e6baeab8ab7fa4ea0b6`

New generated screens:

| Screen | Stitch id | Purpose |
|---|---|---|
| P0 Trust, Walk, Planner, QA - Desktop | `568a02d02bf74fdbb3b624b84880064e` | Desktop design board for rich POI trust, live walk, journal, planner, admin QA, and deferred boundary cards. |
| Mobile Prototype Board Header & Flow Map | `ba989cdc5c914fc69d74f37bf3eff324` | Mobile flow-map header and prototype transition overview. |
| Deferred MVP Boundaries (Mobile) | `0eb0fc6e4d824b069a30b5ab6173788f` | Mobile deferred-feature boundary cards. |
| Mobile Component Notes Strip | `355efd66b089441fa1720b6effb6f9a7` | Mobile reusable component inventory and deferred component markers. |

Stitch also generated additional mobile frames in the same session for POI trust, source drawer, then/now, start/live walk, next stop, completion, journal, planner, export, and admin fallback. The MCP response truncated several generated IDs; use Stitch session `7665574538289893934` or the project screen list to inspect the full generated set.

## Local Exports

Downloaded local files:

| Artifact | Notes |
|---|---|
| `.stitch/designs/p0-prototype-index.html` | Local clickable index for the requested prototype connections across generated/new and existing Stitch exports. |
| `.stitch/designs/p0-trust-walk-planner-qa-desktop.html` | Local desktop HTML export. Remote generated media hotlinks were replaced with approved local media. |
| `.stitch/designs/p0-trust-walk-planner-qa-desktop.png` | Stitch screenshot preview. |
| `.stitch/designs/p0-mobile-flow-map.html` | Mobile flow map export. |
| `.stitch/designs/p0-mobile-flow-map.png` | Mobile flow map screenshot preview. |
| `.stitch/designs/p0-mobile-component-notes.html` | Mobile component notes export. Remote generated media hotlinks were replaced with CSS/local media. |
| `.stitch/designs/p0-mobile-component-notes.png` | Mobile component notes screenshot preview. |
| `.stitch/designs/p0-trust-walk-planner-qa-mobile.html` | Alias export for the mobile flow map. |

Media used locally:

- `../../public/media/places/notre-dame-basilica.jpg`
- `../../public/media/places/place-darmes.jpg`

Attribution rules follow `data/media/media-assets.json`; visible attribution is included in the local desktop artifact for Notre-Dame Basilica.

## Prototype Connections

The prototype transition map covers:

- POI page to source drawer
- POI page to then/now comparison
- Route detail to start walk
- Start walk to live walk
- Live walk to next stop
- Live walk to completion
- Completion to journal/share
- Planner to saved places to add to itinerary
- Planner to export/share
- Admin dashboard to source editor to issue report

Settings/devices and offline-pack transitions are represented only as deferred/mock-only boundary cards. They should not be connected to active public app navigation.

## Component Notes

Active component patterns:

- `SourceBadge`
- `VerificationBadge`
- `PlaceCard`
- `RouteCard`
- `Timeline`
- `MediaGallery`
- `ThenNowCompare`
- `LiveMetricRibbon`
- `RouteProgressBar`
- `JournalStatTile`
- `PlannerItineraryItem`
- `VoteButtonGroup`
- `AdminStatusChip`
- `IssueReportCard`

Deferred/mock-only components:

- `AudioStoryCard`
- `DeviceProviderCard`
- `OfflinePackCard`

## Implementation Notes

- Treat these as design/reference artifacts, not production app code.
- Do not copy generated Stitch HTML directly into `app/` or `components/`.
- Production implementation should reuse the owning layers listed in `docs/design/stitch-component-map.md`.
- Phone GPS and estimated steps can be shown as mock tracker sources; Apple Health, Health Connect, Strava, Garmin, Fitbit, Terra, and offline downloads remain deferred.
- Admin QA remains gated behind existing admin boundaries.
