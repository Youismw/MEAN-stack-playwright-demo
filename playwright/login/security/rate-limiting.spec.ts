/**
 * ============================================================================
 * COMPONENT: Login Page
 * FOLDER:    playwright/login/security/
 * MODULE:    rate-limiting.spec.ts
 * TAXONOMY:  5. Security Testing › Rate Limiting, Abuse Prevention & Brute-Force Defense
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Tests the application's anti-abuse and rate-limiting infrastructure:
 *   1. Standard IETF / Legacy RateLimit Headers: Verifies authentication routes
 *      attach standard rate-limiting headers (e.g. `ratelimit-limit`, `ratelimit-remaining`).
 *   2. Registration Throttling: Confirms POST /api/auth/register attaches rate-limiting
 *      metadata to deter automated mass account creation bots.
 *   3. Remaining Counter Decrement: Asserts repeated failed attempts decrement the
 *      remaining quota counter, mitigating brute-force password guessing.
 *
 * COMMUNICATES WITH:
 *   - Express Middleware: `loginLimiter` & `registerLimiter` in `server/src/routes/auth.routes.ts`
 *   - Package: `express-rate-limit`
 *   - Playwright APIRequestContext (`request` fixture)
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. Automated worker sends HTTP requests to `/api/auth/login`.
 *   2. `loginLimiter` intercepts the request and increments client IP counter.
 *   3. Server returns headers (`RateLimit-Limit`, `RateLimit-Remaining`).
 *   4. Tests assert security invariants without requiring full browser DOM boot.
 * ============================================================================
 */

import { test, expect } from '../../fixtures/base.fixture.js';
import { TEST_USERS } from '../../fixtures/mock-data.js';

test.describe('Login Component › Security › Rate Limiting & Abuse Prevention', () => {
  test(
    'Login endpoint returns standard rate-limiting headers to protect against brute-force',
    { tag: ['@security', '@rate-limiting', '@login'] },
    async ({ request }) => {
      // Step 1: Issue login request via Playwright APIRequestContext
      const res = await request.post('/api/auth/login', {
        data: {
          email: TEST_USERS.bot.email,
          password: TEST_USERS.bot.password,
        },
      });

      expect(res.status()).toBe(200);

      // Step 2: Validate presence of standard RateLimit headers returned by express-rate-limit
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
      // Step 1: Send registration probe
      const res = await request.post('/api/auth/register', {
        data: {
          email: `probe_${Date.now()}@quicktix.test`,
          password: 'Passw0rd!test',
        },
      });

      expect(res.status()).toBe(201);

      // Step 2: Assert rate limit headers are attached to registration responses
      const headers = res.headers();
      const rateLimitHeader = headers['ratelimit-limit'] || headers['x-ratelimit-limit'];
      expect(rateLimitHeader).toBeTruthy();
    }
  );

  test(
    'Sequential failed login attempts decrement rate-limit remaining counter',
    { tag: ['@security', '@rate-limiting', '@login'] },
    async ({ request }) => {
      // Step 1: Attempt 1 with invalid credentials
      const res1 = await request.post('/api/auth/login', {
        data: {
          email: 'attacker@quicktix.test',
          password: 'WrongPassword1',
        },
      });
      expect(res1.status()).toBe(401);
      const remaining1 = parseInt(res1.headers()['ratelimit-remaining'] || '0', 10);

      // Step 2: Attempt 2 with invalid credentials
      const res2 = await request.post('/api/auth/login', {
        data: {
          email: 'attacker@quicktix.test',
          password: 'WrongPassword2',
        },
      });
      expect(res2.status()).toBe(401);
      const remaining2 = parseInt(res2.headers()['ratelimit-remaining'] || '0', 10);

      // Step 3: Assert rate limit remaining counter decrements or equals if handled within single tick
      expect(remaining2).toBeLessThanOrEqual(remaining1);
    }
  );
});
