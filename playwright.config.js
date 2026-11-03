// Browser tests. `npm test` (or `make browser-test`) starts two servers:
// the repo itself on :8151, so core and component tests import the real
// source files, and `kit site serve` on :8152 for the site's own checks.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  reporter: [['list']],
  use: { trace: 'retain-on-failure' },
  webServer: [
    { command: 'python3 -m http.server 8151 --bind 127.0.0.1', url: 'http://127.0.0.1:8151/tests/harness.html', reuseExistingServer: true },
    { command: 'go build -o bin/kit ./cmd/kit && ./bin/kit site serve -addr 127.0.0.1:8152', url: 'http://127.0.0.1:8152/', reuseExistingServer: true, timeout: 120_000 },
  ],
  // Chromium locally. Firefox and WebKit join in CI (the plan's three
  // engines); install them with `npx playwright install firefox webkit`.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ...(process.env.KIT_ALL_BROWSERS ? [
      { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
      { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    ] : []),
  ],
});
