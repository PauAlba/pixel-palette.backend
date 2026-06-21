import { pgPool } from '../../config/db.js';

export interface FollowerProfileRow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: Date;
}

export async function findProfileIdByUsername(username: string): Promise<string | null> {
  const result = await pgPool.query<{ id: string }>(
    'SELECT id FROM profiles WHERE username = $1',
    [username],
  );
  return result.rows[0]?.id ?? null;
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const result = await pgPool.query<{ exists: boolean }>(
    'SELECT EXISTS(SELECT 1 FROM followers WHERE follower_id = $1 AND following_id = $2) AS exists',
    [followerId, followingId],
  );
  return result.rows[0]?.exists ?? false;
}

export async function followUser(followerId: string, followingId: string): Promise<void> {
  await pgPool.query(
    'INSERT INTO followers (follower_id, following_id) VALUES ($1, $2)',
    [followerId, followingId],
  );
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  await pgPool.query(
    'DELETE FROM followers WHERE follower_id = $1 AND following_id = $2',
    [followerId, followingId],
  );
}

export async function findFollowers(
  profileId: string,
  offset: number,
  limit: number,
): Promise<{ rows: FollowerProfileRow[]; total: number }> {
  const countResult = await pgPool.query<{ total: string }>(
    'SELECT COUNT(*)::text AS total FROM followers WHERE following_id = $1',
    [profileId],
  );
  const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

  const dataResult = await pgPool.query<FollowerProfileRow>(
    `SELECT p.id, p.username, p.display_name, p.avatar_url, f.created_at
     FROM followers f
     JOIN profiles p ON p.id = f.follower_id
     WHERE f.following_id = $1
     ORDER BY f.created_at DESC
     LIMIT $2 OFFSET $3`,
    [profileId, limit, offset],
  );
  return { rows: dataResult.rows, total };
}

export async function findFollowing(
  profileId: string,
  offset: number,
  limit: number,
): Promise<{ rows: FollowerProfileRow[]; total: number }> {
  const countResult = await pgPool.query<{ total: string }>(
    'SELECT COUNT(*)::text AS total FROM followers WHERE follower_id = $1',
    [profileId],
  );
  const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

  const dataResult = await pgPool.query<FollowerProfileRow>(
    `SELECT p.id, p.username, p.display_name, p.avatar_url, f.created_at
     FROM followers f
     JOIN profiles p ON p.id = f.following_id
     WHERE f.follower_id = $1
     ORDER BY f.created_at DESC
     LIMIT $2 OFFSET $3`,
    [profileId, limit, offset],
  );
  return { rows: dataResult.rows, total };
}
