/**
 * ============================================================================
 * FOLDER: server/src/routes/
 * ============================================================================
 * Routing Layer: Defines HTTP endpoints, attaches endpoint-specific middleware,
 * executes controller business logic, and serializes JSON responses.
 *
 * ============================================================================
 * MODULE: server/src/routes/ticket.routes.ts (Support Ticket CRUD Controller)
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Exposes RESTful CRUD endpoints for support tickets:
 *   - `GET /api/tickets?status=` -> List user's tickets (with status filter)
 *   - `GET /api/tickets/:id`     -> Retrieve single ticket by ID
 *   - `POST /api/tickets`        -> Create a new support ticket
 *   - `PUT /api/tickets/:id`     -> Update an existing support ticket
 *   - `DELETE /api/tickets/:id`  -> Delete an existing support ticket
 *
 * ARCHITECTURAL INVARIANTS & SECURITY:
 *   1. All routes are protected by `router.use(authenticateToken)`.
 *   2. Strict Owner Scoping: Every query enforces `owner: req.user.id`.
 *      Attempting to read, edit, or delete another user's ticket returns
 *      `404 Not Found` (never 403, preventing resource enumeration).
 *   3. Strict Input Validation: Rejects invalid titles (<3 or >100 chars),
 *      descriptions (>500 chars), and invalid priority/status enum values with 400.
 *
 * COMMUNICATES WITH:
 *   - `server/src/middleware/auth.ts`: Uses `authenticateToken` to populate `req.user`.
 *   - `server/src/models/Ticket.ts`: Performs CRUD on MongoDB Tickets DB (port 27018).
 *   - `client/src/app/services/ticket.service.ts`: Backend for all client ticket calls.
 * ============================================================================
 */

import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { Ticket, TicketPriority, TicketStatus } from '../models/Ticket.js';
import { AuthRequest, authenticateToken } from '../middleware/auth.js';

const router = Router();

// Apply authentication middleware to EVERY route defined in this router module
router.use(authenticateToken);

const VALID_PRIORITIES: TicketPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
const VALID_STATUSES: TicketStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];
const MAX_TICKETS_LIMIT = 1000;

// Helper to normalize Express URL params
function extractParamId(param: string | string[] | undefined): string {
  if (!param) return '';
  return Array.isArray(param) ? param[0] : param;
}

// ----------------------------------------------------------------------------
// GET /api/tickets?status= (List User's Tickets)
// ----------------------------------------------------------------------------
// Hypothetical run: Angular TicketListComponent loads tickets.
// Interceptor provides token -> req.user populated -> queries Ticket DB filtered by owner.
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = new Types.ObjectId(req.user!.id);
    const filter: any = { owner: ownerId };

    // Apply optional status query filter (?status=Open)
    if (req.query.status !== undefined && typeof req.query.status === 'string') {
      const statusQuery = req.query.status.trim();
      if (statusQuery !== '' && statusQuery !== 'All') {
        if (!VALID_STATUSES.includes(statusQuery as TicketStatus)) {
          res.status(400).json({
            error: 'ValidationError',
            message: 'Status must be Open, In Progress, Resolved, or Closed',
          });
          return;
        }
        filter.status = statusQuery;
      }
    }

    const tickets = await Ticket.find(filter).sort({ createdAt: -1 }).limit(MAX_TICKETS_LIMIT);
    res.status(200).json(tickets);
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

// ----------------------------------------------------------------------------
// GET /api/tickets/:id (Fetch Single Ticket by ID)
// ----------------------------------------------------------------------------
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = extractParamId(req.params.id);
    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(404).json({ error: 'NotFound', message: 'Ticket not found' });
      return;
    }

    // Owner scoping: returns 404 if ticket belongs to another user
    const ticket = await Ticket.findOne({
      _id: new Types.ObjectId(id),
      owner: new Types.ObjectId(req.user!.id),
    });

    if (!ticket) {
      res.status(404).json({ error: 'NotFound', message: 'Ticket not found' });
      return;
    }

    res.status(200).json(ticket);
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

