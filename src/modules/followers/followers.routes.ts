import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { followHandler, unfollowHandler } from './followers.controller.js';

export const followersRouter = Router();

followersRouter.post('/:username', requireAuth, followHandler);
followersRouter.delete('/:username', requireAuth, unfollowHandler);
