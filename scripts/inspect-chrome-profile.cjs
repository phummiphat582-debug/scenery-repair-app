const puppeteer = require('puppeteer-core');
const path = require('path');
const os = require('os');

async function inspectLocalChrome() {
  const chromeUserData = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
  console.log('Inspecting Chrome user data at:', chromeUserData);

  let browser;
  try {
    // Launch Chrome with the user data dir (or a copy) to inspect localStorage
    browser = await puppeteer.launch({
      headless: true,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        `--user-data-dir=${chromeUserData}`
      ]
    });

    const page = await browser.newPage();
    await page.goto('https://phummiphat582-debug.github.io/scenery-repair-app/', {
      waitUntil: 'networkidle2',
      timeout: 20000
    });

    const storage = await page.evaluate(async () => {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        keys.push({ key: k, value: localStorage.getItem(k) });
      }
      return keys;
    });

    console.log('Found localStorage keys in user Chrome:', storage.map(s => s.key));
    storage.forEach(s => {
      if (s.key && s.key.includes('tickets')) {
        try {
          const parsed = JSON.parse(s.value);
          console.log(`\nKey: ${s.key} has ${parsed.length} tickets:`);
          parsed.forEach((t) => {
            console.log(`- ${t.requestId || t.id} | ${t.created_at || t.createdAt} | ${t.department} | ${t.title}`);
          });
        } catch {}
      }
    });

    await browser.close();
  } catch (e) {
    console.log('Error inspecting Chrome profile directly (may be in use):', e.message);
  }
}

inspectLocalChrome();
