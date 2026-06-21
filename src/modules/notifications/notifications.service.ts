import { parsePagination, buildPaginationResult, type PaginationResult } from '../../utils/pagination.js';
import { AppError } from '../../utils/AppError.js';
import { type INotification } from '../../models/mongo/notification.model.js';
import {
  findNotifications,
  markOneRead,
  markAllRead,
  countUnread,
} from './notifications.repository.js';

export async function getNotifications(
  userId: string,
  rawPage: unknown,
  rawLimit: unknown,
): Promise<PaginationResult<INotification>> {
  const params = parsePagination(rawPage, rawLimit);
  const offset = (params.page - 1) * params.limit;
  const { rows, total } = await findNotifications(userId, offset, params.limit);
  return buildPaginationResult(rows, total, params);
}

export async function readOne(userId: string, id: string): Promise<INotification> {
  const updated = await markOneRead(id, userId);
  if (!updated) throw new AppError('Notification not found', 404);
  return updated;
}

export async function readAll(userId: string): Promise<{ updated: number }> {
  const updated = await markAllRead(userId);
  return { updated };
}

export async function getUnreadCount(userId: string): Promise<{ count: number }> {
  const count = await countUnread(userId);
  return { count };
}
