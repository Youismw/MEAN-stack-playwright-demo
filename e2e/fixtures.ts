import { test as baseTest, expect } from '@playwright/test';

export const test = baseTest.extend({
  autoReset: [
    async ({ request }, use) => {
      const res = await request.post('/api/test/reset');
      if (!res.ok()) {
        const text = await res.text();
        throw new Error(
          `Auto-reset failed with status ${res.status()}: ${text}. Is the server running in NODE_ENV=test against a *_test database?`
        );
      }
      const data = await res.json();
      expect(data.users).toContain('000000000000000000000001');
      await use();
    },
    { auto: true },
  ],
});

export { expect };
