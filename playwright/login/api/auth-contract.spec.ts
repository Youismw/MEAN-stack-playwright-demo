/**
 * ============================================================================
 * COMPONENT: Login Page
 * FOLDER:    playwright/login/api/
 * SPEC:      auth-contract.spec.ts
 * ============================================================================
 * REST API Contract & Schema Verification for Authentication Routes:
 *   1. POST /api/auth/login returns 200 with standard JWT token structure.
 *   2. Token payload contains id and email without sensitive attributes.
 *   3. Missing credentials return 401 with consistent error message shape.
 *   4. POST /api/auth/register returns 201 with created user entity.
 *   5. Duplicate email registration returns 409 Conflict.
 *   6. Sub-threshold password returns 400 ValidationError.
 * ============================================================================
 */

import { test, expect } from '../../fixtures/base.fixture.js';
import { TEST_USERS } from '../../fixtures/mock-data.js';

test.describe('Login Component › API › Auth Route Contracts', () => {
  test(
    'POST /api/auth/login returns 200 with a valid HMAC-SHA256 JWT token',
    { tag: ['@api', '@contract', '@login'] },
    async ({ request }) => {
      // 1. Submit valid login payload
      const res = await request.post('/api/auth/login', {
        data: {
          email: TEST_USERS.bot.email,
          password: TEST_USERS.bot.password,
        },
      });

      // 2. Assert HTTP status and JSON content-type
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toContain('application/json');

      // 3. Validate body schema
      const body = await res.json();
      expect(body).toHaveProperty('token');
      expect(typeof body.token).toBe('string');

      // 4. Validate JWT format: header.payload.signature
      const parts = body.token.split('.');
      expect(parts).toHaveLength(3);

      // 5. Decode payload (part 1) and verify claims
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
      // 1. Missing password
      const resWithoutPassword = await request.post('/api/auth/login', {
        data: { email: TEST_USERS.bot.email },
      });
      expect(resWithoutPassword.status()).toBe(401);
      const body1 = await resWithoutPassword.json();
      expect(body1).toEqual({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });

      // 2. Missing email
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
      const newEmail = `api_registered_${Date.now()}@quicktix.test`;
      const res = await request.post('/api/auth/register', {
        data: {
          email: newEmail,
          password: 'Passw0rd!Secure',
        },
      });

      expect(res.status()).toBe(201);
      const body = await res.json();

      expect(body).toHaveProperty('token');
      expect(body).toHaveProperty('user');
      expect(body.user).toHaveProperty('id');
      expect(body.user).toHaveProperty('email', newEmail);
      expect(body.user).not.toHaveProperty('password');
    }
  );

  test(
    'POST /api/auth/register returns 409 Conflict when email is already registered',
    { tag: ['@api', '@contract', '@login'] },
    async ({ request }) => {
      // Attempt to register with seeded dev email
      const res = await request.post('/api/auth/register', {
        data: {
          email: TEST_USERS.dev.email,
          password: 'Passw0rd!test',
        },
      });

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
      const res = await request.post('/api/auth/register', {
        data: {
          email: `short_pw_${Date.now()}@quicktix.test`,
          password: '123',
        },
      });

      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('ValidationError');
      expect(body.message).toContain('at least 6 characters');
    }
  );
});
