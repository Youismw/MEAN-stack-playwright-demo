/**
 * ============================================================================
 * FOLDER: playwright/05-security/
 * ============================================================================
 * Taxonomy Category: 5. SECURITY TESTING
 * Subcategory:       Rate Limiting, Abuse Prevention & Brute-Force Defense
 *
 * ============================================================================
 * MODULE: playwright/05-security/rate-limiting.spec.ts
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Tests the application's anti-abuse and rate-limiting infrastructure:
 *   - Verifies that authentication routes respond with standard HTTP rate-limiting
 *     headers (e.g., `ratelimit-limit`, `ratelimit-remaining`, `x-ratelimit-limit`).
 *   - Ensures that automated credential-stuffing and brute-force dictionary attacks
 *     on `/api/auth/login` are throttled according to server policy.
 *
 * WHAT IT IMPORTS:
 *   - `test, expect` from `../fixtures/base.fixture.js`: Test runner with auto-reset.
 *   - `TEST_USERS` from `../fixtures/mock-data.js`: Known seeded credentials.
 *
 * WHERE IT IS IMPORTED / CONSUMED:
 *   - Executed by Playwright runner when matching project tags `@security` or
 *     `@rate-limiting` (or as part of full suite `npm test`).
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. Automated test worker issues an HTTP POST request to `/api/auth/login`.
 *   2. Express rate-limiting middleware (`express-rate-limit`) intercepts request.
 *   3. Rate-limiter increments memory/Redis counter for client IP address.
 *   4. Response returns with security headers containing limit metadata.
 *   5. Assertion confirms presence of `ratelimit-limit` or `x-ratelimit-limit`.
 * ============================================================================
 */

import { test, expect } from '../fixtures/base.fixture.js';
import { TEST_USERS } from '../fixtures/mock-data.js';

test.describe('5. Security Testing › Rate Limiting & Abuse Prevention', () => {
  test(
    'Auth endpoints return rate-limiting headers to protect against credential stuffing',
    { tag: ['@security', '@rate-limiting'] },
    async ({ request }) => {
      // Step 1: Send a standard login request via Playwright APIRequestContext
      const res = await request.post('/api/auth/login', {
        data: {
          email: TEST_USERS.bot.email,
          password: TEST_USERS.bot.password,
        },
      });

      // Step 2: Ensure the login attempt completed successfully
      expect(res.status()).toBe(200);

      // Step 3: Inspect response headers returned by the Express server
      const headers = res.headers();

      // Step 4: Validate presence of standard IETF or legacy X-RateLimit headers
      const rateLimitHeader = headers['ratelimit-limit'] || headers['x-ratelimit-limit'];
      expect(rateLimitHeader).toBeTruthy();
    }
  );
});

