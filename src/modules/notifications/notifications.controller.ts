import { type Request, type Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import * as notificationsService from './notifications.service.js';

export const getNotificationsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  const result = await notificationsService.getNotifications(req.user.id, req.query['page'], req.query['limit']);
  res.status(200).json({ data: result });
});

export const readOneHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  const { id } = req.params as { id: string };
  const notification = await notificationsService.readOne(req.user.id, id);
  res.status(200).json({ data: notification });
});

export const readAllHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  const result = await notificationsService.readAll(req.user.id);
  res.status(200).json({ data: result });
});

export const unreadCountHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  const result = await notificationsService.getUnreadCount(req.user.id);
  res.status(200).json({ data: result });
});
