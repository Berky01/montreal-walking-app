# Source trust deployment evidence

## Repo reconciliation

Audit tools can see `Berky01/montreal-walking-app`. They could not see `Berky01/meaningful-routes`, so this branch ports the source/trust implementation into the accessible repo.

Accessible repo:

- Repository: `https://github.com/Berky01/montreal-walking-app.git`
- Branch: `codex/source-trust-publication`
- Base commit before this work: `aa1bda7 Add Docker ignore file for CI`
- First public implementation commit on this branch: `a8ca3d8b1b10fa768a1d279c4da6a2b92a611edf` (`Publish source trust audit surfaces`)

Local deployment commit evidence:

- Local path checked: `C:\Users\valen\Documents\Travel routes`
- Remote configured there: `https://github.com/Berky01/meaningful-routes.git`
- Local branch containing deployment commit: `codex/stitch-discovery-redesign`
- Deployment commit found locally: `acb5a4167ccc8b038a74cf34d59668fea749daef`
- Deployment commit subject: `Implement Stitch source trust surfaces`
- Deployment commit time: `2026-07-02 20:07:21 -0400`

Remote visibility note:

- `git ls-remote https://github.com/Berky01/meaningful-routes.git refs/heads/*` returned public branch heads, but not `acb5a4167ccc8b038a74cf34d59668fea749daef` as a branch head.
- The accessible publication target for audit is therefore `Berky01/montreal-walking-app` on `codex/source-trust-publication`.

## Validation evidence

Commands run locally after the source/trust implementation:

```text
npm test
Test Files  30 passed (30)
Tests  234 passed (234)

npm run lint
tsc -b completed with exit code 0.

npm run typecheck
tsc -b completed with exit code 0.

npm run validate:data
Validated 3 source trust place records.

npm run validate:routes
Validated 2 trusted live route records.

npm run validate:media
Validated 3 approved current media item(s) and 1 approved historical media item(s).

npm run build
tsc -b && vite build completed with exit code 0.

npm run test:smoke
12 passed across small-mobile, mobile-chrome, tablet, and desktop-chrome.
```

Playwright note: the first local smoke attempt failed because the Playwright Chromium binary was not installed in the user cache. `npx playwright install chromium` resolved the local tool setup issue; the configured smoke suite passed after that without code changes other than tightening one heading locator.

## Build mapping

- Source trust utilities: `src/lib/content-trust.ts`
- Source trust fixtures: `src/data/placeTrustData.ts`
- Visible SPA routes: `src/App.tsx`
- POI, admin QA, and live route screens: `src/components/PlaceTrustPage.tsx`
- Validation scripts: `package.json` and `scripts/validate-*.ts`
- Smoke coverage: `tests/playwright/source-trust-smoke.spec.ts`

The exact public commit hash is produced by the branch commit that contains this document. Use `git rev-parse HEAD` on `codex/source-trust-publication` after pulling the branch.
