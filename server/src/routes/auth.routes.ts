import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid email or password',
    });
    return;
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
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
      { expiresIn: '24h' }
    );

    res.status(200).json({ token });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

export const authRouter = router;
