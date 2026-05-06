/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 1. Point explicitly to the e2e folder
  testDir: './test/e2e',

  // 2. Ignore any files that are not E2E specs (just in case)
  testMatch: '**/*.spec.ts',

  // 3. General Settings
  timeout: 30 * 1000,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1, // Sequential execution for simplicity
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 4. Auto-start both backend API and Next.js app
  webServer: [
    {
      command: 'pnpm --filter api dev',
      url: 'http://localhost:4000',
      reuseExistingServer: true,
      timeout: 120 * 1000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'pnpm --filter web dev',
      url: 'http://localhost:3000',
      reuseExistingServer: true, // Allow running against existing dev server
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});