import { expect, test } from '@playwright/test';

test('place pages expose source drawer and historical media states', async ({ page }) => {
  await page.goto('/places/place-darmes');

  await expect(page.getByRole('heading', { name: "Place d'Armes" })).toBeVisible();
  await expect(page.getByText('Source quality 94/100')).toBeVisible();
  await expect(page.getByRole('button', { name: "Open source drawer for Place d'Armes" })).toBeVisible();
  await expect(page.getByRole('region', { name: "Then and now comparison for Place d'Armes" })).toContainText('Then');
  await expect(page.getByRole('region', { name: "Then and now comparison for Place d'Armes" })).toContainText('Now');

  await page.goto('/places/notre-dame-basilica');
  await expect(page.getByRole('heading', { level: 1, name: 'Notre-Dame Basilica' })).toBeVisible();
  await expect(page.getByText('No approved historical media yet.')).toBeVisible();
  await expect(page.getByText('No verified historical comparison yet.')).toBeVisible();
});

test('admin source QA is gated unless explicitly enabled', async ({ page }) => {
  await page.goto('/admin/route-qa');
  await expect(page.getByRole('heading', { name: 'Admin source QA is disabled' })).toBeVisible();

  await page.goto('/admin/route-qa?admin=1');
  await expect(page.getByRole('heading', { name: 'Source QA queue' })).toBeVisible();
  await expect(page.getByText('Place source records')).toBeVisible();
  await expect(page.getByText('Historical media coverage')).toBeVisible();
});

test('live route trust metrics stay consistent', async ({ page }) => {
  await page.goto('/routes/old-montreal-monuments-loop/live');

  await expect(page.getByRole('heading', { name: 'Old Montreal Monuments Loop' })).toBeVisible();
  await expect(page.getByLabel('Steps')).toContainText('4,192');
  await expect(page.getByText('Estimated from planned walking distance')).toBeVisible();
  await expect(page.getByLabel('Pace')).toContainText('15 min/km');
  await expect(page.getByLabel('Current stop context')).toContainText("Place d'Armes");
  await expect(page.getByLabel('Current stop context')).toContainText('Source checked');
});
