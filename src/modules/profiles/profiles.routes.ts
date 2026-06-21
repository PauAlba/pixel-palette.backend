import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { updateProfileSchema } from './profiles.validator.js';
import {
  getProfileHandler,
  patchProfileHandler,
  getProfilePostsHandler,
} from './profiles.controller.js';
import {
  getFollowersHandler,
  getFollowingHandler,
} from '../followers/followers.controller.js';

export const profilesRouter = Router();

// Public
profilesRouter.get('/:username', getProfileHandler);
profilesRouter.get('/:username/posts', getProfilePostsHandler);
profilesRouter.get('/:username/followers', getFollowersHandler);
profilesRouter.get('/:username/following', getFollowingHandler);

// Protected
profilesRouter.patch('/me', requireAuth, validate(updateProfileSchema), patchProfileHandler);
