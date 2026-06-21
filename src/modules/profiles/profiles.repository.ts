import { pgPool } from '../../config/db.js';

export interface ProfileWithCounts {
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
  favorite_artists: string[];
  visitor_count: number;
  created_at: Date;
  updated_at: Date;
  posts_count: number;
  followers_count: number;
  following_count: number;
}

export interface PostRow {
  id: string;
  author_id: string;
  content: string | null;
  image_url: string | null;
  title: string | null;
  post_type: string;
  tags: string[];
  is_featured: boolean;
  created_at: Date;
}

export interface UpdateProfileInput {
  display_name?: string;
  bio?: string;
  mood?: string;
  avatar_url?: string;
  favorite_artists?: string[];
}

export async function findProfileWithCountsByUsername(
  username: string,
): Promise<ProfileWithCounts | null> {
  const result = await pgPool.query<ProfileWithCounts>(
    `SELECT
       p.*,
       (SELECT COUNT(*)::int FROM posts    WHERE author_id = p.id)    AS posts_count,
       (SELECT COUNT(*)::int FROM followers WHERE following_id = p.id) AS followers_count,
       (SELECT COUNT(*)::int FROM followers WHERE follower_id  = p.id) AS following_count
     FROM profiles p
     WHERE p.username = $1`,
    [username],
  );
  return result.rows[0] ?? null;
}

export async function findProfileById(profileId: string): Promise<ProfileWithCounts | null> {
  const result = await pgPool.query<ProfileWithCounts>(
    `SELECT
       p.*,
       (SELECT COUNT(*)::int FROM posts    WHERE author_id = p.id)    AS posts_count,
       (SELECT COUNT(*)::int FROM followers WHERE following_id = p.id) AS followers_count,
       (SELECT COUNT(*)::int FROM followers WHERE follower_id  = p.id) AS following_count
     FROM profiles p
     WHERE p.user_id = $1`,
    [profileId],
  );
  return result.rows[0] ?? null;
}

export async function updateProfile(
  profileId: string,
  input: UpdateProfileInput,
): Promise<ProfileWithCounts | null> {
  // Build SET clause dynamically but safely — only from known keys
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (input.display_name       !== undefined) {
    fields.push(`display_name = $${idx++}`);
    values.push(input.display_name);
  }
  if (input.bio !== undefined) {
    fields.push(`bio = $${idx++}`);
    values.push(input.bio);
  }
  if (input.mood !== undefined) {
    fields.push(`mood = $${idx++}`);
    values.push(input.mood);
  }
  if (input.avatar_url !== undefined) {
    fields.push(`avatar_url = $${idx++}`);
    values.push(input.avatar_url);
  }
  if (input.favorite_artists !== undefined) {
    fields.push(`favorite_artists = $${idx++}`);
    values.push(input.favorite_artists);
  }

  if (fields.length === 0) return findProfileById(profileId);

  fields.push(`updated_at = now()`);
  values.push(profileId);

  await pgPool.query(
    `UPDATE profiles SET ${fields.join(', ')} WHERE user_id = $${idx}`,
    values,
  );

  return findProfileById(profileId);
}

export async function findPostsByUsername(
  username: string,
  offset: number,
  limit: number,
): Promise<{ rows: PostRow[]; total: number }> {
  const countResult = await pgPool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total
     FROM posts po
     JOIN profiles p ON p.id = po.author_id
     WHERE p.username = $1`,
    [username],
  );

  const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

  const dataResult = await pgPool.query<PostRow>(
    `SELECT po.id, po.author_id, po.content, po.image_url,
            po.title, po.post_type, po.tags, po.is_featured, po.created_at
     FROM posts po
     JOIN profiles p ON p.id = po.author_id
     WHERE p.username = $1
     ORDER BY po.created_at DESC
     LIMIT $2 OFFSET $3`,
    [username, limit, offset],
  );

  return { rows: dataResult.rows, total };
}

export async function findTopProfilesByFollowers(limit: number): Promise<ProfileWithCounts[]> {
  const result = await pgPool.query<ProfileWithCounts>(
    `SELECT
       p.*,
       (SELECT COUNT(*)::int FROM posts    WHERE author_id = p.id)    AS posts_count,
       (SELECT COUNT(*)::int FROM followers WHERE following_id = p.id) AS followers_count,
       (SELECT COUNT(*)::int FROM followers WHERE follower_id  = p.id) AS following_count
     FROM profiles p
     ORDER BY followers_count DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows;
}
