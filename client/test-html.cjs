const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/login');
  await page.type('input[type="email"]', 'admin@dealflow360.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  
  await page.goto('http://localhost:5173/admin/price-lists', { waitUntil: 'networkidle2' });
  
  const bodyText = await page.evaluate(() => document.body.innerHTML);
  console.log("HTML:", bodyText.substring(0, 1000)); // just print some of it to see if it crashed
  
  await browser.close();
})();
