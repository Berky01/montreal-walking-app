export type MobileSurfaceKey =
  | 'unit'
  | 'unraid-production'
  | 'desktop-browser'
  | 'iphone-safari'
  | 'android-emulator-browser';

export interface MobileSurfaceDefinition {
  label: string;
  apiBaseUrl: string;
  purpose: string;
  start: string[];
  open: string;
  verify: string[];
  notes: string[];
}

export const mobileSurfaceMatrix: Record<MobileSurfaceKey, MobileSurfaceDefinition> = {
  unit: {
    label: 'Mobile unit/type tests',
    apiBaseUrl: 'n/a',
    purpose: 'Fast local verification before deploying the hosted Unraid app.',
    start: [],
    open: 'n/a',
    verify: [
      'rtk npm --workspace @walking-app/mobile run typecheck',
      'rtk npm --workspace @walking-app/mobile test -- --runInBand',
    ],
    notes: ['Run this before slower runtime surface checks.'],
  },
  'unraid-production': {
    label: 'Unraid hosted app',
    apiBaseUrl: 'proxied through http://<unraid-lan-ip>:8080/api',
    purpose: 'The only hosted app runtime. Frontend, API, and database run on Unraid through Docker Compose.',
    start: [
      'On Unraid: cd /mnt/user/appdata/walking-app/source',
      'On Unraid: docker compose up -d --build',
    ],
    open: 'http://<unraid-lan-ip>:8080',
    verify: [
      'Open http://<unraid-lan-ip>:8080',
      'Open http://<unraid-lan-ip>:8080/api/health/providers',
      'On Unraid: DOCTOR_PUBLIC_BASE_URL=http://<unraid-lan-ip>:8080 docker compose exec api npm run doctor',
    ],
    notes: [
      'Do not use Windows localhost for the app.',
      'The API and database stay inside Docker/Unraid; clients use the frontend URL.',
      'Use HTTPS through a reverse proxy before relying on browser geolocation from phones.',
    ],
  },
  'desktop-browser': {
    label: 'Desktop browser client',
    apiBaseUrl: 'proxied through http://<unraid-lan-ip>:8080/api',
    purpose: 'Windows, macOS, or Linux browser opening the Unraid-hosted app.',
    start: [],
    open: 'http://<unraid-lan-ip>:8080',
    verify: [
      'Open http://<unraid-lan-ip>:8080 in the browser.',
      'Confirm Explore loads and route generation reaches Nearby loops.',
    ],
    notes: ['This is a client only. Nothing should run on the Windows PC for production use.'],
  },
  'iphone-safari': {
    label: 'iPhone Safari client',
    apiBaseUrl: 'proxied through http://<unraid-lan-ip>:8080/api',
    purpose: 'iPhone opens the Unraid-hosted app in Safari.',
    start: [],
    open: 'http://<unraid-lan-ip>:8080',
    verify: [
      'Open http://<unraid-lan-ip>:8080 in Safari.',
      'Confirm Explore loads and route generation reaches Nearby loops.',
    ],
    notes: [
      'For browser geolocation on iPhone, use HTTPS through your Unraid reverse proxy.',
      'No Expo Go or Windows dev server is needed for the hosted app.',
    ],
  },
  'android-emulator-browser': {
    label: 'Android emulator browser client',
    apiBaseUrl: 'proxied through http://<unraid-lan-ip>:8080/api',
    purpose: 'Android emulator opens the Unraid-hosted app in its browser.',
    start: [],
    open: 'http://<unraid-lan-ip>:8080',
    verify: [
      'rtk adb devices',
      'rtk adb shell am start -a android.intent.action.VIEW -d http://<unraid-lan-ip>:8080',
      'rtk proxy cmd /c "adb exec-out screencap -p > output\\mobile-emulator\\real-condition-ux-ui-audit\\unraid-android-browser.png"',
    ],
    notes: [
      'This validates the hosted Unraid app from an Android-sized client.',
      'The emulator is only a browser client here; it should not run a local Expo bundle for production validation.',
    ],
  },
};

export function getMobileSurfacePlan(keys: MobileSurfaceKey[] = Object.keys(mobileSurfaceMatrix) as MobileSurfaceKey[]) {
  return keys.map((key) => ({ key, ...mobileSurfaceMatrix[key] }));
}

export function formatSurfacePlan(plan = getMobileSurfacePlan()) {
  return plan.map((surface) => {
    const lines = [
      `## ${surface.label} (${surface.key})`,
      '',
      surface.purpose,
      '',
      `API: ${surface.apiBaseUrl}`,
      `Open: ${surface.open}`,
      '',
      'Start:',
      ...(surface.start.length > 0 ? surface.start.map((command) => `- ${command}`) : ['- n/a']),
      '',
      'Verify:',
      ...surface.verify.map((command) => `- ${command}`),
      '',
      'Notes:',
      ...surface.notes.map((note) => `- ${note}`),
    ];

    return lines.join('\n');
  }).join('\n\n');
}
