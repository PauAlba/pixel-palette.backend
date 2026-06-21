import { z } from 'zod';

export const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  mood: z.string().max(100).optional(),
  avatar_url: z.string().url('Invalid URL').optional(),
  favorite_artists: z.array(z.string().max(100)).max(20).optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
