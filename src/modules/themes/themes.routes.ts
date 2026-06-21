import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { upsertThemeSchema } from './themes.validator.js';
import { getThemeHandler, putThemeHandler } from './themes.controller.js';

export const themesRouter = Router();

themesRouter.get('/:username', getThemeHandler);
themesRouter.put('/me', requireAuth, validate(upsertThemeSchema), putThemeHandler);
