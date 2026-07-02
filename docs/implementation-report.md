# Meaningful Routes Implementation Report

Updated: 2026-07-02

## Summary

This report tracks the audit-package implementation against the P0/P1 backlog preserved in `docs/audits/2026-07-02/`.

Current status: non-visual P0 foundation and hardening slice completed locally. Major UI redesign/layout implementation is deferred until the updated Stitch mockup package is complete.

## Baseline

Repository state at start:

- Branch created: `codex/audit-p0-mvp-hardening`.
- Worktree was clean before edits.
- Remote: `origin` -> `https://github.com/Berky01/meaningful-routes.git`.
- Framework: Next.js 15 App Router, React 19, TypeScript.
- Package manager: npm with `package-lock.json`.
- Data source default: mock/local data.
- Test stack: Vitest and Playwright.
- Deploy target: Unraid/Docker for `https://routeapp.plexplease.xyz/`.

Baseline commands:

| Command | Result |
|---|---|
| `npm test` | Pass: 26 test files, 102 tests. |
| `npm run validate:data` | Pass: 32 routes, 190 places; public readiness 12 routes, 60 places. |
| `npm run validate:routes` | Pass: 32 routes, 32 ready. |
| `npm run validate:media` | Pass: 293 assets, 71 approved real photos, 222 generated fallbacks. |
| `npm run typecheck` | Pass. |
| `npm run lint` | Pass. |
| `npm run build` | Pass: 126 static pages generated. |
| `npm run test:smoke` | Fail before edits: Playwright could not connect to `http://127.0.0.1:3105`; no web server was started by `playwright.config.ts`. |

## P0 Backlog Status

| Area | Status | Evidence |
|---|---:|---|
| Repository access/docs | Done | Remote is configured. Audit inputs preserved under `docs/audits/2026-07-02/`. README/docs updated for content health and smoke commands. |
| Broken place links | Done | Smoke crawler visits `/places`, every linked public place detail, `/routes`, every linked public route detail, and every linked route live page. Unknown place/route slugs return 404. |
| Error handling | Done | Existing designed `app/not-found.tsx` retained; added `app/error.tsx` with non-sensitive error ID display and console logging. |
| Map fallback | Done | Local static map remains the no-key default. Removed raw "Map preview" fallback copy from normal no-key state; tile-load failure shows concise static-map fallback copy. |
| Issue reporting | Done for mock mode | Public form posts to `/api/report-issue`, validates published context, has honeypot/rate-limit guard, writes to mock provider queue, and keeps local browser fallback. Durable DB store remains deferred. |
| Publish-state gating | Done | Public helpers expose 12 public routes and 60 public places only; tests verify generated/draft discovery content is blocked from public lookups and crawl manifest. |
| Search MVP | Existing/deferred | Existing search/ranking loop remains; no layout or major search UX changes made under the Stitch-mockup pause. |
| Saved loop | Existing/prepared | Existing local-storage saved loop verified by smoke. No layout changes made. |
| History loop | Existing/prepared | Existing route completion/history loop verified by smoke. No layout changes made. |
| Live route state | Existing/prepared | Existing durable local route session loop verified by smoke. No layout changes made. |
| Content validation | Done | Added `getAllPublicSlugsForCrawl()` and `scripts/content-health.ts`; `npm run validate:content` passes with 105 public crawl paths. |
| CI smoke tests | Done | Playwright config now starts a local app server; smoke covers public route/place crawler, required paths, headers, SEO files, images, persistence flows, and viewport overflow. |
| Security baseline | Done | Added security headers in `next.config.mjs`: CSP, HSTS, frame denial/frame-ancestors, nosniff, referrer policy, and permissions policy. |

## P1/P2/P3 Work Completed

- SEO basics: added `app/robots.ts`, `app/sitemap.ts`, Open Graph/Twitter metadata basics, and route/place Open Graph metadata.
- No major UI redesign/layout implementation was done. Deferred screens remain for the updated Stitch package.

## Commands Run

- `git status --short`
- `git branch --show-current`
- `git remote -v`
- `git log --oneline -n 12`
- `git diff --stat`
- `npm test`
- `npm run validate:data`
- `npm run validate:routes`
- `npm run validate:media`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run test:smoke`
- `npm run validate:content`
- `npx playwright test --config=playwright.config.ts tests/playwright-smoke.pw.ts -g "saved, share"`

## Deploy Notes

Deployment has not been attempted yet. Code/runtime changes require Unraid deployment before completion unless blocked by missing Docker, SSH, Cloudflare, Unraid, or environment access.

Notes:

- `DATA_SOURCE=mock` remains the default.
- The public issue queue is in-process for mock mode and is not durable across server restarts.
- The local map fallback is still the no-key default; configure `NEXT_PUBLIC_MAP_STYLE_URL` only when a browser-safe MapLibre style URL is available.

## Remaining Work

- Run the final full validation sequence after docs edits.
- Commit and push the non-visual P0 hardening slice.
- Deploy to Unraid and verify the live URL, or report the exact deployment blocker.
- After the updated Stitch mockup package is available, compare it against current app surfaces before any major layout implementation.
