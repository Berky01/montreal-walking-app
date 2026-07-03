# Dependency Audit

Date: 2026-07-03

## Remediated

- Upgraded `next` from `15.3.9` to `15.5.20`.
- Upgraded `eslint-config-next` from `15.3.9` to `15.5.20`.
- Upgraded `vitest` from `2.1.8` to `4.1.9`.

This removed the previous high/critical audit findings in the Next.js and Vitest/Vite/esbuild chains.

## Current Audit Result

`npm audit --json` now reports 2 moderate findings:

- `next@15.5.20` via its nested `postcss@8.4.31`.
- `postcss@8.4.31` for [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93).

`npm ls postcss` confirms the app's direct `postcss` dependency is patched at `8.5.16`; the remaining vulnerable copy is bundled under `next`.

## Exception

The remaining advisory applies when untrusted CSS is parsed, stringified by PostCSS, and embedded into an HTML `<style>` context. Meaningful Routes does not accept user-submitted CSS or re-stringify user CSS in runtime issue reports, admin triage, map configuration, or public content flows.

`npm audit fix --force` currently recommends `next@9.3.3`, which would be a major downgrade and would break the App Router/React 19 application. A tested npm override for `next -> postcss@8.5.16` produced an invalid npm tree, so it was not kept.

Follow-up: upgrade `next` again when a stable release bundles `postcss >= 8.5.10`, then rerun `npm audit --json` and remove this exception.
