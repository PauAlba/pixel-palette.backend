import { Notification } from '../models/mongo/notification.model.js';
import { logger } from '../config/logger.js';

export function fireNotification(
  userId: string,
  actorId: string,
  type: string,
  payload: Record<string, unknown>,
): void {
  Notification.create({ userId, actorId, type, payload, isRead: false, createdAt: new Date() }).catch(
    (err: unknown) => logger.warn({ err }, 'Failed to save notification'),
  );
}
