import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5173', headless: true },
  webServer: [{ command: 'npm run dev:api', url: 'http://127.0.0.1:3000/api/health', reuseExistingServer: !process.env.CI, timeout: 60000 }, { command: 'npm run dev:web', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI, timeout: 60000 }]
});
