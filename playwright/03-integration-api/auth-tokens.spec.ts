/**
 * ============================================================================
 * FOLDER: playwright/03-integration-api/
 * ============================================================================
 * Taxonomy Category: 3. INTEGRATION AND API TESTING
 * Subcategory:       Authentication & Token Contracts
 *
 * ============================================================================
 * MODULE: playwright/03-integration-api/auth-tokens.spec.ts
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Tests API authorization middleware guards headlessly via HTTP calls:
 *   - Verifies missing `Authorization` header returns 401 Unauthorized with
 *     exact contract `{ error: "Unauthorized", message: "Valid token required" }`.
 *   - Verifies malformed or tampered token returns 401 Unauthorized.
 *
 * COMMUNICATES WITH:
 *   - Express middleware `authenticateToken` in `server/src/middleware/auth.ts`.
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. Unauthenticated HTTP request arrives at `/api/tickets`.
 *   2. `authenticateToken` middleware checks `req.headers.authorization`.
 *   3. If missing or invalid, blocks route execution and returns HTTP 401.
 * ============================================================================
 */

import { test, expect } from '../fixtures/base.fixture.js';

test.describe('3. Integration & API Testing › Authentication & Token Contracts', () => {
  test(
    'GET /api/tickets returns 401 Unauthorized when Authorization header is absent',
    { tag: ['@smoke', '@api', '@security'] },
    async ({ request }) => {
      // 1. Send request without any Authorization header
      const response = await request.get('/api/tickets');
      expect(response.status()).toBe(401);

      // 2. Validate error JSON shape
      const body = await response.json();
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'Valid token required',
      });
    }
  );

  test(
    'GET /api/tickets returns 401 Unauthorized when given a malformed token',
    { tag: ['@api', '@security', '@negative'] },
    async ({ request }) => {
      // 1. Send request with an invalid Bearer token
      const response = await request.get('/api/tickets', {
        headers: { Authorization: 'Bearer totally.invalid.tamperedtoken' },
      });

      // 2. Assert rejection
      expect(response.status()).toBe(401);
    }
  );
});
