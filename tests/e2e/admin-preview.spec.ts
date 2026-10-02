import { test, expect } from '@playwright/test';
const routes = [
  ['/admin', 'Overview'],
  ['/admin/reports', 'Reports Queue'],
  ['/admin/users', 'User Management'],
  ['/admin/moderation', 'Content Moderation'],
  ['/admin/settings/models', 'AI Model Monitoring'],
  ['/admin/cases/DEMO-3101', 'Case #DEMO-3101'],
] as const;

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`admin pages and controls work at ${viewport.width}px`, async ({ page }) => {
    const browserErrors: string[] = [];
    page.on('pageerror', (error) => browserErrors.push(error.message));
    await page.setViewportSize(viewport);
    await page.goto('/admin/sign-in');
    await page.getByLabel('Staff ID', { exact: true }).fill('SL-ADM-0192');
    await page.getByLabel('Password', { exact: true }).fill(process.env.SEED_PASSWORD!);
    await page.getByRole('button', { name: /Sign in/ }).click();
    await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
    for (const [path, title] of routes) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
      await expect(page.getByText('Loading your workspace…')).toHaveCount(0);
      await expect(page.locator('.error[role="alert"]')).toHaveCount(0);
      await expect(page.locator('.sidebar nav a[aria-current="page"]')).toHaveCount(1);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBeTruthy();
    }
    await page.goto('/admin/reports');
    await page.getByLabel('Search cases').fill('DEMO-3101');
    await expect(page.locator('tbody tr')).toHaveCount(1);
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export CSV' }).click();
    expect((await downloaded).suggestedFilename()).toBe('suraksha-reports.csv');
    await page.getByLabel('Search cases').fill('no-such-report');
    await expect(page.getByText('No records to show yet.')).toBeVisible();
    await page.goto('/admin/users');
    await page.getByLabel('Search users').fill('DEMO-POL-0102');
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await page.goto('/admin/settings/models');
    await expect(page.getByRole('button', { name: 'Record retraining request' })).toBeDisabled();
    await page.getByLabel('Model to review').selectOption('demo-language-review-v1');
    await page.getByLabel('Retraining or override review note').fill('Review the demo model');
    await expect(page.getByRole('button', { name: 'Record retraining request' })).toBeEnabled();
    expect(browserErrors).toEqual([]);
    await page.getByRole('button', { name: 'Sign out of workspace' }).click();
    await expect(page.getByRole('button', { name: /Sign in/ })).toBeVisible();
  });
}
