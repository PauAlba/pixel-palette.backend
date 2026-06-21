import { pgPool } from '../../config/db.js';

export async function likePost(profileId: string, postId: string): Promise<void> {
  await pgPool.query(
    `INSERT INTO likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [postId, profileId],
  );
}

export async function unlikePost(profileId: string, postId: string): Promise<void> {
  await pgPool.query(
    'DELETE FROM likes WHERE post_id = $1 AND user_id = $2',
    [postId, profileId],
  );
}
