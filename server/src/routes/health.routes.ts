import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/health', (_req: Request, res: Response): void => {
  const isMongoConnected = mongoose.connection.readyState === 1;

  if (isMongoConnected) {
    res.status(200).json({ status: 'ok', mongo: 'connected' });
  } else {
    res.status(503).json({ status: 'error', mongo: 'disconnected' });
  }
});

export const healthRouter = router;
