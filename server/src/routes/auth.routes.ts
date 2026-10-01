import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User.js';

const router = Router();

// Constant precomputed dummy hash to mitigate timing attacks and user enumeration
const DUMMY_HASH = bcrypt.hashSync('timing_mitigation_dummy_password', 10);

const isTest = (process.env.NODE_ENV || '').toLowerCase() === 'test';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: isTest ? 1000 : 10, // Max 10 attempts in production/dev, relaxed for automated tests
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
  },
});

router.post('/login', loginLimiter, async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid email or password',
    });
    return;
  }

  try {
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanPassword = typeof password === 'string' ? password.trim() : '';

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      // Execute constant-time dummy hash comparison to eliminate timing-based user enumeration
      await bcrypt.compare(cleanPassword, DUMMY_HASH);
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
      return;
    }

    const isMatch = await bcrypt.compare(cleanPassword, user.password);

    if (!isMatch) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
      return;
    }

    const secret = process.env.JWT_SECRET || 'dev-only-secret-do-not-use-in-production';
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      secret,
      { algorithm: 'HS256', expiresIn: '24h' }
    );

    res.status(200).json({ token });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

export const authRouter = router;
