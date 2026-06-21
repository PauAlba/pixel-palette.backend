import { Schema, model, type Document } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  actorId: string;
  type: string;
  isRead: boolean;
  payload: Record<string, unknown>;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    actorId: { type: String, required: true },
    type: { type: String, required: true },
    isRead: { type: Boolean, required: true, default: false },
    payload: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false },
);

export const Notification = model<INotification>('Notification', notificationSchema);
