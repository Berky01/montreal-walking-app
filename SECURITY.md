# Security Policy

## Reporting a vulnerability

Please open a private security advisory on GitHub or contact the maintainer directly if you find a security issue.

Do not create a public issue for vulnerabilities involving tokens, provider keys, admin endpoints, location privacy, route persistence, or deployment configuration.

## Secrets and provider keys

Never commit `.env`, provider keys, admin tokens, local database credentials, Expo secrets, or production route-store data.

`MAPTILER_API_KEY` can be exposed to browser clients by design through `/api/client-config`; use a browser-restricted key for production.

## Location privacy

The mobile prototype uses foreground-only location tracking. Do not add raw GPS trail upload or long-term location retention without explicit privacy review and documentation.
