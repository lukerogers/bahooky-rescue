import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const systemChrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const executablePath = process.env.BROWSER_PATH || (existsSync(systemChrome) ? systemChrome : undefined);

export default defineConfig({
  testDir: './tests/browser',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    browserName: 'chromium',
    launchOptions: { ...(executablePath ? { executablePath } : {}) },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 1000 }, hasTouch: true } },
    { name: 'touch-phone', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
    {
      name: 'ipad-webkit',
      testMatch: '**/tablet.spec.js',
      use: {
        browserName: 'webkit', launchOptions: {},
        viewport: { width: 768, height: 1024 },
        isMobile: true, hasTouch: true, deviceScaleFactor: 2,
      },
    },
  ],
  webServer: {
    command: 'npm start',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 20_000,
  },
});
