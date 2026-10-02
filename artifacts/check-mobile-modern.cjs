require('dotenv').config({ quiet: true });
const { chromium, expect } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  try {
    const page = await browser.newPage({
      viewport: { width: 430, height: 932 },
      geolocation: { latitude: 6.9271, longitude: 79.8612 },
      permissions: ['geolocation'],
    });
    const browserErrors = [];
    page.on('pageerror', (e) => {
      browserErrors.push(e.message);
      console.log('BROWSER ERROR', e.message);
    });
    await page.goto('http://localhost:8083', { timeout: 120000 });
    await page.getByRole('button', { name: /GET STARTED/ }).waitFor({ timeout: 120000 });
    await page.screenshot({ path: 'artifacts/mobile-modern-welcome.png' });
    await page.getByRole('button', { name: /GET STARTED/ }).click();
    await page.getByLabel('NIC NUMBER', { exact: true }).fill('MOBILE-DEMO-01');
    await page.getByLabel('PASSWORD', { exact: true }).fill(process.env.SEED_PASSWORD);
    await page.getByRole('button', { name: /Continue/ }).click();
    await page.getByLabel('Open private PIN entry').waitFor();
    const display = page.getByLabel('Open private PIN entry');
    const box = await display.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(1700);
    await page.mouse.up();
    for (const d of '123456') await page.getByRole('button', { name: d, exact: true }).click();
    await page.getByRole('button', { name: 'Continue to Suraksha', exact: true }).click();
    await page.getByRole('button', { name: 'Scan a message', exact: true }).waitFor();
    await expect(page.getByText('Loading your space...', { exact: true })).toHaveCount(0);
    await page.screenshot({ path: 'artifacts/mobile-modern-home.png' });
    console.log('PASS welcome, login, disguise PIN unlock, home render');
    const click = (name) => page.getByRole('button', { name, exact: true }).click();
    const home = async () => {
      for (let i = 0; i < 12; i++) {
        if (await page.getByRole('button', { name: 'Home', exact: true }).isVisible()) {
          await click('Home');
          await page.getByRole('button', { name: 'Scan a message', exact: true }).waitFor();
          return;
        }
        await click('Go back');
      }
      throw new Error('Unable to return home');
    };
    const stamp = Date.now();
    for (const width of [375, 430, 1280]) {
      await page.setViewportSize({ width, height: 932 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    }
    await page.setViewportSize({ width: 430, height: 932 });
    await click('Route home');
    await page.getByLabel('Destination latitude', { exact: true }).fill('999');
    await click('Find route');
    await expect(
      page.getByText('Enter valid destination coordinates.', { exact: true }),
    ).toBeVisible();
    await page.getByLabel('Destination latitude', { exact: true }).fill('6.91');
    await page.getByLabel('Destination longitude', { exact: true }).fill('79.87');
    await click('Find route');
    await click('View route preview');
    await expect(page.getByText(/Preview only: live safe routing/)).toBeVisible();
    await click('Stop navigation preview');
    await home();
    await click('Knowledge');
    await page.getByLabel(/Search guides/).fill('no-matching-guide-' + stamp);
    await expect(page.getByText('No guides match your search.', { exact: true })).toBeVisible();
    await home();
    console.log('PASS responsive widths, route validation/preview, knowledge search');
    await click('Trusted contacts');
    await page.getByLabel('Name', { exact: true }).fill('Preview contact ' + stamp);
    await page.getByLabel('Relationship', { exact: true }).fill('Fictional friend');
    await page.getByLabel('Phone number', { exact: true }).fill('+94000000001');
    await page.getByRole('button', { name: /Add another contact/ }).click();
    await expect(page.getByText('Preview contact ' + stamp, { exact: true })).toBeVisible();
    await page.screenshot({ path: 'artifacts/mobile-modern-contacts.png' });
    await page.getByRole('button', { name: 'Remove', exact: true }).last().click();
    await expect(page.getByText('Preview contact ' + stamp, { exact: true })).toHaveCount(0);
    console.log('PASS contact create/remove');
    await home();
    await click('Vault');
    await page.getByRole('button', { name: /Add evidence/ }).click();
    await page.getByRole('radio').filter({ hasText: 'Chat log' }).click();
    await page
      .getByLabel('Paste chat text (or import a file)', { exact: true })
      .fill('Fictional preview evidence ' + stamp);
    await click('Encrypt & save');
    await expect(page.getByRole('heading', { name: 'Chat-log.txt', exact: true })).toBeVisible();
    for (const d of '123456') await page.getByRole('button', { name: d, exact: true }).click();
    await click('Verify & unlock preview');
    await expect(
      page.getByText('Fictional preview evidence ' + stamp, { exact: true }),
    ).toBeVisible();
    await page.screenshot({ path: 'artifacts/mobile-modern-evidence.png' });
    console.log('PASS browser evidence upload, encryption and PIN preview');
    await click('Attach to report');
    await page.getByRole('button', { name: /Continue/ }).click();
    await page
      .getByLabel('Describe briefly (optional)', { exact: true })
      .fill('Fictional UI regression report ' + stamp);
    await page.getByRole('button', { name: /Submit report/ }).click();
    await expect(page.getByRole('heading', { name: /Report #/ })).toBeVisible();
    await page.getByLabel('Your message', { exact: true }).fill('Fictional follow-up ' + stamp);
    await click('Message case officer');
    await expect(page.getByText('Fictional follow-up ' + stamp, { exact: true })).toBeVisible();
    await page.screenshot({ path: 'artifacts/mobile-modern-report.png' });
    console.log('PASS report with attached evidence and case message');
    await home();
    await click('Ask Legal Aid');
    await page
      .getByLabel(/Message .*ask about your rights/)
      .fill('Fictional legal information question ' + stamp);
    await click('Send message');
    await click('Connect to a human advisor');
    await expect(
      page.getByRole('button', { name: 'Human advisor requested', exact: true }),
    ).toBeDisabled();
    await page.screenshot({ path: 'artifacts/mobile-modern-legal.png' });
    console.log('PASS legal chat and human escalation');
    await home();
    await click('Check in');
    await click('Save my check-in');
    const consent = page.getByRole('radio', {
      name: 'Share this check-in with my assigned counselor',
      exact: true,
    });
    await consent.click();
    await expect(consent).toBeChecked();
    await consent.click();
    await expect(consent).not.toBeChecked();
    await page.screenshot({ path: 'artifacts/mobile-modern-wellbeing.png' });
    await click('Book a counselor');
    await page.getByRole('radio').first().click();
    await page.getByRole('button', { name: /Confirm booking/ }).click();
    await expect(page.getByText('Confidential booking confirmed', { exact: true })).toBeVisible();
    await page
      .getByLabel('Message your counselor', { exact: true })
      .fill('Fictional session message ' + stamp);
    await click('Send');
    await expect(page.getByText(new RegExp('Fictional session message ' + stamp))).toBeVisible();
    await page.screenshot({ path: 'artifacts/mobile-modern-counseling.png' });
    console.log('PASS wellbeing consent on/off, booking and counselor message');
    await home();
    await click('Community');
    await page
      .getByLabel(/Share your story anonymously/)
      .fill('Fictional supportive community post ' + stamp);
    await click('Submit for moderation');
    await expect(
      page.getByText('Fictional supportive community post ' + stamp, { exact: true }),
    ).toBeVisible();
    console.log('PASS community moderation submission');
    await home();
    await click('Scan a message');
    await page
      .getByLabel('Message text', { exact: true })
      .fill('You are stupid. Fictional test message.');
    await click('Analyse with AI');
    await click('View full analysis');
    await expect(page.getByRole('heading', { name: 'Analysis result', exact: true })).toBeVisible();
    console.log('PASS message analysis and result');
    await home();
    await click('SOS');
    const sos = page.getByRole('button', {
      name: 'Hold for two seconds to activate SOS',
      exact: true,
    });
    const sosBox = await sos.boundingBox();
    await page.mouse.move(sosBox.x + sosBox.width / 2, sosBox.y + sosBox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(2300);
    await page.mouse.up();
    await expect(page.getByRole('heading', { name: 'Your SOS status', exact: true })).toBeVisible({
      timeout: 30000,
    });
    await page.getByRole('button', { name: /I am safe now/ }).click();
    await expect(page.getByText('SAFE', { exact: true })).toBeVisible();
    console.log('PASS SOS hold, location and safe status');
    await click('Home');
    await click('Profile');
    await page.screenshot({ path: 'artifacts/mobile-modern-profile.png' });
    await click('Sign out');
    await expect(page.getByRole('button', { name: /GET STARTED/ })).toBeVisible();
    console.log('PASS sign out');
    expect(browserErrors).toEqual([]);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
