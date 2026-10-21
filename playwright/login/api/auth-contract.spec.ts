/**
 * ============================================================================
 * COMPONENT: Login Page
 * FOLDER:    playwright/login/api/
 * MODULE:    auth-contract.spec.ts
 * TAXONOMY:  3. Integration & API Testing › REST API Contracts & Schema Validation
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Exercises Express REST endpoints headlessly via Playwright APIRequestContext,
 * validating payload shapes, response headers, and status code contracts:
 *   1. POST /api/auth/login: Validates HTTP 200, Content-Type application/json,
 *      and standard 3-part HMAC-SHA256 JWT format encoding user id and email.
 *   2. Missing Credentials: Confirms omission of email or password yields HTTP 401
 *      with standardized `{ error: 'Unauthorized', message: '...' }` JSON.
 *   3. POST /api/auth/register: Validates HTTP 201 status and JSON token receipt.
 *   4. Duplicate Registration: Verifies existing emails trigger HTTP 409 Conflict.
 *   5. Short Password Validation: Verifies passwords < 6 chars return HTTP 400.
 *
 * COMMUNICATES WITH:
 *   - Express Routes: `server/src/routes/auth.routes.ts`
 *   - Database Models: `server/src/models/User.ts`
 *   - Security Standards: HS256 JWT structure and HTTP status code RFCs
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. Playwright sends HTTP POST requests directly to backend on testPort.
 *   2. Express router validates schemas and executes database operations.
 *   3. Responses return JSON payloads with security headers.
 *   4. Assertions verify payload structures against CONTRACT.md specifications.
 * ============================================================================
 */

import { test, expect } from '../../fixtures/base.fixture.js';
import { TEST_USERS } from '../../fixtures/mock-data.js';

test.describe('Login Component › API › Auth Route Contracts', () => {
  test(
    'POST /api/auth/login returns 200 with a valid HMAC-SHA256 JWT token',
    { tag: ['@api', '@contract', '@login'] },
    async ({ request }) => {
      // Step 1: Submit valid login payload via APIRequestContext
      const res = await request.post('/api/auth/login', {
        data: {
          email: TEST_USERS.bot.email,
          password: TEST_USERS.bot.password,
        },
      });

      // Step 2: Assert HTTP status 200 and JSON content-type
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toContain('application/json');

      // Step 3: Validate body schema contains string token
      const body = await res.json();
      expect(body).toHaveProperty('token');
      expect(typeof body.token).toBe('string');

      // Step 4: Validate standard JWT structure: header.payload.signature
      const parts = body.token.split('.');
      expect(parts).toHaveLength(3);

      // Step 5: Decode payload segment and verify claims without sensitive leaks
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      expect(payload).toHaveProperty('id');
      expect(payload).toHaveProperty('email', TEST_USERS.bot.email);
      expect(payload).toHaveProperty('iat');
      expect(payload).toHaveProperty('exp');
      expect(payload).not.toHaveProperty('password');
    }
  );

  test(
    'POST /api/auth/login returns 401 when email or password is missing',
    { tag: ['@api', '@contract', '@login'] },
    async ({ request }) => {
      // Step 1: Request with missing password
      const resWithoutPassword = await request.post('/api/auth/login', {
        data: { email: TEST_USERS.bot.email },
      });
      expect(resWithoutPassword.status()).toBe(401);
      const body1 = await resWithoutPassword.json();
      expect(body1).toEqual({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });

      // Step 2: Request with missing email
      const resWithoutEmail = await request.post('/api/auth/login', {
        data: { password: TEST_USERS.bot.password },
      });
      expect(resWithoutEmail.status()).toBe(401);
      const body2 = await resWithoutEmail.json();
      expect(body2).toEqual({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }
  );

  test(
    'POST /api/auth/register creates user and returns 201 with JWT token',
    { tag: ['@api', '@contract', '@login'] },
    async ({ request }) => {
      // Step 1: Submit new user registration payload with unique email
      const newEmail = `api_registered_${Date.now()}@quicktix.test`;
      const res = await request.post('/api/auth/register', {
        data: {
          email: newEmail,
          password: 'Passw0rd!Secure',
        },
      });

      // Step 2: Assert HTTP 201 Created and response message
      expect(res.status()).toBe(201);
      const body = await res.json();

      expect(body).toHaveProperty('token');
      expect(body).toHaveProperty('message');
      expect(body.message).toContain('Account created successfully');
    }
  );

  test(
    'POST /api/auth/register returns 409 Conflict when email is already registered',
    { tag: ['@api', '@contract', '@login'] },
    async ({ request }) => {
      // Step 1: Attempt to register with existing seeded dev user email
      const res = await request.post('/api/auth/register', {
        data: {
          email: TEST_USERS.dev.email,
          password: 'Passw0rd!test',
        },
      });

      // Step 2: Assert HTTP 409 Conflict status and error shape
      expect(res.status()).toBe(409);
      const body = await res.json();
      expect(body.error).toBe('Conflict');
      expect(body.message).toContain('already exists');
    }
  );

  test(
    'POST /api/auth/register returns 400 when password is under 6 characters',
    { tag: ['@api', '@contract', '@login'] },
    async ({ request }) => {
      // Step 1: Attempt registration with a 3-character password
      const res = await request.post('/api/auth/register', {
        data: {
          email: `short_pw_${Date.now()}@quicktix.test`,
          password: '123',
        },
      });

      // Step 2: Assert HTTP 400 ValidationError status and descriptive message
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('ValidationError');
      expect(body.message).toContain('at least 6 characters');
    }
  );
});
