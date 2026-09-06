const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Login
  await page.goto('http://localhost:5173/login');
  await page.type('input[type="email"]', 'admin@dealflow360.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  
  // Go to Quotes New
  await page.goto('http://localhost:5173/quotes/new');
  await page.waitForSelector('select'); // Wait for products to load
  
  // Pick a customer
  const customerSelects = await page.$$('select');
  // 1st select should be customer if it's a dropdown, but customer picker uses a custom UI?
  // Let's just evaluate the inner text of the entire page to see what's failing.
  const bodyText = await page.evaluate(() => document.body.innerText);
  
  console.log("PAGE TEXT HEAD:", bodyText.substring(0, 500));
  
  await browser.close();
})();
