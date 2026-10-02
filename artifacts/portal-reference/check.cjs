require('dotenv').config({ quiet: true });
const { chromium } = require('@playwright/test');
(async () => {
 const browser = await chromium.launch({ channel: 'msedge', headless: true });
 const roles = [
 ['admin','Staff ID','SL-ADM-0192',['/admin','/admin/reports','/admin/users','/admin/moderation','/admin/settings/models']],
 ['police','Badge ID','WP-CDU-0044',['/police/live','/police/cases','/police/map','/police/profile','/police/cases/SL-2291','/police/cases/SL-2291/status']],
 ['counselor','Practitioner ID','CNS-0071',['/counselor/sessions','/counselor/clients','/counselor/messages','/counselor/profile']],
 ['legal','Advisor ID','LGL-0012',['/legal/queries','/legal/resources','/legal/impact','/legal/profile']]
 ];
 try {
 for (const [role,label,login,routes] of roles) {
 const context = await browser.newContext(); const page = await context.newPage(); const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:3000/'+role+'/sign-in');
 await page.getByLabel(label,{exact:true}).fill(login); await page.getByLabel('Password',{exact:true}).fill(process.env.SEED_PASSWORD);
 await page.getByRole('button',{name:/Sign in/}).click(); await page.locator('.staff-shell').waitFor({timeout:60000});
 for (const width of [1440,390]) {
 await page.setViewportSize({width,height:1000});
 for (const route of routes) {
 await page.goto('http://localhost:3000'+route); await page.locator('.staff-shell').waitFor(); await page.waitForTimeout(800);
 if(await page.locator('.error[role="alert"]').count()) errors.push('API error '+route);
 if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth)) errors.push('Overflow '+route+' '+width);
 if(route===routes[0]) await page.screenshot({path:'artifacts/portal-reference/'+role+'-'+width+'.png',fullPage:true});
 }
 }
 console.log(role+': '+(errors.length?JSON.stringify(errors):'PASS desktop/mobile routes; no browser errors or overflow'));
 if(errors.length) process.exitCode=1;
 await context.close();
 }
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
