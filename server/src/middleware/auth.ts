/**
 * ============================================================================
 * FOLDER: server/src/middleware/
 * ============================================================================
 * Middleware Layer: Contains reusable Express interceptor functions that execute
 * prior to route handlers to perform tasks like security checks, authentication,
 * logging, or request normalization.
 *
 * ============================================================================
 * MODULE: server/src/middleware/auth.ts (JWT Authentication Interceptor)
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Inspects incoming HTTP requests for a valid JSON Web Token (JWT) in the
 * `Authorization: Bearer <token>` header. It cryptographically verifies the
 * signature and expiration using `jsonwebtoken`, attaches the authenticated
 * user identity (`id`, `email`) to `req.user`, and calls `next()`.
 *
 * COMMUNICATES WITH:
 *   - Consumed by `server/src/routes/ticket.routes.ts` via `router.use(authenticateToken)`,
 *     protecting all ticket CRUD endpoints.
 *   - Issues tokens verified here originate from `server/src/routes/auth.routes.ts`.
 *   - Tested thoroughly by `server/src/middleware/auth.test.ts`.
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   - Scenario A: Valid Authenticated Request:
 *     1. Angular client calls `GET /api/tickets` with `Authorization: Bearer eyJ...`.
 *     2. `authenticateToken` extracts token substring after 'Bearer '.
 *     3. `jwt.verify()` confirms HMAC-SHA256 signature and that token is not expired.
 *     4. `req.user = { id: '000000000000000000000001', email: 'qa.user@quicktix.test' }`.
 *     5. Calls `next()` to proceed into the ticket route handler.
 *   - Scenario B: Unauthenticated / Expired Request:
 *     1. Request arrives with missing or manipulated token.
 *     2. `jwt.verify()` throws an error or token is null.
 *     3. Execution halts immediately; returns `HTTP 401 Unauthorized` JSON.
 *     4. Downstream route handlers are never executed.
 * ============================================================================
 */

import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';

// Extend Express Request interface to carry decoded user credentials safely
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * Express middleware to authenticate JSON Web Tokens.
 */
export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  // 1. Extract Authorization header from HTTP request
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;

  // 2. Reject immediately if token is missing or not formatted as Bearer
  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid token required',
    });
    return;
  }

  const secret = process.env.JWT_SECRET || 'dev-only-secret-do-not-use-in-production';

  try {
    // 3. Cryptographically verify signature and algorithms to mitigate algorithm-confusion attacks
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as { id: string; email: string };

    // 4. Validate that the payload contains a valid MongoDB ObjectId format
    if (!decoded || !decoded.id || !Types.ObjectId.isValid(decoded.id)) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Valid token required',
      });
      return;
    }

    // 5. Attach decoded identity to req.user for downstream route controllers
    req.user = decoded;
    next();
  } catch (err) {
    // 6. Token signature invalid, altered, or expired
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid token required',
    });
  }
}
