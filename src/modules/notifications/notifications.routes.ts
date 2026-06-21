import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import {
  getNotificationsHandler,
  readOneHandler,
  readAllHandler,
  unreadCountHandler,
} from './notifications.controller.js';

export const notificationsRouter = Router();

// All routes protected
notificationsRouter.use(requireAuth);

notificationsRouter.get('/', getNotificationsHandler);
notificationsRouter.get('/unread-count', unreadCountHandler);
notificationsRouter.patch('/read-all', readAllHandler);
notificationsRouter.patch('/:id/read', readOneHandler);
