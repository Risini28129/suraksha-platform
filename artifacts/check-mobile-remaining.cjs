require('dotenv').config({ quiet: true });
const { chromium, expect } = require('@playwright/test');
(async () => {
 const browser = await chromium.launch({ channel: 'msedge' });
 try {
 const page = await browser.newPage({ viewport: { width: 430, height: 932 }, geolocation: { latitude: 6.9271, longitude: 79.8612 }, permissions: ['geolocation'] });
 const browserErrors=[]; page.on('pageerror', e => { browserErrors.push(e.message); console.log('BROWSER ERROR',e.message); });
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
 await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.waitForTimeout(1700); await page.mouse.up();
 for (const d of '123456') await page.getByRole('button', { name: d, exact: true }).click();
 await page.getByRole('button', { name: 'Continue to Suraksha', exact: true }).click();
 await page.getByRole('button', { name: 'Scan a message', exact: true }).waitFor();
 await expect(page.getByText('Loading your space...', { exact: true })).toHaveCount(0);
 await page.screenshot({ path: 'artifacts/mobile-modern-home.png' });
 console.log('PASS welcome, login, disguise PIN unlock, home render');
 const click = name => page.getByRole('button', { name, exact: true }).click();
 const home = async () => {
   for (let i=0; i<12; i++) {
     if (await page.getByRole('button', { name: 'Home', exact: true }).isVisible()) { await click('Home'); await page.getByRole('button', { name: 'Scan a message', exact: true }).waitFor(); return; }
     await click('Go back');
   }
   throw new Error('Unable to return home');
 };
 const stamp = Date.now();
 await home(); await click('Scan a message');
 await page.getByLabel('Message text', { exact: true }).fill('You are stupid. Fictional test message.');
 await click('Analyse with AI'); await page.waitForTimeout(18000); console.log('SCAN', await page.locator('body').innerText()); await click('View full analysis');
 await expect(page.getByRole('heading', { name: 'Analysis result', exact: true })).toBeVisible();
 console.log('PASS message analysis and result');
 await home(); await click('SOS');
 const sos = page.getByRole('button', { name: 'Hold for two seconds to activate SOS', exact: true });
 const sosBox = await sos.boundingBox(); await page.mouse.move(sosBox.x+sosBox.width/2,sosBox.y+sosBox.height/2); await page.mouse.down(); await page.waitForTimeout(2300); await page.mouse.up();
 await expect(page.getByRole('heading', { name: 'Your SOS status', exact: true })).toBeVisible({ timeout: 30000 });
 await page.getByRole('button', { name: /I am safe now/ }).click(); await expect(page.getByText('SAFE', { exact: true })).toBeVisible();
 console.log('PASS SOS hold, location and safe status');
 await click('Home'); await click('Profile');
 await page.screenshot({ path: 'artifacts/mobile-modern-profile.png' });
 await click('Sign out'); await expect(page.getByRole('button', { name: /GET STARTED/ })).toBeVisible();
 console.log('PASS sign out');
 expect(browserErrors).toEqual([]);

 } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
