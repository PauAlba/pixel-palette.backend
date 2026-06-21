import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(1000),
});

export type CreateCommentDto = z.infer<typeof createCommentSchema>;
