import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 7_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:16666',
    browserName: 'webkit',
    headless: true,
    hasTouch: true,
    isMobile: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: 'pnpm dev --host 127.0.0.1',
    url: 'http://127.0.0.1:16666',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
