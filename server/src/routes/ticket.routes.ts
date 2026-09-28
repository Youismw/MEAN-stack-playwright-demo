import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { Ticket, TicketPriority, TicketStatus } from '../models/Ticket.js';
import { AuthRequest, authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const VALID_PRIORITIES: TicketPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
const VALID_STATUSES: TicketStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];

function extractParamId(param: string | string[] | undefined): string {
  if (!param) return '';
  return Array.isArray(param) ? param[0] : param;
}

// GET /api/tickets?status=
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = new Types.ObjectId(req.user!.id);
    const filter: any = { owner: ownerId };

    if (req.query.status && typeof req.query.status === 'string') {
      const statusQuery = req.query.status.trim();
      if (VALID_STATUSES.includes(statusQuery as TicketStatus)) {
        filter.status = statusQuery;
      }
    }

    const tickets = await Ticket.find(filter).sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

// GET /api/tickets/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = extractParamId(req.params.id);
    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(404).json({ error: 'NotFound', message: 'Ticket not found' });
      return;
    }

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

// POST /api/tickets
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, priority, status } = req.body;

    // Validation
    const trimmedTitle = typeof title === 'string' ? title.trim() : '';
    if (!trimmedTitle || trimmedTitle.length < 3 || trimmedTitle.length > 100) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Title must be between 3 and 100 characters',
      });
      return;
    }

    if (description && typeof description === 'string' && description.length > 500) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Description must not exceed 500 characters',
      });
      return;
    }

    const ticketPriority: TicketPriority = priority || 'Medium';
    if (!VALID_PRIORITIES.includes(ticketPriority)) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Priority must be Low, Medium, High, or Urgent',
      });
      return;
    }

    const ticketStatus: TicketStatus = status || 'Open';
    if (!VALID_STATUSES.includes(ticketStatus)) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Status must be Open, In Progress, Resolved, or Closed',
      });
      return;
    }

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

// PUT /api/tickets/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = extractParamId(req.params.id);
    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(404).json({ error: 'NotFound', message: 'Ticket not found' });
      return;
    }

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

// DELETE /api/tickets/:id
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
