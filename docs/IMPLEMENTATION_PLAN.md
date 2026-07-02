# Implementation Plan

Updated: 2026-07-02

This is the active implementation plan for the live app. The original P0A/P0B scaffold plan has been completed and is now historical context. Use `docs/README.md` to identify current source-of-truth docs before starting new work.

## Current Baseline

- Next.js App Router app with TypeScript, Tailwind, React 19, and standalone Docker output.
- Montreal is the first MVP city.
- `DATA_SOURCE=mock` remains the default.
- The app includes the public landing page, `/app`, search, routes, route comparison, route detail/live/complete, places, place detail, saved library, history, settings, report issue, and read-only admin QA surfaces.
- Data includes 12 Montreal routes, 60 Montreal places, local media assets, media attribution metadata, route geometry, validation scripts, and browser-local user state.
- Runtime map rendering uses MapLibre when `NEXT_PUBLIC_MAP_STYLE_URL` is configured and local fallback behavior when it is blank or unavailable.

## Next Safe Slices

1. Repository baseline and GitHub setup
   - Keep generated artifacts out of Git.
   - Commit a verified local baseline.
   - Add a private GitHub remote only when the correct `owner/repo` or remote URL is known.

2. Discovery-first positioning pass
   - Reframe first-screen copy around Montreal discovery rather than walk tracking.
   - Make places, neighborhoods, and themes more prominent before active-walk state.
   - Keep the current visual MVP structure; do not redesign from scratch.

3. Unified discovery search
   - Search places, neighborhoods, tags, and routes together.
   - Preserve deterministic parsing and no external AI dependency.
   - Add tests for exact place-name queries such as Saint Joseph's Oratory.

4. Public metadata cleanup
   - Hide editorial status, source quality, and internal rationale from public pages.
   - Keep QA metadata available in admin/readiness surfaces.

5. Media and content hardening
   - Diversify repeated hero/card imagery where approved local media exists.
   - Enrich the top Montreal places with visitor-facing story, dates, people, communities, and what-to-notice details.
   - Keep `npm run validate:media` as the gate for production media.

6. Deployment hardening
   - Keep Unraid deployment docs current.
   - Verify `/api/health` and public live URL after implementation deploys.
   - Report Cloudflare, SSH, Docker, or Unraid blockers explicitly.

## Slice Rules

- One job per branch.
- Inspect owning files before changing behavior.
- Keep edits in the smallest owning layer.
- Update relevant Markdown in the same change.
- Run the narrowest useful check while iterating.
- Run the full final validation sequence before claiming code/data/media completion.
- Deploy completed implementation work to Unraid or report the blocker.

## Intentionally Out Of Scope

- Real auth.
- Payments or subscriptions.
- Real AI generation.
- Road-trip mode.
- Pilgrimage mode.
- Audio stories.
- Ticket marketplace.
- Partner dashboard or partner analytics.
- Offline downloads.
- Runtime dependency on external APIs for local boot.

## Quality Bar

- User-facing copy stays Montreal-specific.
- Product name is Meaningful Routes everywhere.
- Data and route ranking are deterministic and transparent.
- Important route/place details exist in text, not only in map visuals.
- UI uses semantic HTML and keyboard-accessible controls.
- Components remain small and typed.
- Verification failures are fixed or reported with exact commands and output summary.
