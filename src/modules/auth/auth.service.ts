import { hashPassword, comparePassword } from '../../utils/hash.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { AppError } from '../../utils/AppError.js';
import {
  findUserByEmail,
  findUserById,
  findProfileByUserId,
  findProfileByUsername,
  createUserWithProfile,
  type ProfileRow,
} from './auth.repository.js';
import { type SignupDto, type LoginDto } from './auth.validator.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends TokenPair {
  profile: PublicProfile;
}

export interface PublicProfile {
  id: string;
  userId: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  mood: string | null;
  avatarUrl: string | null;
  role: string;
  themeEnabled: boolean;
  createdAt: Date;
}

function toPublicProfile(p: ProfileRow): PublicProfile {
  return {
    id: p.id,
    userId: p.user_id,
    username: p.username,
    displayName: p.display_name,
    bio: p.bio,
    mood: p.mood,
    avatarUrl: p.avatar_url,
    role: p.role,
    themeEnabled: p.theme_enabled,
    createdAt: p.created_at,
  };
}

export async function signup(dto: SignupDto): Promise<AuthResponse> {
  const existingEmail = await findUserByEmail(dto.email);
  if (existingEmail) throw new AppError('Email already in use', 409);

  const existingUsername = await findProfileByUsername(dto.username);
  if (existingUsername) throw new AppError('Username already taken', 409);

  const password_hash = await hashPassword(dto.password);

  const { user, profile } = await createUserWithProfile({
    email: dto.email,
    password_hash,
    username: dto.username,
    display_name: dto.display_name,
  });

  const payload = { sub: user.id, email: user.email, role: profile.role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    profile: toPublicProfile(profile),
  };
}

export async function login(dto: LoginDto): Promise<AuthResponse> {
  const user = await findUserByEmail(dto.email);
  if (!user) throw new AppError('Invalid credentials', 401);

  const valid = await comparePassword(dto.password, user.password_hash);
  if (!valid) throw new AppError('Invalid credentials', 401);

  const profile = await findProfileByUserId(user.id);
  if (!profile) throw new AppError('Profile not found', 404);

  const payload = { sub: user.id, email: user.email, role: profile.role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    profile: toPublicProfile(profile),
  };
}

export async function me(userId: string): Promise<PublicProfile> {
  const user = await findUserById(userId);
  if (!user) throw new AppError('User not found', 404);

  const profile = await findProfileByUserId(userId);
  if (!profile) throw new AppError('Profile not found', 404);

  return toPublicProfile(profile);
}

export async function refresh(token: string): Promise<TokenPair> {
  let payload: ReturnType<typeof verifyRefreshToken>;

  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await findUserById(payload.sub);
  if (!user) throw new AppError('User not found', 401);

  const profile = await findProfileByUserId(user.id);
  const role = profile?.role ?? 'user';

  const newPayload = { sub: user.id, email: user.email, role };
  return {
    accessToken: signAccessToken(newPayload),
    refreshToken: signRefreshToken(newPayload),
  };
}
