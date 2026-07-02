import { expect, test, type Page } from "@playwright/test";

const routeSlug = "old-montreal-monuments-loop";
const routeTitle = "Old Montreal Monuments Loop";
const placeSlug = "place-darmes";
const placeTitle = "Place d'Armes";

test.use({ baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3105" });

async function gotoReady(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(250);
}

test("production pages do not expose prototype copy or duplicate stop numbering", async ({ page }) => {
  const paths = [
    "/app",
    "/search?q=quiet%20architecture%20under%201%20hour",
    "/routes",
    `/routes/${routeSlug}`,
    `/routes/${routeSlug}/live`,
    `/routes/${routeSlug}/complete`,
    "/places",
    `/places/${placeSlug}`,
    "/saved",
    "/history",
    "/settings",
    `/report-issue?route=${routeSlug}&stop=${routeSlug}-stop-1`
  ];

  for (const path of paths) {
    await gotoReady(page, path);
    await expect(page.locator("body")).not.toContainText(/Intentional visual placeholder|Visual preview pending licensed media|Media attribution pending|Fallback map|pending licensed media|mock admin QA|Deterministic mock search|MVP parser|source: Route curation/i);
    await expect(page.locator("main")).not.toContainText(/\b1\.\s+1\b|\b2\.\s+2\b/);
  }

  await gotoReady(page, `/report-issue?route=${routeSlug}&stop=${routeSlug}-stop-1`);
  const stopOptions = await page.locator("#stopId option").allTextContents();
  expect(stopOptions.some((option) => option.startsWith("Stop 1:"))).toBe(true);
  expect(stopOptions.join("\n")).not.toMatch(/\b1\.\s+1\b|\b2\.\s+2\b/);
});

test("core route and place pages render local photo assets without broken images", async ({ page }) => {
  const photoPages = [
    { path: "/app", minimumPhotos: 10 },
    { path: "/routes", minimumPhotos: 10 },
    { path: `/routes/${routeSlug}`, minimumPhotos: 6 },
    { path: `/routes/${routeSlug}/live`, minimumPhotos: 6 },
    { path: "/places", minimumPhotos: 20 },
    { path: `/places/${placeSlug}`, minimumPhotos: 1 },
    { path: "/saved", minimumPhotos: 6 },
    { path: "/history", minimumPhotos: 0 }
  ];

  for (const item of photoPages) {
    await gotoReady(page, item.path);
    const imageState = await page.evaluate(() => {
      const images = Array.from(document.images);
      return {
        broken: images.filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.alt || img.currentSrc || img.src),
        localPhotos: images.filter((img) => decodeURIComponent(img.currentSrc || img.src).includes("/media/places/")).length
      };
    });

    expect(imageState.broken, `${item.path} has broken images`).toEqual([]);
    expect(imageState.localPhotos, `${item.path} local photo count`).toBeGreaterThanOrEqual(item.minimumPhotos);
  }
});

test("saved, share, settings, live route, completion, history, and issue flows persist visibly", async ({ page }) => {
  await gotoReady(page, `/routes/${routeSlug}`);
  await page.getByRole("button", { name: "Save route", exact: true }).click();
  await expect(page.getByRole("button", { name: "Saved" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Share" }).first().click();
  await expect(page.getByRole("button", { name: /Copied|Shared/ }).first()).toBeVisible();

  await gotoReady(page, `/places/${placeSlug}`);
  await page.getByRole("button", { name: "Save place", exact: true }).click();
  await expect(page.getByRole("button", { name: "Saved" }).first()).toBeVisible();

  await gotoReady(page, "/saved");
  await expect(page.getByText(routeTitle).first()).toBeVisible();
  await expect(page.getByText(placeTitle).first()).toBeVisible();
  await page.getByRole("button", { name: `Unsave ${placeTitle}` }).first().click();
  await expect(page.getByText(placeTitle).first()).toBeHidden();

  await gotoReady(page, "/settings");
  await page.getByLabel("Miles").check();
  await page.getByLabel("Brisk").check();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByText("Saved for this browser")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Miles")).toBeChecked();
  await expect(page.getByLabel("Brisk")).toBeChecked();
  await gotoReady(page, `/routes/${routeSlug}`);
  await expect(page.locator("main")).toContainText("mi");
  await expect(page.locator("main")).toContainText("brisk pace");

  await gotoReady(page, "/search?q=quiet%20architecture%20walk%20under%201%20hour");
  await expect(page.locator("main")).toContainText("Matched preferences");
  await page.getByRole("button", { name: /Remove Architecture theme/ }).click();
  await expect(page.locator("main")).not.toContainText("Architecture theme");

  await gotoReady(page, "/routes?duration=60&interest=architecture");
  await expect(page.locator("main")).toContainText("Under 60 min");
  await expect(page.locator("main")).toContainText("architecture");

  await gotoReady(page, "/routes");
  await page.getByRole("checkbox", { name: `Compare ${routeTitle}` }).check();
  await page.getByRole("checkbox", { name: "Compare Place d'Armes Circuit" }).check();
  await expect(page.getByText("2 selected routes")).toBeVisible();
  await page.getByRole("link", { name: "Open route comparison" }).click();
  await expect(page).toHaveURL(/\/routes\/compare$/);
  await expect(page.getByText("2 selected routes")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: routeTitle })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Place d'Armes Circuit" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Churches & Courtyards Walk" })).toHaveCount(0);

  await gotoReady(page, `/routes/${routeSlug}/live`);
  await expect(page.locator("main")).toContainText("Stop 1 of");
  await page.getByRole("button", { name: "Next stop" }).click();
  await expect(page.locator("main")).toContainText("Stop 2 of");
  await page.getByRole("button", { name: "Mark visited" }).click();
  await expect(page.locator("main")).toContainText("1/7");
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.locator("main")).toContainText("Paused");
  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.locator("main")).toContainText("Active");
  await page.reload();
  await expect(page.locator("main")).toContainText("Stop 3 of");
  await expect(page.locator("main")).toContainText("1/7");
  await page.getByRole("button", { name: "End walk" }).click();
  await expect(page).toHaveURL(new RegExp(`/routes/${routeSlug}/complete$`));
  await expect(page.locator("main")).toContainText("Route completed");
  await expect(page.locator("main")).toContainText("1/7");

  await page.getByRole("link", { name: /Save to history|Saved to history/ }).click();
  await expect(page).toHaveURL(/\/history$/);
  await expect(page.getByText(routeTitle).first()).toBeVisible();
  await page.getByRole("link", { name: "Walk again" }).first().click();
  await expect(page).toHaveURL(new RegExp(`/routes/${routeSlug}/live$`));
  await gotoReady(page, "/history");
  await page.getByRole("button", { name: "Delete history item" }).first().click();
  await expect(page.getByText("No completed walks yet")).toBeVisible();

  await gotoReady(page, `/report-issue?route=${routeSlug}&stop=${routeSlug}-stop-1`);
  await expect(page.locator("#stopId")).toHaveValue(`${routeSlug}-stop-1`);
  await page.getByLabel("What changed?").fill("Temporary sidewalk closure near the first stop.");
  await page.getByRole("button", { name: "Submit report" }).click();
  await expect(page.getByText("Report saved for content review on this browser.")).toBeVisible();
});

test("core pages do not overflow across product viewports", async ({ page }) => {
  test.setTimeout(120000);
  const viewports = [
    { width: 375, height: 812 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 }
  ];
  const paths = [
    "/app",
    "/search?q=quiet%20architecture%20under%201%20hour",
    "/routes",
    `/routes/${routeSlug}`,
    `/routes/${routeSlug}/live`,
    "/places",
    `/places/${placeSlug}`,
    "/saved",
    "/history",
    "/settings",
    `/report-issue?route=${routeSlug}&stop=${routeSlug}-stop-1`
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const path of paths) {
      await gotoReady(page, path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} overflows at ${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(1);
    }
  }
});
