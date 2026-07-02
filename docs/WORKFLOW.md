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

## Current Remote

The private GitHub repository is:

```txt
https://github.com/Berky01/meaningful-routes
```

Expected remote:

```powershell
git remote -v
# origin  https://github.com/Berky01/meaningful-routes.git (fetch)
# origin  https://github.com/Berky01/meaningful-routes.git (push)
```

If `origin` is missing:

```powershell
git remote add origin https://github.com/Berky01/meaningful-routes.git
```

If `origin` points somewhere else, stop and confirm before changing it.

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
git remote -v
npm run lint
npm run typecheck
npm run validate:data
npm run validate:routes
npm run validate:media
npm run build
git add <explicit files for this task>
git commit -m "Short description of completed change"
git push -u origin $(git branch --show-current)
```

Use narrower validation while iterating, then the full sequence before claiming implementation work is complete.

If the worktree contains unrelated changes, do not use `git add .` or `git add -A`. Stage only the files that belong to the current task.

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

If `git remote -v` is empty, add the known private repo:

```powershell
git remote add origin https://github.com/Berky01/meaningful-routes.git
git push -u origin <branch-name>
```

Do not invent a different remote URL.

`gh` is useful for pull requests, issue work, and repo metadata, but basic pushes should use normal Git. If `gh auth status` is not logged in but `git push` works through Git Credential Manager, proceed with `git push` and note that PR creation is the only blocked part.

If GitHub CLI is unavailable, install it with:

```powershell
winget install --id GitHub.cli -e --source winget --silent --accept-package-agreements --accept-source-agreements
```

If `gh` login is needed for PRs:

```powershell
gh auth login --hostname github.com --git-protocol https
```

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

Dry-run sync commands such as `npm run sync:pois` and `npm run sync:routes` are allowed during content work. Only use their `-- --write` mode when the generated cache is intentionally part of the review workflow.

Treat `meaningful_routes_codex_handoff/` as archived planning context unless the task specifically asks to update the handoff package.

## Session Start Checklist

Run this at the start of every coding or docs session:

```powershell
git status --short --branch
git remote -v
git branch -vv
```

Then decide:

- Clean worktree: create or continue the task branch.
- Mixed worktree: inspect diffs and stage explicit files only.
- Remote missing: add `origin` with the known private GitHub URL.
- Remote branch missing: push with `git push -u origin $(git branch --show-current)`.

Never revert, overwrite, or stage unrelated user/session changes unless explicitly asked.

## Session Finish Checklist

Before ending a completed task:

```powershell
git status --short --branch
git log --oneline --decorate --max-count=5
```

For docs-only changes, a commit and push is enough. For implementation changes, complete validation, commit, push, deploy to Unraid, and verify the live URL or report the exact deployment blocker.