// ----------------------------------------------------------------------------
// POST /api/tickets (Create Ticket)
// ----------------------------------------------------------------------------
// Hypothetical run: User fills out creation modal and clicks submit.
// Validates payload, assigns owner from JWT, saves to MongoDB, returns HTTP 201 Created.
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, priority, status } = req.body;

    // Validate Title length (3 - 100 characters)
    const trimmedTitle = typeof title === 'string' ? title.trim() : '';
    if (!trimmedTitle || trimmedTitle.length < 3 || trimmedTitle.length > 100) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Title must be between 3 and 100 characters',
      });
      return;
    }

    // Validate Description length (<= 500 characters)
    if (description && typeof description === 'string' && description.length > 500) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Description must not exceed 500 characters',
      });
      return;
    }

    // Validate Priority Enum
    const ticketPriority: TicketPriority = priority || 'Medium';
    if (!VALID_PRIORITIES.includes(ticketPriority)) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Priority must be Low, Medium, High, or Urgent',
      });
      return;
    }

    // Validate Status Enum
    const ticketStatus: TicketStatus = status || 'Open';
    if (!VALID_STATUSES.includes(ticketStatus)) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Status must be Open, In Progress, Resolved, or Closed',
      });
      return;
    }

    // Instantiate and save new Ticket record
    const newTicket = new Ticket({
      title: trimmedTitle,
      description: description || '',
      priority: ticketPriority,
      status: ticketStatus,
      owner: new Types.ObjectId(req.user!.id),
    });

    const savedTicket = await newTicket.save();
    res.status(201).json(savedTicket);
  } catch (err: any) {
    if (err.name === 'ValidationError') {
      res.status(400).json({ error: 'ValidationError', message: err.message });
      return;
    }
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

// ----------------------------------------------------------------------------
// PUT /api/tickets/:id (Update Ticket)
// ----------------------------------------------------------------------------
// Hypothetical run: User updates status (e.g. Open -> Resolved) or edits title.
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = extractParamId(req.params.id);
    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(404).json({ error: 'NotFound', message: 'Ticket not found' });
      return;
    }

    // Locate ticket strictly scoped to current user
    const ticket = await Ticket.findOne({
      _id: new Types.ObjectId(id),
      owner: new Types.ObjectId(req.user!.id),
    });

    if (!ticket) {
      res.status(404).json({ error: 'NotFound', message: 'Ticket not found' });
      return;
    }

    const { title, description, priority, status } = req.body;

    if (title !== undefined) {
      const trimmedTitle = typeof title === 'string' ? title.trim() : '';
      if (!trimmedTitle || trimmedTitle.length < 3 || trimmedTitle.length > 100) {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Title must be between 3 and 100 characters',
        });
        return;
      }
      ticket.title = trimmedTitle;
    }

    if (description !== undefined) {
      if (typeof description === 'string' && description.length > 500) {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Description must not exceed 500 characters',
        });
        return;
      }
      ticket.description = description;
    }

    if (priority !== undefined) {
      if (!VALID_PRIORITIES.includes(priority)) {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Priority must be Low, Medium, High, or Urgent',
        });
        return;
      }
      ticket.priority = priority;
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Status must be Open, In Progress, Resolved, or Closed',
        });
        return;
      }
      ticket.status = status;
    }

    const updatedTicket = await ticket.save();
    res.status(200).json(updatedTicket);
  } catch (err: any) {
    if (err.name === 'ValidationError') {
      res.status(400).json({ error: 'ValidationError', message: err.message });
      return;
    }
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

// ----------------------------------------------------------------------------
// DELETE /api/tickets/:id (Delete Ticket)
// ----------------------------------------------------------------------------
// Hypothetical run: User confirms deletion in ConfirmDialogComponent.
// Removes record from MongoDB Tickets DB and returns HTTP 204 No Content.
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = extractParamId(req.params.id);
    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(404).json({ error: 'NotFound', message: 'Ticket not found' });
      return;
    }

    const result = await Ticket.findOneAndDelete({
      _id: new Types.ObjectId(id),
      owner: new Types.ObjectId(req.user!.id),
    });

    if (!result) {
      res.status(404).json({ error: 'NotFound', message: 'Ticket not found' });
      return;
    }

    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

export const ticketRouter = router;
