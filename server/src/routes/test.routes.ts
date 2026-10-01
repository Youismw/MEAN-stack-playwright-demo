import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Ticket } from '../models/Ticket.js';
import { userDbConnection, ticketDbConnection } from '../db.js';

const router = Router();

// Bcrypt hash computed ONCE at module load (cost factor 4) to ensure reset finishes in < 20ms
const SEED_PASSWORD_HASH = bcrypt.hashSync('Passw0rd!test', 4);

const USER_1_ID = new Types.ObjectId('000000000000000000000001');
const USER_2_ID = new Types.ObjectId('000000000000000000000002');

const TICKET_1_ID = new Types.ObjectId('100000000000000000000001');
const TICKET_2_ID = new Types.ObjectId('100000000000000000000002');
const TICKET_3_ID = new Types.ObjectId('100000000000000000000003');
const TICKET_4_ID = new Types.ObjectId('100000000000000000000004');
const TICKET_5_ID = new Types.ObjectId('100000000000000000000005');

router.post('/reset', async (_req: Request, res: Response): Promise<void> => {
  // Safety guard: refuse to wipe unless both database names end in _test
  const userDbName = userDbConnection.name || '';
  const ticketDbName = ticketDbConnection.name || '';

  if (!userDbName.endsWith('_test') || !ticketDbName.endsWith('_test')) {
    res.status(403).json({
      error: 'Forbidden',
      message: `Reset refused: database '${userDbName}' or '${ticketDbName}' does not end in '_test'`,
    });
    return;
  }

  try {
    // 1. Wipe collections across separated databases
    await User.deleteMany({});
    await Ticket.deleteMany({});

    // 2. Seed Users into user database
    const users = [
      {
        _id: USER_1_ID,
        email: 'qa.user@quicktix.test',
        password: SEED_PASSWORD_HASH,
        role: 'user',
      },
      {
        _id: USER_2_ID,
        email: 'other.user@quicktix.test',
        password: SEED_PASSWORD_HASH,
        role: 'user',
      },
    ];
    await User.insertMany(users);

    // 3. Seed Tickets into backend/tickets database (fixed timestamps 1 day apart for deterministic sort order)
    const baseDate = new Date();
    const tickets = [
      {
        _id: TICKET_1_ID,
        title: 'Fix login button styling',
        description: 'Login button alignment is off on mobile screens',
        priority: 'High',
        status: 'Open',
        owner: USER_1_ID,
        createdAt: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        _id: TICKET_2_ID,
        title: 'Update documentation footer',
        description: 'Update copyright year in footer',
        priority: 'Low',
        status: 'Open',
        owner: USER_1_ID,
        createdAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        _id: TICKET_3_ID,
        title: 'Investigate memory leak',
        description: 'Memory grows steadily during load test',
        priority: 'Medium',
        status: 'In Progress',
        owner: USER_1_ID,
        createdAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        _id: TICKET_4_ID,
        title: 'Setup automated backups',
        description: 'Configure automated daily MongoDB dumps',
        priority: 'Low',
        status: 'Resolved',
        owner: USER_1_ID,
        createdAt: baseDate,
        updatedAt: baseDate,
      },
      {
        _id: TICKET_5_ID,
        title: 'Foreign user secret issue',
        description: 'This ticket belongs to User 2 and must never appear for User 1',
        priority: 'Urgent',
        status: 'Open',
        owner: USER_2_ID,
        createdAt: baseDate,
        updatedAt: baseDate,
      },
    ];
    await Ticket.insertMany(tickets);

    res.status(200).json({
      status: 'reset_complete',
      users: users.map((u) => u._id.toString()),
      tickets: tickets.map((t) => t._id.toString()),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'ResetError', message: err.message });
  }
});

export const testRouter = router;
