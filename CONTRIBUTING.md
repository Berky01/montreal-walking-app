# Contributing

Thanks for your interest in Montreal Walking App.

## Good first contributions

- Improve setup documentation
- Add tests for route scoring and route comparison edge cases
- Improve empty, loading, disabled, and error states
- Add accessibility fixes to web or mobile surfaces
- Improve seeded Montreal POI data quality
- Document provider setup for MapTiler, Geoapify, or Mapbox

## Development workflow

1. Fork the repository.
2. Create a focused branch.
3. Run the relevant tests before opening a pull request.
4. Keep each PR focused on one behavior or documentation area.

Useful commands:

```bash
npm install
npm run test
npm run build
npm run test:mobile:unit
```

## Pull request expectations

A good PR includes:

- A concise description of the user-facing change
- The reason for the change
- Tests or a clear explanation of why tests were not needed
- Screenshots for UI changes when practical

## Project principles

- Keep the MVP Montreal-first unless a task explicitly expands geography.
- Treat route metric trust as a product requirement.
- Prefer practical, readable UI over decorative dashboards.
- Keep changes in the smallest owning layer.
- Avoid committing secrets, `.env`, generated output, or `node_modules`.
