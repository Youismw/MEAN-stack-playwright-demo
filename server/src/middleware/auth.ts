import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid token required',
    });
    return;
  }

  const secret = process.env.JWT_SECRET || 'dev-only-secret-do-not-use-in-production';

  try {
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as { id: string; email: string };
    if (!decoded || !decoded.id || !Types.ObjectId.isValid(decoded.id)) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Valid token required',
      });
      return;
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid token required',
    });
  }
}
