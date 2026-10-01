import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { authenticateToken } from './auth.js';

describe('Auth Middleware Unit Tests', () => {
  const secret = process.env.JWT_SECRET || 'dev-only-secret-do-not-use-in-production';

  it('should return 401 when Authorization header is missing', () => {
    let statusCode = 0;
    let jsonBody: any = null;

    const req: any = { headers: {} };
    const res: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(body: any) {
        jsonBody = body;
        return this;
      },
    };
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    authenticateToken(req, res, next);

    assert.equal(statusCode, 401);
    assert.deepEqual(jsonBody, {
      error: 'Unauthorized',
      message: 'Valid token required',
    });
    assert.equal(nextCalled, false);
  });

  it('should return 401 when Authorization header is not Bearer format', () => {
    let statusCode = 0;
    let jsonBody: any = null;

    const req: any = { headers: { authorization: 'Basic 12345' } };
    const res: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(body: any) {
        jsonBody = body;
        return this;
      },
    };
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    authenticateToken(req, res, next);

    assert.equal(statusCode, 401);
    assert.deepEqual(jsonBody, {
      error: 'Unauthorized',
      message: 'Valid token required',
    });
    assert.equal(nextCalled, false);
  });

  it('should return 401 when token is invalid or expired', () => {
    let statusCode = 0;
    let jsonBody: any = null;

    const req: any = { headers: { authorization: 'Bearer invalid.token.value' } };
    const res: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(body: any) {
        jsonBody = body;
        return this;
      },
    };
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    authenticateToken(req, res, next);

    assert.equal(statusCode, 401);
    assert.deepEqual(jsonBody, {
      error: 'Unauthorized',
      message: 'Valid token required',
    });
    assert.equal(nextCalled, false);
  });

  it('should attach user payload to req and call next for valid JWT', () => {
    const payload = { id: '000000000000000000000001', email: 'qa.user@quicktix.test' };
    const validToken = jwt.sign(payload, secret, { expiresIn: '1h' });

    const req: any = { headers: { authorization: `Bearer ${validToken}` } };
    const res: any = {};
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    authenticateToken(req, res, next);

    assert.equal(nextCalled, true);
    assert.equal(req.user.id, payload.id);
    assert.equal(req.user.email, payload.email);
  });
});
