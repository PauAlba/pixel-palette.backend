import { z } from 'zod';

export const createGuestbookSchema = z.object({
  message: z.string().min(1, 'Message is required').max(500),
});

export type CreateGuestbookDto = z.infer<typeof createGuestbookSchema>;
