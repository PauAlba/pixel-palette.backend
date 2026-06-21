import { type Request, type Response, type NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.name,
      },
    });
    return;
  }

  const error = err instanceof Error ? err : new Error(String(err));
  logger.error({ err: error }, 'Unhandled error');

  res.status(500).json({
    error: {
      message: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
      ...(env.NODE_ENV !== 'production' && { detail: error.message }),
    },
  });
}
