import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { createGuestbookSchema } from './guestbook.validator.js';
import {
  getGuestbookHandler,
  createGuestbookHandler,
  deleteGuestbookHandler,
  getAllGuestbooksHandler,
} from './guestbook.controller.js';

export const guestbookRouter = Router();

guestbookRouter.get('/', getAllGuestbooksHandler);
guestbookRouter.get('/:username', getGuestbookHandler);
guestbookRouter.post('/:username', requireAuth, validate(createGuestbookSchema), createGuestbookHandler);
guestbookRouter.delete('/:id', requireAuth, deleteGuestbookHandler);
