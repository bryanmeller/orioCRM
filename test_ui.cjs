const puppeteer = require('puppeteer');

async function run() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  // Need to log in and test. This might be too complex for a script, 
  // but let's just make sure the dev server is running and the endpoints respond correctly.
  
  await browser.close();
}
run();
