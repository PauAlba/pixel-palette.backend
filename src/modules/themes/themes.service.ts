import { AppError } from '../../utils/AppError.js';
import { sanitizeCss } from '../../utils/sanitizeCss.js';
import { findProfileById } from '../profiles/profiles.repository.js';
import { findProfileIdByUsername } from '../followers/followers.repository.js';
import { findThemeByUserId, upsertTheme, type UpsertThemeInput } from './themes.repository.js';
import { type IUserTheme } from '../../models/mongo/userTheme.model.js';
import { type UpsertThemeDto } from './themes.validator.js';

export async function getThemeByUsername(username: string): Promise<IUserTheme | null> {
  const profileId = await findProfileIdByUsername(username);
  if (!profileId) throw new AppError('Profile not found', 404);

  // Find profile to get user_id for MongoDB lookup
  const profile = await findProfileById(profileId);
  if (!profile) throw new AppError('Profile not found', 404);

  return findThemeByUserId(profile.user_id);
}

export async function putTheme(userId: string, dto: UpsertThemeDto): Promise<IUserTheme> {
  const profile = await findProfileById(userId);
  if (!profile) throw new AppError('Profile not found', 404);

  const sanitized = sanitizeCss(dto.customCss);

  const input: UpsertThemeInput = {
    customCss: sanitized,
    backgroundPattern: dto.backgroundPattern,
    musicUrl: dto.musicUrl,
  };

  return upsertTheme(userId, input);
}
