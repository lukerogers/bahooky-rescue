// Run only when changing the artwork; generated PNGs are committed for deployment.
import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const systemChrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const executablePath = process.env.BROWSER_PATH || (existsSync(systemChrome) ? systemChrome : undefined);
const browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}) });
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const svg = await readFile(new URL('../assets/icon.svg', import.meta.url), 'utf8');
  for (const [size, name] of [[180, 'apple-touch-icon'], [192, 'icon-192'], [512, 'icon-512']]) {
    await page.setViewportSize({ width: size, height: size });
    // Opaque, square artwork: iPadOS supplies its own rounded Home Screen mask.
    await page.setContent(`<style>html,body{margin:0;background:#ffc65b}svg{display:block;width:100vw;height:100vh}</style>${svg}`);
    await page.screenshot({ path: fileURLToPath(new URL(`../assets/${name}.png`, import.meta.url)) });
  }
} finally {
  await browser.close();
}
