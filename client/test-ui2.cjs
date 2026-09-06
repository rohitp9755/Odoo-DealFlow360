const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/login');
  await page.type('input[type="email"]', 'admin@dealflow360.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  
  await page.goto('http://localhost:5173/quotes/new');
  await page.waitForSelector('select');
  
  // Select customer (Acme Corp)
  // Need to click the custom CustomerPicker
  await page.click('input[placeholder="Search accounts…"]');
  await page.waitForTimeout(500);
  const customers = await page.$$('.flex.items-center.justify-between.p-3');
  await customers[0].click(); // Acme Corporation
  
  await page.waitForTimeout(500); // Wait for price lists to load
  
  // Select product (Enterprise Laptop)
  const productSelect = await page.$('select');
  await productSelect.click();
  // Get all options
  const options = await page.$$eval('select option', opts => opts.map(o => ({ val: o.value, text: o.textContent })));
  console.log("Product Options:", options);
  
  const laptopOption = options.find(o => o.text.includes('Enterprise Laptop'));
  if (laptopOption) {
    await page.select('select', laptopOption.val);
  }
  
  await page.waitForTimeout(500);
  
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("PAGE TEXT AFTER SELECTION:", bodyText);
  
  await browser.close();
})();
