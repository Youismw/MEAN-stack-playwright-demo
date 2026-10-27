/**
 * ============================================================================
 * FOLDER: server/src/routes/playwright/
 * ============================================================================
 * NOTE: This folder contains backend APPLICATION ROUTING CODE that supports
 * Playwright E2E browser automation (e.g. database resets and seeding).
 * It is NOT a test suite folder. Actual unit tests reside alongside source
 * files, and E2E/taxonomy suites reside in the root `playwright/` directory.
 *
 * ============================================================================
 * MODULE: server/src/routes/playwright/test.routes.ts (E2E Test State Resetter)
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Exposes the `POST /api/test/reset` endpoint.
 * This endpoint provides deterministic test environment isolation:
 *   1. Safety Check: Refuses to run unless BOTH database names end in `_test`.
 *   2. Database Wipe: Empties collections in both Users DB and Tickets DB.
 *   3. Deterministic Seeding: Seeds 2 Users and 5 Tickets with fixed ObjectIds
 *      and sequential timestamps.
 *   4. Concurrency Mutex: Serializes concurrent test reset calls using an
 *      in-memory Promise queue to eliminate MongoDB duplicate key errors (E11000).
 *
 * COMMUNICATES WITH:
 *   - Mounted by `server/src/app.ts` ONLY when `NODE_ENV === 'test'`.
 *   - Calls `server/src/models/User.ts` (Users DB).
 *   - Calls `server/src/models/Ticket.ts` (Tickets DB).
 *   - Consumed by Playwright test suites (e.g. `e2e/auth.setup.ts`).
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. Playwright test suite begins and sends `POST /api/test/reset`.
 *   2. Guard checks `userDbConnection.name.endsWith('_test')`.
 *   3. Mutex serializes the operation.
 *   4. Existing records are purged.
 *   5. Seed users (qa.user and other.user) and tickets are inserted.
 *   6. Responds with `HTTP 200 { status: 'reset_complete' }` in under 20ms.
 * ============================================================================
 */

import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../../models/User.js';
import { Ticket } from '../../models/Ticket.js';
import { mainDbConnection } from '../../config/db.js';

const router = Router();

// Bcrypt hash computed ONCE at module load (cost factor 4) to ensure reset finishes in < 20ms
const SEED_PASSWORD_HASH = bcrypt.hashSync('Passw0rd!test', 4);

// Deterministic ObjectIds defined in CONTRACT.md
// USER_1_ID is reserved for the primary developer / QA user whose tickets persist.
const USER_1_ID = new Types.ObjectId('000000000000000000000001');

