# Project Workflow

Updated: 2026-07-02

This is the practical operating model for evolving Meaningful Routes safely.

## ELI5 Git Model

- A commit is a save point.
- A branch is a separate timeline.
- GitHub is the cloud backup and review place.
- A push uploads local save points to GitHub.
- A pull request is a review page for merging one branch into another.

Use Git locally for every meaningful checkpoint. Use GitHub whenever work is worth keeping or sharing.

## Branch Model

Keep `main` stable and live-ready.

Use one branch per job:

```txt
codex/phase-2a-live-app
codex/discovery-search
codex/media-validation
codex/unraid-deploy-fix
codex/docs-workflow
```

Do not mix unrelated jobs in one branch. If the task changes direction, commit or shelve the current work first.

## Daily Work Loop

```powershell
git status --short --branch
npm run lint
npm run typecheck
npm run validate:data
npm run validate:routes
npm run validate:media
npm run build
git add .
git commit -m "Short description of completed change"
git push
```

Use narrower validation while iterating, then the full sequence before claiming implementation work is complete.

## First Baseline Commit

If the repository has no commits yet:

1. Check `.gitignore` before staging.
2. Confirm real secrets are ignored.
3. Run the final validation sequence.
4. Commit the current source as the baseline.
5. Add a GitHub remote only when the correct private repo URL is known.
6. Push the baseline branch.

Do not push `output/`, caches, local test artifacts, `.env`, or generated logs.

## Commit Rules

Good commits are small and reversible:

```txt
Add media attribution validation
Fix route geometry stop coverage
Document GitHub workflow
Update Unraid deployment checklist
```

Avoid vague commits:

```txt
updates
stuff
fix
changes
```

Commit after a coherent slice works, not after every tiny edit.

## GitHub Policy

Use GitHub for:

- private remote backup
- branch pushes
- pull requests
- review history
- release traceability

Do not depend on GitHub for local boot. The app must still build and run from the local checkout with `DATA_SOURCE=mock`.

If `git remote -v` is empty, the next step is to create or identify the private GitHub repo and run:

```powershell
git remote add origin <repo-url>
git push -u origin <branch-name>
```

Do not invent a remote URL.

## Validation Policy

For code/data/media changes, run:

```powershell
npm run lint
npm run typecheck
npm run validate:data
npm run validate:routes
npm run validate:media
npm run build
```

For focused data validator changes, this narrower sequence is acceptable during iteration:

```powershell
npm test -- lib/data/validators.test.ts
npm run validate:data
npm run typecheck
```

Report exact blockers when validation cannot run.

## Deployment Policy

Completed implementation work must be deployed to Unraid so `https://routeapp.plexplease.xyz/` reflects the completed app.

Docs-only or workflow-only commits do not require a live app redeploy because they do not change the running app. Code, data, media, build, or runtime configuration changes do.

If deployment is blocked by missing Docker, SSH, Cloudflare, Unraid, or environment access, stop and report the blocker clearly.

## Documentation Policy

Update Markdown with the change when behavior changes. Prefer the active docs:

- `README.md`
- `AGENTS.md`
- `docs/README.md`
- `docs/WORKFLOW.md`
- `docs/DEPLOYMENT.md`
- `docs/UNRAID_DEPLOYMENT.md`
- `ARCHITECTURE.md`
- `DATA_MODEL.md`
- `FEATURE_MATRIX.md`
- `ROADMAP.md`

Treat `meaningful_routes_codex_handoff/` as archived planning context unless the task specifically asks to update the handoff package.
