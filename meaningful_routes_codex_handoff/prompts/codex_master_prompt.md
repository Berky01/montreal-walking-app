# Codex Master Prompt

You are working on a TypeScript responsive webapp for route discovery. The MVP targets desktop and mobile browsers first; native apps are later.

Read `CODEX_START_HERE.md` and the docs in `docs/` before editing code.

Product goal:

Build **Meaningful Routes**, a discovery webapp that helps users find and follow beautiful, interesting, and meaningful routes around them or wherever they travel.

MVP scope:

- Montreal only
- Route discovery
- Route comparison
- Route detail
- Save route
- Active walk
- Completion history
- Settings
- Route issue feedback

Do not implement global coverage, road trips, UNESCO ingestion, social, dating, or public UGC in MVP.

Implementation rules:

- Prefer shared domain logic over component-local math.
- Preserve existing architecture unless broken; if the workspace only contains this handoff, scaffold the smallest webapp architecture that supports the P0 tickets.
- Keep UX compact and outdoor-readable.
- Make states explicit: loading, empty, saving, saved, error.
- Active walk controls must be safe in desktop and mobile browser layouts.
- Completion must use actual session metrics before planned estimates.
- Run typecheck/tests/build after changes.

Start with ticket P0-001 unless a later ticket is explicitly requested.
