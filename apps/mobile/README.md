# Montreal Walk Scout Mobile Prototype

Expo Native prototype for the walking app. The existing Fastify API remains the backend source of truth.

## Local API URL

Set a device-reachable API URL before starting Expo:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.8:5174
```

Do not use `127.0.0.1` on a physical phone unless the API is running on that phone. Use your computer's LAN IP or an Expo tunnel/dev proxy.

## Commands

```bash
npm run dev:api
npm run dev:mobile
npm run test:mobile
```

The prototype uses foreground-only location tracking and does not upload raw GPS trails.
