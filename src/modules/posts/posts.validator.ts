import { z } from 'zod';

const POST_TYPES = ['text', 'image', 'pixel_art', 'animation'] as const;

export const createPostSchema = z.object({
  content: z.string().min(1, 'Content is required').max(2000),
  image_url: z.string().url('Invalid URL').optional(),
  title: z.string().max(200).optional(),
  post_type: z.enum(POST_TYPES).default('text'),
  tags: z.array(z.string().max(50)).max(10).default([]),
  is_featured: z.boolean().default(false),
});

export const updatePostSchema = z.object({
  content: z.string().min(1).max(2000).optional(),
  image_url: z.string().url('Invalid URL').optional(),
  title: z.string().max(200).optional(),
  post_type: z.enum(POST_TYPES).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  is_featured: z.boolean().optional(),
});

export type CreatePostDto = z.infer<typeof createPostSchema>;
export type UpdatePostDto = z.infer<typeof updatePostSchema>;
