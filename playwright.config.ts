import { defineConfig, devices } from '@playwright/test';

const testPort = process.env.TEST_PORT || '3001';
const testBaseUrl = `http://localhost:${testPort}`;

export default defineConfig({
  testDir: './playwright',
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
    baseURL: process.env.BASE_URL || testBaseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm start --prefix server',
    url: `${testBaseUrl}/api/health`,
    reuseExistingServer: !process.env.CI,
    env: {
      NODE_ENV: 'test',
      PORT: testPort,
      MONGO_USERS_URI: process.env.MONGO_USERS_URI || 'mongodb://localhost:27017/quicktix_users_test',
      MONGO_TICKETS_URI: process.env.MONGO_TICKETS_URI || 'mongodb://localhost:27018/quicktix_tickets_test',
      JWT_SECRET: process.env.JWT_SECRET || 'test-only-secret',
    },
  },
  projects: [
    {
      name: 'setup',
      testMatch: /00-setup\/auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'server-unit',
      testDir: './server/src',
      testMatch: '**/*.test.ts',
    },
  ],
});
