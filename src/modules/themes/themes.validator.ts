import { z } from 'zod';
import { BACKGROUND_PATTERNS } from '../../models/mongo/userTheme.model.js';

export const upsertThemeSchema = z.object({
  customCss: z.string().max(10000).default(''),
  backgroundPattern: z.enum(BACKGROUND_PATTERNS).default('none'),
  musicUrl: z.string().url('Invalid URL').or(z.literal('')).default(''),
});

export type UpsertThemeDto = z.infer<typeof upsertThemeSchema>;
