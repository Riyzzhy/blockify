import mongoose, { Document, Schema } from 'mongoose';

export interface IUserSession extends Document {
  userId: string;
  userEmail: string;
  userName: string;
  forwardCode: string;
  backwardCode: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

const UserSessionSchema = new Schema<IUserSession>({
  userId: { type: String, required: true, unique: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  forwardCode: { type: String, required: true, unique: true },
  backwardCode: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Indexes for faster queries
UserSessionSchema.index({ forwardCode: 1 });
UserSessionSchema.index({ backwardCode: 1 });
UserSessionSchema.index({ userId: 1 });
UserSessionSchema.index({ expiresAt: 1 });

// Auto-remove expired sessions
UserSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const UserSession = mongoose.model<IUserSession>('UserSession', UserSessionSchema);