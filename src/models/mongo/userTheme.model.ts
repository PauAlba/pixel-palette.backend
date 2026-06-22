import { Schema, model, type Document } from 'mongoose';

export const BACKGROUND_PATTERNS = [
  'dots',
  'grid',
  'stripes',
  'checker',
  'hearts',
  'stars',
  'leopard',
  'none',
] as const;

export type BackgroundPattern = (typeof BACKGROUND_PATTERNS)[number];

export interface IUserTheme extends Document {
  userId: string;
  customCss: string;
  backgroundPattern: BackgroundPattern;
  musicUrl: string;
  updatedAt: Date;
}

const userThemeSchema = new Schema<IUserTheme>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    customCss: { type: String, default: '' },
    backgroundPattern: {
      type: String,
      enum: BACKGROUND_PATTERNS,
      default: 'none',
    },
    musicUrl: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false },
);

export const UserTheme = model<IUserTheme>('UserTheme', userThemeSchema);
