import { defineConfig } from '@playwright/test';
import { config } from 'dotenv';
config();
export default defineConfig({
  testDir: './e2e',
  testMatch: 'admin-preview.spec.ts',
  timeout: 90000,
  workers: 1,
  use: {
    baseURL: process.env.ADMIN_PREVIEW_URL || 'http://localhost:3000',
    channel: process.env.BROWSER_CHANNEL,
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  reporter: 'list',
});
