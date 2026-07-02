# P0-007 — Route Detail and Map

## Goal

Route detail should build confidence and the web map preview must work.

## Tasks

- Implement route detail sections: metrics, tags, description, good for, know before you go, stops.
- Fix/verify `RouteMapWeb` so route line is nonblank.
- Fit route bounds.
- Show numbered stops.
- Add start route CTA.

## Acceptance

- Browser map preview is nonblank at desktop and mobile widths.
- Full route geometry fits viewport.
- Stops are visible and ordered.
- Missing geometry shows a useful fallback.
