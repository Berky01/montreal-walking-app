import { expect, test, type Page, type TestInfo } from '@playwright/test';

const artifactDir = 'output/playwright/real-condition-ux-ui-audit';
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173';

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await page.screenshot({
    path: `${artifactDir}/${testInfo.project.name}-${name}.png`,
    fullPage: true,
  });
}

async function clickFirstVisible(page: Page, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const matches = page.getByRole('button', { name: pattern });
    const count = await matches.count();

    for (let index = 0; index < count; index += 1) {
      const button = matches.nth(index);
      if (await button.isVisible()) {
        await button.click();
        return true;
      }
    }
  }

  return false;
}

async function clickFirstRouteCard(page: Page) {
  const routeCards = page.locator('button.route-card');
  const count = await routeCards.count();

  for (let index = 0; index < count; index += 1) {
    const card = routeCards.nth(index);
    if (await card.isVisible()) {
      await card.click();
      return true;
    }
  }

  return clickFirstVisible(page, [/coffee|green|loop|route/i]);
}

async function captureConsoleErrors(page: Page) {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => {
    consoleErrors.push(error.message);
  });
  return consoleErrors;
}

async function captureRequestFailures(page: Page) {
  const requestFailures: string[] = [];
  page.on('requestfailed', (request) => {
    requestFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? 'failed'}`);
  });
  return requestFailures;
}

test.beforeEach(async ({ context, page }) => {
  await context.grantPermissions(['geolocation']);
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
});

test('planning flow captures Explore, Compare, Detail, Active, and Complete evidence', async ({ page }, testInfo) => {
  const consoleErrors = await captureConsoleErrors(page);
  const requestFailures = await captureRequestFailures(page);

  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
  await capture(page, testInfo, '01-explore');

  await clickFirstVisible(page, [/start planning/i]);
  await capture(page, testInfo, '02-explore-ready');

  const generated = await clickFirstVisible(page, [/find loops/i, /build|generate|find|route|loop/i]);
  testInfo.annotations.push({ type: 'audit', description: `generate-clicked:${generated}` });
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.waitForTimeout(1000);
  await capture(page, testInfo, '03-compare-or-error');

  const openedDetail = await clickFirstRouteCard(page);
  testInfo.annotations.push({ type: 'audit', description: `detail-clicked:${openedDetail}` });
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.waitForTimeout(750);
  await capture(page, testInfo, '04-detail');

  const saved = await clickFirstVisible(page, [/^save$/i]);
  testInfo.annotations.push({ type: 'audit', description: `save-clicked:${saved}` });
  await page.waitForTimeout(500);
  await capture(page, testInfo, '05-detail-after-save');

  const started = await clickFirstVisible(page, [/^start$/i]);
  testInfo.annotations.push({ type: 'audit', description: `start-clicked:${started}` });
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.waitForTimeout(750);
  await capture(page, testInfo, '06-active');

  const completed = await clickFirstVisible(page, [/complete/i]);
  testInfo.annotations.push({ type: 'audit', description: `complete-clicked:${completed}` });
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.waitForTimeout(750);
  await capture(page, testInfo, '07-complete');

  testInfo.attach('console-errors', {
    body: consoleErrors.join('\n') || 'No console errors captured.',
    contentType: 'text/plain',
  });
  testInfo.attach('request-failures', {
    body: requestFailures.join('\n') || 'No request failures captured.',
    contentType: 'text/plain',
  });
});

test('primary tabs and settings are reachable by keyboard and touch', async ({ page }, testInfo) => {
  const consoleErrors = await captureConsoleErrors(page);
  const requestFailures = await captureRequestFailures(page);

  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
  await clickFirstVisible(page, [/start planning/i]);

  for (const tab of ['History', 'Saved', 'Settings', 'Explore']) {
    await clickFirstVisible(page, [new RegExp(`^${tab}$`, 'i')]);
    await page.waitForTimeout(300);
    await capture(page, testInfo, `tab-${tab.toLowerCase()}`);
  }

  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press('Tab');
  }
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await page.keyboard.press('Escape');
  await capture(page, testInfo, 'keyboard-focus-after-tabs');

  testInfo.attach('console-errors', {
    body: consoleErrors.join('\n') || 'No console errors captured.',
    contentType: 'text/plain',
  });
  testInfo.attach('request-failures', {
    body: requestFailures.join('\n') || 'No request failures captured.',
    contentType: 'text/plain',
  });
});

test('location denied state remains inspectable', async ({ browser }, testInfo) => {
  const context = await browser.newContext({
    geolocation: { latitude: 45.5019, longitude: -73.5674 },
    permissions: [],
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  await page.goto(baseUrl);
  await expect(page.locator('body')).toBeVisible();
  await clickFirstVisible(page, [/start planning/i]);
  await capture(page, testInfo, 'location-denied-explore');
  await context.close();
});

test('reduced motion condition is inspectable', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
  await clickFirstVisible(page, [/start planning/i]);
  await capture(page, testInfo, 'reduced-motion-explore');
});

test('slow, offline, and zoom stress conditions are inspectable', async ({ context, page }, testInfo) => {
  const requestFailures = await captureRequestFailures(page);

  await page.route('**/api/routes/generate', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });

  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
  await clickFirstVisible(page, [/start planning/i]);
  await clickFirstVisible(page, [/find loops/i]);
  await page.waitForTimeout(350);
  await capture(page, testInfo, 'slow-route-generation');

  await page.locator('button.route-card').first().waitFor({ state: 'visible', timeout: 15_000 });

  await page.evaluate(() => {
    document.documentElement.style.zoom = '1.25';
  });
  await capture(page, testInfo, 'zoom-125-compare');

  await context.setOffline(true);
  await clickFirstRouteCard(page);
  await page.waitForTimeout(750);
  await capture(page, testInfo, 'offline-after-route-card-click');
  await context.setOffline(false);

  testInfo.attach('request-failures', {
    body: requestFailures.join('\n') || 'No request failures captured.',
    contentType: 'text/plain',
  });
});
