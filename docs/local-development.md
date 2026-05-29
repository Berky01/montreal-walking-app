# Local development

## Install

```bash
npm install
```

## Start API

```bash
cp .env.example .env
npm run setup:env
npm run dev:api
```

## Start web app

```bash
npm run dev
```

## Start mobile app

```bash
npm run dev:mobile
```

For a physical device, set a LAN-reachable API URL:

```bash
EXPO_PUBLIC_API_BASE_URL=http://YOUR-LAN-IP:5174 npm run dev:mobile
```

## Tests

```bash
npm run test
npm run build
npm run test:mobile:unit
```

## Provider modes

Use seeded providers for local development without API keys:

```text
USE_SEEDED_PROVIDERS=true
```

Use live providers by setting MapTiler and Geoapify keys in `.env`.

## What not to commit

- `.env`
- `node_modules/`
- `dist/`
- `coverage/`
- `output/`
- `data/route-store.json`
- local screenshots, traces, and generated reports
