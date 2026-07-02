# Database Preparation

The live app defaults to `DATA_SOURCE=mock`. Postgres/PostGIS is prepared for a later migration, but the app should boot and build without a database.

## Local Schema

```powershell
psql $env:DATABASE_URL -f db/migrations/001_init_meaningful_routes.sql
psql $env:DATABASE_URL -f db/seeds/montreal_seed.sql
```

## Data Source

- `DATA_SOURCE=mock`: default, uses curated TypeScript data.
- `DATA_SOURCE=postgres`: reserved for the future provider implementation.

Do not point production at Postgres until the provider includes reviewed query code, seed export, and backup restore verification.
