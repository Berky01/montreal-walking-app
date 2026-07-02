# Data Workspace

This folder is reserved for optional JSON, generated, and import-review workflows.

Default runtime remains `DATA_SOURCE=mock`; public pages do not read external APIs.

Current production media metadata lives in `data/media/media-assets.json`. Keep it source-controlled with the local assets under `public/media/`.

Folders:

- `imports/raw/` for intentionally small cached raw responses
- `imports/normalized/` for normalized candidate records
- `imports/review/` for review queue files
- `curated/` for future reviewed JSON content
- `generated/` for generated geometry or reports pending review

Rules:

- Do not publish raw imports directly.
- Keep external API responses small and intentional when they must be saved.
- Move reviewed data into typed mock/provider data before runtime use.
- Run `npm run validate:data`, `npm run validate:routes`, and `npm run validate:media` after data or media changes.
