import { pgPool } from '../../config/db.js';
import { UserTheme } from '../../models/mongo/userTheme.model.js';
import { AppError } from '../../utils/AppError.js';

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

export interface ProfileRow {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  mood: string | null;
  avatar_url: string | null;
  role: string;
  background_pattern: string | null;
  music_url: string | null;
  theme_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email: string;
  password_hash: string;
  username: string;
  display_name: string;
}

export interface CreatedUser {
  user: UserRow;
  profile: ProfileRow;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const result = await pgPool.query<UserRow>(
    'SELECT id, email, password_hash, created_at FROM users WHERE email = $1',
    [email],
  );
  return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const result = await pgPool.query<UserRow>(
    'SELECT id, email, password_hash, created_at FROM users WHERE id = $1',
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findProfileByUserId(userId: string): Promise<ProfileRow | null> {
  const result = await pgPool.query<ProfileRow>(
    'SELECT * FROM profiles WHERE user_id = $1',
    [userId],
  );
  return result.rows[0] ?? null;
}

export async function findProfileByUsername(username: string): Promise<ProfileRow | null> {
  const result = await pgPool.query<ProfileRow>(
    'SELECT * FROM profiles WHERE username = $1',
    [username],
  );
  return result.rows[0] ?? null;
}

export async function createUserWithProfile(input: CreateUserInput): Promise<CreatedUser> {
  const client = await pgPool.connect();

  try {
    await client.query('BEGIN');

    const userResult = await client.query<UserRow>(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, password_hash, created_at`,
      [input.email, input.password_hash],
    );

    const user = userResult.rows[0];
    if (!user) throw new AppError('Failed to create user', 500);

    const profileResult = await client.query<ProfileRow>(
      `INSERT INTO profiles (user_id, username, display_name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [user.id, input.username, input.display_name],
    );

    const profile = profileResult.rows[0];
    if (!profile) throw new AppError('Failed to create profile', 500);

    // Mongo userTheme — if this fails we rollback Postgres
    await UserTheme.create({ userId: user.id });

    await client.query('COMMIT');
    return { user, profile };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
