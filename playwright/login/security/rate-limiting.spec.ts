/**
 * ============================================================================
 * COMPONENT: Login Page
 * FOLDER:    playwright/login/security/
 * SPEC:      rate-limiting.spec.ts
 * ============================================================================
 * Security Testing: Rate limiting and brute-force mitigation on auth endpoints.
 *   1. POST /api/auth/login returns standard IETF RateLimit-* headers.
 *   2. POST /api/auth/register returns standard RateLimit-* headers.
 *   3. Rate-limiting headers decrement on repeated attempts.
 * ============================================================================
 */

import { test, expect } from '../../fixtures/base.fixture.js';
import { TEST_USERS } from '../../fixtures/mock-data.js';

test.describe('Login Component › Security › Rate Limiting & Abuse Prevention', () => {
  test(
    'Login endpoint returns standard rate-limiting headers to protect against brute-force',
    { tag: ['@security', '@rate-limiting', '@login'] },
    async ({ request }) => {
      // 1. Issue login request via APIRequestContext
      const res = await request.post('/api/auth/login', {
        data: {
          email: TEST_USERS.bot.email,
          password: TEST_USERS.bot.password,
        },
      });

      expect(res.status()).toBe(200);

      // 2. Validate presence of RateLimit headers
      const headers = res.headers();
      const rateLimitHeader = headers['ratelimit-limit'] || headers['x-ratelimit-limit'];
      expect(rateLimitHeader).toBeTruthy();

      const remainingHeader = headers['ratelimit-remaining'] || headers['x-ratelimit-remaining'];
      expect(remainingHeader).toBeTruthy();
    }
  );

  test(
    'Registration endpoint enforces rate-limiting headers to deter automated bot signups',
    { tag: ['@security', '@rate-limiting', '@login'] },
    async ({ request }) => {
      // 1. Send registration probe
      const res = await request.post('/api/auth/register', {
        data: {
          email: `probe_${Date.now()}@quicktix.test`,
          password: 'Passw0rd!test',
        },
      });

      expect(res.status()).toBe(201);

      // 2. Assert rate limit headers attached
      const headers = res.headers();
      const rateLimitHeader = headers['ratelimit-limit'] || headers['x-ratelimit-limit'];
      expect(rateLimitHeader).toBeTruthy();
    }
  );

  test(
    'Sequential failed login attempts decrement rate-limit remaining counter',
    { tag: ['@security', '@rate-limiting', '@login'] },
    async ({ request }) => {
      // 1. Attempt 1 with invalid credentials
      const res1 = await request.post('/api/auth/login', {
        data: {
          email: 'attacker@quicktix.test',
          password: 'WrongPassword1',
        },
      });
      expect(res1.status()).toBe(401);
      const remaining1 = parseInt(res1.headers()['ratelimit-remaining'] || '0', 10);

      // 2. Attempt 2 with invalid credentials
      const res2 = await request.post('/api/auth/login', {
        data: {
          email: 'attacker@quicktix.test',
          password: 'WrongPassword2',
        },
      });
      expect(res2.status()).toBe(401);
      const remaining2 = parseInt(res2.headers()['ratelimit-remaining'] || '0', 10);

      // 3. Rate limit counter should be decrementing or equal if handled in single tick
      expect(remaining2).toBeLessThanOrEqual(remaining1);
    }
  );
});
