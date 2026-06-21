import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import rateLimit from 'express-rate-limit';
import { signupSchema, loginSchema, refreshSchema } from './auth.validator.js';
import {
  signupHandler,
  loginHandler,
  meHandler,
  refreshHandler,
} from './auth.controller.js';

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { error: { message: 'Too many requests, please try again later.' } },
});

authRouter.post('/signup', authLimiter, validate(signupSchema), signupHandler);
authRouter.post('/login', authLimiter, validate(loginSchema), loginHandler);
authRouter.post('/refresh', validate(refreshSchema), refreshHandler);
authRouter.get('/me', requireAuth, meHandler);
