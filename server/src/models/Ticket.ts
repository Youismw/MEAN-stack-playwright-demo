import { Schema, Document, Types } from 'mongoose';
import { ticketDbConnection } from '../db.js';

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface ITicket extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  priority: TicketPriority;
  status: TicketStatus;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be between 3 and 100 characters'],
      maxlength: [100, 'Title must be between 3 and 100 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description must not exceed 500 characters'],
      default: '',
    },
    priority: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High', 'Urgent'],
        message: 'Priority must be Low, Medium, High, or Urgent',
      },
      default: 'Medium',
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Open', 'In Progress', 'Resolved', 'Closed'],
        message: 'Status must be Open, In Progress, Resolved, or Closed',
      },
      default: 'Open',
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ticketSchema.index({ owner: 1, createdAt: -1 });

export const Ticket = ticketDbConnection.model<ITicket>('Ticket', ticketSchema);
