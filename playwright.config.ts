import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config.
 *
 * The app is started with a deliberately unreachable Supabase URL so no test
 * can ever touch the real backend — every request is intercepted in
 * `e2e/support/mockSupabase.ts`.
 */
const PORT = 5173;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `bun run dev --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_SUPABASE_URL: 'http://127.0.0.1:54999',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'e2e-anon-key',
      VITE_SUPABASE_PROJECT_ID: 'e2e',
    },
  },
});
