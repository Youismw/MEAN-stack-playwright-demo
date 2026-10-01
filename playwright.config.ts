import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'results/junit.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm start --prefix server',
    url: 'http://localhost:3000/api/health',
    reuseExistingServer: !process.env.CI,
    env: {
      NODE_ENV: 'test',
      PORT: '3000',
      MONGO_USERS_URI: process.env.MONGO_USERS_URI || 'mongodb://localhost:27017/quicktix_users_test',
      MONGO_TICKETS_URI: process.env.MONGO_TICKETS_URI || 'mongodb://localhost:27017/quicktix_tickets_test',
      MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/quicktix_test',
      JWT_SECRET: process.env.JWT_SECRET || 'test-only-secret',
    },
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
