# Project Instructions

This is the live Meaningful Routes Next.js app. Preserve the existing visual MVP and improve the backing system in small, verifiable slices.

## Scope

- Follow project-local instructions before global defaults.
- Meaningful Routes is a web-first walking discovery app.
- Montreal is the first MVP city.
- After implementation, always deploy the app live on Unraid so `https://routeapp.plexplease.xyz/` reflects the completed work.
- If live Unraid deployment is blocked by missing Docker/remote access/environment tools, stop and report the blocker clearly; do not claim completion without a live deployment or an explicit blocker.
- Keep `DATA_SOURCE=mock` as the default.
- Preserve the current visual MVP unless explicitly asked to redesign.
- Build data, map, and content systems behind the UI.
- Keep mock/JSON fallback mode working.
- Keep external service calls behind adapters and never require external APIs for local boot.
- Do not add premium, payments, subscriptions, real auth, real AI generation, road trip mode, pilgrimage mode, audio stories, ticket marketplace, partner dashboard, or offline downloads.
- Do not restart from Stitch exports or replace the current UI with a visual-only scaffold.

## Code Rules

- Use PowerShell on Windows.
- Prefer `rg` / `rg --files` for search.
- Inspect owning files before changing behavior.
- Keep edits scoped to the smallest owning layer.
- Do not revert user changes unless explicitly asked.
- Do not print secrets or commit real credentials.
- Never hotlink images without license and attribution metadata.

## Repository Workflow

- Use one branch per coherent job.
- Commit small verified checkpoints with descriptive messages.
- Keep generated artifacts out of Git: `output/`, `.playwright-cli/`, `.npm-restore/`, `test-results/`, logs, build output, and local env files.
- Use GitHub as the private remote backup/review system when the correct remote URL is configured.
- If `git remote -v` is empty, do not invent a remote; report that the repo needs a private GitHub remote URL before pushing.
- Treat docs-only changes as not requiring live app deployment. Code, data, media, runtime config, build, or UI changes do require the Unraid deploy rule above.

## Documentation

- Keep `README.md`, `docs/README.md`, and `docs/WORKFLOW.md` current when project workflow changes.
- Update architecture, data, feature, roadmap, deployment, or media docs in the same change when behavior changes.
- Treat `meaningful_routes_codex_handoff/` and `.stitch/` as historical/reference material unless explicitly asked to edit them.
- Do not let archived handoff ideas override the current scope and non-goals above.

## Validation

Use the narrowest check that proves the change. For Phase 2A foundation work, prefer:

```powershell
npm test -- lib/data/validators.test.ts
npm run validate:data
npm run typecheck
npm run lint
npm run build
```

Run the full final sequence before claiming completion when code changed:

```powershell
npm run lint
npm run typecheck
npm run validate:data
npm run validate:routes
npm run validate:media
npm run build
```
