# Roadmap

This roadmap is designed around open-source maintenance areas where contributors and AI coding agents can make focused, reviewable improvements.

## 1. Developer onboarding

- Keep the default local setup working with seeded providers.
- Improve first-run documentation for web, API, and mobile.
- Add a small sample route walkthrough to the README.
- Add clearer troubleshooting for provider keys and mobile API URLs.

## 2. Route quality and scoring

- Expand route scoring tests for distance, time, discoveries, and route shape.
- Explain route recommendation reasons in a more user-readable way.
- Add stronger fallback behavior when live providers fail.
- Add more deterministic seeded route fixtures for regression testing.

## 3. POI data and local discovery

- Improve Montreal POI categories and neighborhood coverage.
- Add validation for duplicate, stale, or poorly categorized POIs.
- Document how to import and review POI data.
- Add a lightweight POI quality report.

## 4. Mobile walk companion

- Improve active walk progress states.
- Add clearer pause, resume, completion, and GPS-unavailable handling.
- Improve saved-route and history persistence tests.
- Strengthen accessibility for outdoor use.

## 5. Web/mobile parity

- Keep route comparison, detail, saved, and history behavior aligned between web and mobile.
- Add visual smoke checks for the highest-risk screens.
- Document parity expectations for contributors.

## 6. Maintainer automation

- Use CI for typecheck, unit tests, and build verification.
- Add issue templates for bug reports and feature proposals.
- Use AI-assisted PR review for focused test and documentation suggestions.
- Generate release notes from merged changes.
