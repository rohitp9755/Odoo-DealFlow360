const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/login');
  await page.type('input[type="email"]', 'admin@dealflow360.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  
  await page.goto('http://localhost:5173/admin/price-lists');
  await page.waitForSelector('button.btn-primary'); // New Price Rule button
  
  // click New Price Rule
  const [button] = await page.$x("//button[contains(., 'New Price Rule')]");
  if (button) {
    await button.click();
  }
  
  await page.waitForTimeout(1000);
  
  // type in form
  // We need to wait for the modal to open
  const selects = await page.$$('select');
  // 3 selects on the page for filters, plus 3 in modal?
  // It's easier to just print the console errors from the page
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await browser.close();
})();
