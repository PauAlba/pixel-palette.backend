import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { deleteCommentHandler } from './comments.controller.js';

export const commentsRouter = Router();

commentsRouter.delete('/:id', requireAuth, deleteCommentHandler);
