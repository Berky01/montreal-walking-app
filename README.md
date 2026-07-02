# Meaningful Routes

Meaningful Routes is a live Next.js web app for walking-based city discovery. The current MVP city is Montreal, and the public live target is `https://routeapp.plexplease.xyz/`.

The app is intentionally local-first for the current phase: `DATA_SOURCE=mock` is the default, runtime pages do not require external APIs, and user state such as saved routes, walk history, preferences, compare baskets, and issue reports stays in browser storage.

## Quick Start

```powershell
npm install
npm run dev
```

Open the local Next.js URL printed by the dev server.

## Core Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the local app |
| `npm run lint` | Run ESLint with zero warnings |
| `npm run typecheck` | Run TypeScript checks |
| `npm run validate:data` | Validate catalog/data shape |
| `npm run validate:routes` | Validate route geometry and stop coverage |
| `npm run validate:media` | Validate local media, licensing, and attribution metadata |
| `npm run sync:pois` | Dry-run the configured Montreal POI sync/review cache |
| `npm run sync:routes` | Dry-run the generated Montreal route sync/review cache |
| `npm run build` | Build the production Next.js app |
| `npm test` | Run Vitest tests |
| `npm run test:smoke` | Run the Playwright smoke test |

## Final Validation Before Code Completion

Run the full sequence before claiming implementation work is complete:

```powershell
npm run lint
npm run typecheck
npm run validate:data
npm run validate:routes
npm run validate:media
npm run build
```

Docs-only changes can use a narrower check, but code/data/media changes need the full sequence unless the exact blocker is reported.

## Project Rules

- Follow `AGENTS.md` first.
- Preserve the current visual MVP unless a redesign is explicitly requested.
- Keep `DATA_SOURCE=mock` as the default.
- Keep mock/JSON fallback mode working.
- Keep external services behind adapters.
- Never require API keys for local boot.
- Never commit real credentials.
- Never hotlink unlicensed images.
- Deploy completed implementation work to Unraid so the live URL reflects the completed app, or report the exact deployment blocker.

## Documentation Map

- `AGENTS.md`: binding project instructions for agents.
- `docs/README.md`: active documentation index and source-of-truth guide.
- `docs/WORKFLOW.md`: Git, GitHub, branch, commit, validation, and release workflow.
- `docs/DEPLOYMENT.md` and `docs/UNRAID_DEPLOYMENT.md`: live deployment procedures.
- `ARCHITECTURE.md`, `DATA_MODEL.md`, `FEATURE_MATRIX.md`, `ROADMAP.md`: current top-level product and system summaries.
- `meaningful_routes_codex_handoff/`: historical handoff package; useful context, not the active implementation plan.

## Safe Work Rhythm

1. Start from a clean branch or commit.
2. Do one job per branch.
3. Keep edits in the smallest owning layer.
4. Validate with the narrowest command that proves the change.
5. Commit a meaningful checkpoint.
6. Push to GitHub when a remote is configured and the checkpoint is worth keeping.
7. Deploy completed implementation work to Unraid.

## GitHub Remote

The private GitHub repo is:

```txt
https://github.com/Berky01/meaningful-routes
```

Expected local remote:

```powershell
git remote -v
# origin  https://github.com/Berky01/meaningful-routes.git (fetch)
# origin  https://github.com/Berky01/meaningful-routes.git (push)
```

If `origin` is missing, add it:

```powershell
git remote add origin https://github.com/Berky01/meaningful-routes.git
```

Push committed work with normal Git:

```powershell
git push -u origin $(git branch --show-current)
```

`gh` login is useful for pull requests, but it is not required for a basic `git push` when Git Credential Manager already has a GitHub credential.
