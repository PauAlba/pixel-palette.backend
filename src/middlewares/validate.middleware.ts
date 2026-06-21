import { type Request, type Response, type NextFunction } from 'express';
import { type ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const fields: Record<string, string[]> = {};
      result.error.errors.forEach((e: ZodError['errors'][number]) => {
        const key = e.path.join('.');
        if (!fields[key]) fields[key] = [];
        fields[key].push(e.message);
      });

      res.status(400).json({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          fields,
        },
      });
      return;
    }

    req.body = result.data as unknown;
    next();
  };
}
