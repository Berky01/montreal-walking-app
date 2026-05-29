# Mobile Testing Matrix

Use this as the single entrypoint for where to run and see the app across Unraid production, desktop, iPhone, and Android.

## Production Address

The full app should be opened from Unraid:

```text
http://<unraid-lan-ip>:8080
```

If you have a reverse proxy/domain:

```text
https://walk.<your-domain>
```

The local `127.0.0.1` URLs are Windows development-only. They are not the production app and should not be used for normal testing.

No-command Unraid launcher from the project root:

- `OPEN-UNRAID-APP.cmd`: asks for your Unraid IP or domain and opens the app.

## Command Center

No-command launchers from the project root:

- `OPEN-UNRAID-APP.cmd`: opens the Unraid-hosted app.
- `OPEN-WEB-PROTOTYPE.cmd`: opens the Unraid-hosted app in the Windows browser.
- `OPEN-MOBILE-WEB.cmd`: opens the Unraid-hosted app in the Windows browser for mobile-style checking.
- `OPEN-ANDROID-EMULATOR.cmd`: opens the Unraid-hosted app in the Android emulator browser.
- `OPEN-TEST-MATRIX.cmd`: prints the full surface matrix.

Print every surface:

```powershell
rtk npm run test:mobile:matrix
```

Print one surface:

```powershell
rtk npm run test:mobile:matrix -- --surface unraid-production
rtk npm run test:mobile:matrix -- --surface android-emulator-browser
```

Available surfaces:

- `unit`
- `unraid-production`
- `desktop-browser`
- `iphone-safari`
- `android-emulator-browser`

## Quick Commands

Fast mobile checks:

```powershell
rtk npm run test:mobile:unit
```

Hosted Unraid app check:

```powershell
rtk npm run test:mobile:matrix -- --surface unraid-production
```

Desktop browser client:

```powershell
rtk npm run test:mobile:matrix -- --surface desktop-browser
```

Android emulator browser client:

```powershell
rtk npm run test:mobile:matrix -- --surface android-emulator-browser
```

## Connectivity

- Windows browser opens `http://<unraid-lan-ip>:8080`.
- iPhone Safari opens `http://<unraid-lan-ip>:8080`.
- Android emulator browser opens `http://<unraid-lan-ip>:8080`.
- All clients use `/api` through the Unraid frontend container.

When code changes, rebuild/restart the Unraid Compose stack. Local Windows hot reload is only for development, not the hosted app.
