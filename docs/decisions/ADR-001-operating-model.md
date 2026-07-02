# ADR-001: Local-First App And GitHub-Backed Workflow

## Status

Accepted

## Date

2026-07-02

## Context

Meaningful Routes is a live Next.js app with an MVP in Montreal. The current app must boot without external services, keep `DATA_SOURCE=mock` as the default, preserve the visual MVP, and deploy completed implementation work to Unraid.

The repository also started with a large uncommitted baseline: app source, docs, local media, historical handoff material, generated logs, test artifacts, and cache folders. Without an explicit operating model, future work can mix unrelated changes, commit generated files, or lose a stable rollback point.

## Decision

Use a local-first application model and a GitHub-backed source-control workflow:

- Keep runtime boot independent from external APIs.
- Keep `DATA_SOURCE=mock` as the default until a provider migration is implemented and restore-tested.
- Use Git commits as local checkpoints.
- Use one branch per job.
- Use `https://github.com/Berky01/meaningful-routes` as the private GitHub backup/review repository.
- Push committed checkpoints with normal Git; `gh` is optional for pull requests and GitHub metadata work.
- Keep generated artifacts out of Git.
- Require validation before completion claims.
- Deploy completed implementation changes to Unraid, or report the exact blocker.

## Alternatives Considered

### Commit directly to one long-running branch without workflow docs

- Pros: Fast in the moment.
- Cons: Hard to review, hard to roll back, easy to mix unrelated work.
- Rejected because the app is live and needs small, traceable slices.

### Depend on external services for normal local development

- Pros: Closer to future production architecture.
- Cons: Slower boot, more secrets, more failure modes, worse noob/operator experience.
- Rejected because current project rules require mock fallback and no API-key requirement for local boot.

### Keep all generated outputs in Git

- Pros: Keeps every local audit artifact in one place.
- Cons: Bloats history with logs, archives, caches, screenshots, and run output.
- Rejected because curated findings belong in docs and raw artifacts can remain local.

## Consequences

- New contributors and agents have a clear start path.
- Baseline commits stay readable.
- GitHub setup is explicit instead of guessed: `origin` should point to `https://github.com/Berky01/meaningful-routes.git`.
- Mixed worktrees require explicit-path staging, not blanket `git add .`.
- Live deployment remains tied to implementation changes.
- Archived handoff docs remain useful context without overriding current project scope.
