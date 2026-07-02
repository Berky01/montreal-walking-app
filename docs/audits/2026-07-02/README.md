# Meaningful Routes Audit Package - 2026-07-02

This directory preserves the audit inputs for the launch-hardening implementation work started on 2026-07-02.

## Files

| File | Purpose |
|---|---|
| `meaningful_routes_audit.md` | Live-app and prototype audit findings, launch hardening plan, architecture recommendations, and smoke-test guidance. |
| `meaningful_routes_backlog.csv` | Prioritized backlog. P0 rows are launch blockers and must be closed or documented with evidence before public traffic. |
| `stitch_audit_metrics.csv` | Static Stitch export quality metrics. These are product/design signals, not production source files. |

## Implementation Mapping

- P0 work is tracked in `docs/implementation-report.md`.
- The production app should continue using typed Next.js components and data helpers, not static Stitch HTML.
- Public routes, search, maps, reports, saved state, history, sitemap, and smoke tests should use published Montreal data only.
- P1/P2/P3 ideas from the audit remain behind feature flags or docs until the P0 Montreal MVP is stable.

## Baseline Metrics From Stitch Export

- 82 static prototype screens.
- 1,773,719 HTML characters.
- 161 image tags.
- 138 image tags missing alt text.
- 851 buttons.
- 431 links.
- 191 inputs.
- 171 labels.
- 127 style tags.
- 177 script tags.
- 164 Material Symbols links.
- 82 files using Tailwind CDN.
