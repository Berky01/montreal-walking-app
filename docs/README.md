# Documentation Index

Updated: 2026-07-02

This folder contains the active engineering and operations docs for the live Meaningful Routes app. When docs conflict, use this priority order:

1. `AGENTS.md`
2. `README.md`
3. Current top-level docs: `ARCHITECTURE.md`, `DATA_MODEL.md`, `FEATURE_MATRIX.md`, `ROADMAP.md`
4. Current operational docs under `docs/`
5. Historical handoff and Stitch references

## Active Operating Docs

| File | Use |
|---|---|
| `docs/WORKFLOW.md` | Branches, commits, GitHub remote/push flow, validation, docs updates, and release safety |
| `docs/DEPLOYMENT.md` | Production deployment target, Cloudflare route, and live verification |
| `docs/UNRAID_DEPLOYMENT.md` | Unraid container defaults, validation, and update procedure |
| `docs/BACKUPS.md` | Source, media, local state, and future database backup rules |
| `docs/CONTENT_PIPELINE.md` | Import/review rules for future content workflows |
| `docs/EXTERNAL_SERVICES_PLAN.md` | External service boundaries and deferred integrations |
| `docs/MAP_PROVIDER.md` | Map tile/provider strategy |
| `docs/ROUTING_PROVIDER.md` | Routing provider boundary |
| `docs/MEDIA_ATTRIBUTION.md` | Public media attribution policy |

## Active Product And System Docs

| File | Use |
|---|---|
| `docs/LIVE_REAUDIT.md` | Current implementation summary and remaining risks |
| `docs/LIVE_APP_AUDIT.md` | Phase 2A audit context |
| `docs/PHASE_2A_MAP_DATA_PLAN.md` | Map/data foundation plan |
| `docs/PHASE_2B_REAL_ROUTES_VISUALS_PLAN.md` | Real routes and visuals plan |
| `docs/MVP_SCOPE.md` | Montreal MVP scope boundaries |
| `docs/STITCH_AUDIT.md` | Stitch source audit and visual-reference mapping |

## Historical Or Reference Material

- `meaningful_routes_codex_handoff/` is a handoff archive. It may mention premium packs, road-trip, pilgrimage, audio, tickets, or other future concepts, but those are not current implementation scope.
- `.stitch/` contains extracted visual references when present locally. Do not restart the app from those exports.
- `output/`, `.playwright-cli/`, `.npm-restore/`, and `test-results/` are generated local artifacts and should not be used as source-of-truth docs.

## Documentation Update Rule

Update docs in the same change when code changes affect:

- app scope or non-goals
- validation commands
- deployment procedure
- data model or provider boundaries
- media licensing or attribution
- branch/release workflow
- live-app risks or blockers

Do not rewrite archived handoff tickets unless the request is specifically about the archive.

## GitHub Source Of Truth

- Private repo: `https://github.com/Berky01/meaningful-routes`
- Local remote: `origin` -> `https://github.com/Berky01/meaningful-routes.git`
- Stable branch: `main`
- Active Codex branch: `codex/phase-2a-live-app`

Future sessions should run `git status --short --branch` and `git remote -v` before changing files. If the worktree is mixed, stage explicit file paths only.
