import { Schema, Document, Types } from 'mongoose';
import { userDbConnection } from '../config/db.js';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

export const User = userDbConnection.model<IUser>('User', userSchema);
