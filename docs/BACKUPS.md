# Backups

## Source Backup

- Git commits are the first rollback point.
- A private GitHub remote should be used as the off-machine backup and review system once the correct remote URL is configured.
- Do not commit real credentials, `.env` files, generated logs, local test artifacts, package caches, or deployment archives.
- Keep curated audit findings in Markdown docs, not only in `output/` logs.

## Current Mock Mode

- Catalog data lives in source-controlled TypeScript files under `lib/mock-data/`.
- Media metadata is source-controlled under `data/media/media-assets.json`.
- Approved local media under `public/media/` is part of the app baseline.
- Browser saved items and walk history live in each user's `localStorage` and are not server-backed.
- Current issue reports are browser-local in the MVP workflow; API/provider boundaries remain local-first.

## Future Media Volume

When real local media is added, mount and back up:

```txt
/app/public/media
```

Store attribution metadata with the route/place content, not only beside the image file.

## Future Postgres Mode

Before enabling `DATA_SOURCE=postgres`, document and test:

- `pg_dump` backup command
- restore command
- volume snapshot path
- backup schedule
- restore drill result

Do not treat Postgres mode as production-ready until restore has been tested.
