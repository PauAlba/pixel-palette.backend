import { UserTheme, BACKGROUND_PATTERNS, type IUserTheme } from '../../models/mongo/userTheme.model.js';

export interface UpsertThemeInput {
  customCss: string;
  backgroundPattern: string;
  musicUrl: string;
}

export async function findThemeByUserId(userId: string): Promise<IUserTheme | null> {
  return UserTheme.findOne({ userId }).lean() as Promise<IUserTheme | null>;
}

export async function upsertTheme(
  userId: string,
  input: UpsertThemeInput,
): Promise<IUserTheme> {
  const pattern = BACKGROUND_PATTERNS.includes(
    input.backgroundPattern as (typeof BACKGROUND_PATTERNS)[number],
  )
    ? input.backgroundPattern
    : 'none';

  const doc = await UserTheme.findOneAndUpdate(
    { userId },
    {
      $set: {
        customCss: input.customCss,
        backgroundPattern: pattern,
        musicUrl: input.musicUrl,
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true },
  ).lean();
  return doc as unknown as IUserTheme;
}
