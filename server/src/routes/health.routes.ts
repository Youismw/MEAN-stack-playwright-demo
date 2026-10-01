import { Router, Request, Response } from 'express';
import { userDbConnection, ticketDbConnection } from '../db.js';

const router = Router();

router.get('/health', (_req: Request, res: Response): void => {
  const isUserDbConnected = userDbConnection.readyState === 1;
  const isTicketDbConnected = ticketDbConnection.readyState === 1;
  const isMongoConnected = isUserDbConnected && isTicketDbConnected;

  if (isMongoConnected) {
    res.status(200).json({ status: 'ok', mongo: 'connected' });
  } else {
    res.status(503).json({
      status: 'error',
      mongo: 'disconnected',
      details: {
        usersDb: isUserDbConnected ? 'connected' : 'disconnected',
        ticketsDb: isTicketDbConnected ? 'connected' : 'disconnected',
      },
    });
  }
});

export const healthRouter = router;
