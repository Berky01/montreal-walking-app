import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { join } from 'node:path';

const screens = [
  'home',
  'home-goal-first',
  'start-location',
  'route-comparison',
  'route-detail',
  'route-detail-goal-linked',
  'poi-card',
  'poi-card-practical',
  'poi-card-hook',
  'active-walk',
  'active-walk-navigation',
  'active-walk-progress',
  'active-walk-streamlined',
  'active-walk-variants',
  'no-routes',
  'route-feedback',
  'walk-complete',
  'walk-complete-summary',
  'saved-progress',
  'desktop-home',
  'desktop-planner',
  'desktop-detail',
  'desktop-footprint',
];

const mobileScreens = screens.filter((screen) => !screen.startsWith('desktop-'));
const desktopScreens = screens.filter((screen) => screen.startsWith('desktop-'));
const port = Number(process.env.STITCH_SCREENSHOT_PORT ?? 5173);
const baseUrl = process.env.STITCH_SCREENSHOT_BASE_URL ?? `http://127.0.0.1:${port}`;
const outDir = process.env.STITCH_SCREENSHOT_OUT_DIR ?? join('output', 'stitch-review');

async function waitForServer(url, timeoutMs = 30_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Vite is still booting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function startVite() {
  if (process.env.STITCH_SCREENSHOT_BASE_URL) return null;

  const child = spawn(
    `npm run dev -- --port ${port}`,
    { shell: true, stdio: 'inherit', env: { ...process.env, BROWSER: 'none' } },
  );

  return child;
}

function stopVite(child) {
  if (!child) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }
  child.kill('SIGTERM');
}

async function captureSet(browser, viewport, label, screenIds) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: label === 'mobile' ? 2 : 1,
  });
  const page = await context.newPage();

  for (const screen of screenIds) {
    await page.goto(`${baseUrl}/?stitchScreen=${encodeURIComponent(screen)}`, { waitUntil: 'networkidle' });
    await page.locator('[data-testid="stitch-review-screen"]').waitFor();
    const audit = await page.evaluate(() => {
      const heading = document.querySelector('h1, h2');
      const primary = document.querySelector('.primary-button, .icon-button.primary');
      const bodyStyle = window.getComputedStyle(document.body);
      const headingStyle = heading ? window.getComputedStyle(heading) : null;
      const primaryStyle = primary ? window.getComputedStyle(primary) : null;

      return {
        bodyFont: bodyStyle.fontFamily,
        headingFont: headingStyle?.fontFamily ?? '',
        primaryBackground: primaryStyle?.backgroundColor ?? '',
      };
    });

    if (!audit.bodyFont.includes('Public Sans')) {
      throw new Error(`${screen}: expected Public Sans body font, got ${audit.bodyFont}`);
    }
    if (!audit.headingFont.includes('Hanken Grotesk')) {
      throw new Error(`${screen}: expected Hanken Grotesk heading font, got ${audit.headingFont}`);
    }
    if (audit.primaryBackground && audit.primaryBackground !== 'rgb(164, 55, 22)') {
      throw new Error(`${screen}: expected terracotta primary background, got ${audit.primaryBackground}`);
    }
    await page.screenshot({
      path: join(outDir, `${label}-${screen}.png`),
      fullPage: true,
    });
  }

  await context.close();
}

await mkdir(outDir, { recursive: true });
const vite = startVite();

try {
  await waitForServer(baseUrl);
  const browser = await chromium.launch();
  await captureSet(browser, { width: 390, height: 884 }, 'mobile', mobileScreens);
  await captureSet(browser, { width: 1280, height: 1024 }, 'desktop-1280', desktopScreens);
  await captureSet(browser, { width: 1440, height: 1024 }, 'desktop-1440', desktopScreens);
  await browser.close();
} finally {
  stopVite(vite);
}
