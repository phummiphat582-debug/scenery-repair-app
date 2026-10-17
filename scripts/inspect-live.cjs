const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  page.on('console', (message) => console.log(`[PAGE CONSOLE] ${message.type()}: ${message.text()}`));
  page.on('pageerror', (error) => console.log(`[PAGE ERROR] ${error.message}`));
  page.on('requestfailed', (request) => console.log(`[REQ FAIL] ${request.url()} ${request.failure()?.errorText || ''}`));
  page.on('response', (response) => {
    if (response.status() >= 400) console.log(`[HTTP ${response.status()}] ${response.url()}`);
  });

  console.log('Navigating to live app...');
  await page.goto('https://phummiphat582-debug.github.io/scenery-repair-app/', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  await new Promise((resolve) => setTimeout(resolve, 3000));

  const ticketsInStorage = await page.evaluate(() => {
    return {
      tickets: localStorage.getItem('scenery_repair_v5_tickets'),
      completedRegistry: localStorage.getItem('scenery_repair_v5_completed_registry'),
      userRole: localStorage.getItem('scenery_user_role'),
      selectedDept: localStorage.getItem('scenery_selected_dept')
    };
  });

  console.log('Tickets in localStorage on live app:', ticketsInStorage.tickets ? JSON.parse(ticketsInStorage.tickets).length : 0);
  console.log('Completed registry:', ticketsInStorage.completedRegistry);

  await browser.close();
})().catch(console.error);
