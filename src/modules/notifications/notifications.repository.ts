import { type FilterQuery, type Types } from 'mongoose';
import { Notification, type INotification } from '../../models/mongo/notification.model.js';

export async function findNotifications(
  userId: string,
  offset: number,
  limit: number,
): Promise<{ rows: INotification[]; total: number }> {
  const filter: FilterQuery<INotification> = { userId };
  const [total, rows] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
  ]);
  return { total, rows: rows as unknown as INotification[] };
}

export async function markOneRead(
  id: string,
  userId: string,
): Promise<INotification | null> {
  return Notification.findOneAndUpdate(
    { _id: id as unknown as Types.ObjectId, userId },
    { $set: { isRead: true } },
    { new: true },
  ).lean() as Promise<INotification | null>;
}

export async function markAllRead(userId: string): Promise<number> {
  const result = await Notification.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true } },
  );
  return result.modifiedCount;
}

export async function countUnread(userId: string): Promise<number> {
  return Notification.countDocuments({ userId, isRead: false });
}