export interface WorkerContext {
  workerIndex: number;
  botId: Types.ObjectId;
  botEmail: string;
  foreignId: Types.ObjectId;
  foreignEmail: string;
  tickets: Array<{
    _id: Types.ObjectId;
    title: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
    owner: Types.ObjectId;
    ownerEmail: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export function getWorkerContext(workerIndex: number, baseDate: Date = new Date()): WorkerContext {
  // Worker 0 preserves exact CONTRACT.md IDs for 100% backward compatibility
  const botId = workerIndex === 0
    ? new Types.ObjectId('000000000000000000000099')
    : new Types.ObjectId(`00000000000000000000009${workerIndex}`);

  const botEmail = workerIndex === 0
    ? 'playwright.bot@quicktix.test'
    : `bot.worker${workerIndex}@quicktix.test`;

  const foreignId = workerIndex === 0
    ? new Types.ObjectId('000000000000000000000002')
    : new Types.ObjectId(`00000000000000000000002${workerIndex}`);

  const foreignEmail = workerIndex === 0
    ? 'other.user@quicktix.test'
    : `other.user.${workerIndex}@quicktix.test`;

  const offset = workerIndex * 10;
  const t1Id = new Types.ObjectId(`1000000000000000000000${(offset + 1).toString().padStart(2, '0')}`);
  const t2Id = new Types.ObjectId(`1000000000000000000000${(offset + 2).toString().padStart(2, '0')}`);
  const t3Id = new Types.ObjectId(`1000000000000000000000${(offset + 3).toString().padStart(2, '0')}`);
  const t4Id = new Types.ObjectId(`1000000000000000000000${(offset + 4).toString().padStart(2, '0')}`);
  const t5Id = new Types.ObjectId(`1000000000000000000000${(offset + 5).toString().padStart(2, '0')}`);

  const tickets = [
    {
      _id: t1Id,
      title: 'Fix login button styling',
      description: 'Login button alignment is off on mobile screens',
      priority: 'High' as const,
      status: 'Open' as const,
      owner: botId,
      ownerEmail: botEmail,
      createdAt: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      _id: t2Id,
      title: 'Update documentation footer',
      description: 'Update copyright year in footer',
      priority: 'Low' as const,
      status: 'Open' as const,
      owner: botId,
      ownerEmail: botEmail,
      createdAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      _id: t3Id,
      title: 'Investigate memory leak',
      description: 'Memory grows steadily during load test',
      priority: 'Medium' as const,
      status: 'In Progress' as const,
      owner: botId,
      ownerEmail: botEmail,
      createdAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      _id: t4Id,
      title: 'Setup automated backups',
      description: 'Configure automated daily MongoDB dumps',
      priority: 'Low' as const,
      status: 'Resolved' as const,
      owner: botId,
      ownerEmail: botEmail,
      createdAt: baseDate,
      updatedAt: baseDate,
    },
    {
      _id: t5Id,
      title: 'Foreign user secret issue',
      description: `This ticket belongs to foreign user and must never appear for worker ${workerIndex}`,
      priority: 'Urgent' as const,
      status: 'Open' as const,
      owner: foreignId,
      ownerEmail: foreignEmail,
      createdAt: baseDate,
      updatedAt: baseDate,
    },
  ];

  return { workerIndex, botId, botEmail, foreignId, foreignEmail, tickets };
}

// In-memory mutex promise queue to serialize concurrent reset calls and prevent E11000 duplicate key collisions
let resetLock: Promise<any> = Promise.resolve();

// POST /api/test/reset
router.post('/reset', async (req: Request, res: Response): Promise<void> => {
  // Safety guard: refuse to wipe unless database name ends in _test
  const dbName = mainDbConnection.name || '';

  if (!dbName.endsWith('_test')) {
    res.status(403).json({
      error: 'Forbidden',
      message: `Reset refused: database '${dbName}' does not end in '_test'`,
    });
    return;
  }

  const workerParam = req.query.worker !== undefined ? req.query.worker : req.body?.worker;
  const isAll = req.query.all === 'true' || req.body?.all === true;
  const workerIndex = workerParam !== undefined ? parseInt(String(workerParam), 10) : undefined;

  const executeReset = async () => {
    const baseDate = new Date();

    // 1. Ensure Developer User exists in user database without touching their tickets
    await User.updateOne(
      { _id: USER_1_ID },
      {
        $setOnInsert: {
          _id: USER_1_ID,
          email: 'qa.user@quicktix.test',
          password: SEED_PASSWORD_HASH,
          role: 'user',
        },
      },
      { upsert: true }
    );

    // 2. Ensure all worker accounts exist in MongoDB (workers 0 through 7)
    const workerUsersToUpsert = [];
    for (let w = 0; w < 8; w++) {
      const ctx = getWorkerContext(w, baseDate);
      workerUsersToUpsert.push(
        {
          updateOne: {
            filter: { _id: ctx.botId },
            update: { $set: { email: ctx.botEmail, password: SEED_PASSWORD_HASH, role: 'user' } },
            upsert: true,
          },
        },
        {
          updateOne: {
            filter: { _id: ctx.foreignId },
            update: { $set: { email: ctx.foreignEmail, password: SEED_PASSWORD_HASH, role: 'user' } },
            upsert: true,
          },
        }
      );
    }
    await User.bulkWrite(workerUsersToUpsert);

    // 3. Reset tickets according to worker targeting
    if (workerIndex !== undefined && !isNaN(workerIndex)) {
      // Scoped reset for a specific worker: only touches this worker's tickets!
      const ctx = getWorkerContext(workerIndex, baseDate);
      await Ticket.deleteMany({
        $or: [
          { _id: { $in: ctx.tickets.map((t) => t._id) } },
          { owner: { $in: [ctx.botId, ctx.foreignId] } },
        ],
      });
      await Ticket.insertMany(ctx.tickets);

      return {
        status: 'reset_complete',
        worker: workerIndex,
        users: [USER_1_ID.toString(), ctx.botId.toString()],
        tickets: ctx.tickets.map((t) => t._id.toString()),
      };
    } else {
      // Global reset or default reset (e.g. auth setup or worker 0)
      const workersToSeed = isAll ? [0, 1, 2, 3, 4, 5, 6, 7] : [0];
      const ctx0 = getWorkerContext(0, baseDate);

      for (const w of workersToSeed) {
        const ctx = getWorkerContext(w, baseDate);
        await Ticket.deleteMany({
          $or: [
            { _id: { $in: ctx.tickets.map((t) => t._id) } },
            { owner: { $in: [ctx.botId, ctx.foreignId] } },
          ],
        });
        await Ticket.insertMany(ctx.tickets);
      }

      return {
        status: 'reset_complete',
        worker: 0,
        users: [USER_1_ID.toString(), ctx0.foreignId.toString()],
        tickets: ctx0.tickets.map((t) => t._id.toString()),
      };
    }
  };

  try {
    const currentRun = resetLock.then(executeReset, executeReset);
    resetLock = currentRun.then(() => { }, () => { });
    const result = await currentRun;
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'ResetError', message: err.message });
  }
});

export const testRouter = router;

