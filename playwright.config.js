import { defineConfig, devices } from '@playwright/test'

// WebKit with an iPhone profile is the closest thing to iOS Safari that runs on a desktop.
export default defineConfig({
  testDir: 'tests/e2e',
  // recap.spec renders sample images; heavy, so only on request (npm run test:recaps)
  testIgnore: process.env.RECAPS ? [] : ['**/recap.spec.js'],
  fullyParallel: true,
  workers: 4, // more parallel WebKit instances than this time out on a laptop
  reporter: 'list',
  use: { baseURL: 'http://localhost:5179', trace: 'retain-on-failure' },
  projects: [
    { name: 'iphone-webkit', use: { ...devices['iPhone 15'] } },
    { name: 'iphone-chromium', use: { ...devices['iPhone 15'], browserName: 'chromium' } },
  ],
  // the built app, service worker included: what the phone actually runs
  webServer: { command: 'npx vite build && npx vite preview --port 5179 --strictPort', url: 'http://localhost:5179', reuseExistingServer: false, timeout: 180_000 },
})
