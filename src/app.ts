import express, { type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { isPgHealthy, isMongoHealthy } from './config/db.js';
import { env } from './config/env.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { profilesRouter } from './modules/profiles/profiles.routes.js';
import { followersRouter } from './modules/followers/followers.routes.js';
import { postsRouter } from './modules/posts/posts.routes.js';
import { commentsRouter } from './modules/comments/comments.routes.js';
import { notificationsRouter } from './modules/notifications/notifications.routes.js';
import { themesRouter } from './modules/themes/themes.routes.js';
import { guestbookRouter } from './modules/guestbook/guestbook.routes.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

export const app = express();

// ─── Security & parsing middlewares ──────────────────────────────────────────
app.use(helmet());
app.use(hpp()); // Prevent HTTP Parameter Pollution

const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: env.CORS_ORIGINS === '*' ? '*' : allowedOrigins,
  }),
);

// Global rate limiter
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Request logger ───────────────────────────────────────────────────────────
app.use(
  (pinoHttp as any)({
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    customProps: (req: Request) => {
      // Add userId to logs if available from auth middleware
      // Note: req.user won't be available here globally unless auth middleware is run before
      // but it will log after the response is sent.
      return req.user ? { userId: req.user.id } : {};
    },
  })
);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', async (_req: Request, res: Response) => {
  const [pgOk, mongoOk] = await Promise.all([isPgHealthy(), Promise.resolve(isMongoHealthy())]);
  const status = pgOk && mongoOk ? 'ok' : 'degraded';

  res.status(pgOk && mongoOk ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    db: {
      postgres: pgOk ? 'connected' : 'error',
      mongo: mongoOk ? 'connected' : 'error',
    },
  });
});

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/followers', followersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/themes', themesRouter);
app.use('/api/guestbook', guestbookRouter);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: { message: 'Not Found', code: 'NOT_FOUND' } });
});

// ─── Error middleware (must be last) ─────────────────────────────────────────
app.use(errorMiddleware);
