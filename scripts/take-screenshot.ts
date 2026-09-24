import puppeteer from 'puppeteer-core';

const url = process.argv[2] || 'https://learn.dvlpid.my.id';
const outputPath = process.argv[3] || '/home/server/projects/flashlearn/screenshot.png';

console.log(`Opening ${url} to capture screenshot...`);

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--window-size=1280,900',
  ],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });
  await new Promise((r) => setTimeout(r, 1200));

  await page.screenshot({ path: outputPath, fullPage: false });
  console.log(`✓ Screenshot successfully saved to: ${outputPath}`);
} finally {
  await browser.close();
}
