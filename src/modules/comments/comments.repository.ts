import { pgPool } from '../../config/db.js';
import { type CreateCommentDto } from './comments.validator.js';

export interface CommentRow {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: Date;
  author_username: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
}

export interface RawCommentRow {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: Date;
}

export async function findCommentsByPostId(
  postId: string,
  offset: number,
  limit: number,
): Promise<{ rows: CommentRow[]; total: number }> {
  const [countRes, dataRes] = await Promise.all([
    pgPool.query<{ total: string }>(
      'SELECT COUNT(*)::text AS total FROM comments WHERE post_id = $1',
      [postId],
    ),
    pgPool.query<CommentRow>(
      `SELECT c.id, c.post_id, c.author_id, c.content, c.created_at,
              p.username AS author_username, p.display_name AS author_display_name,
              p.avatar_url AS author_avatar_url
       FROM comments c
       JOIN profiles p ON p.id = c.author_id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC
       LIMIT $2 OFFSET $3`,
      [postId, limit, offset],
    ),
  ]);
  return {
    total: parseInt(countRes.rows[0]?.total ?? '0', 10),
    rows: dataRes.rows,
  };
}

export async function findCommentById(id: string): Promise<RawCommentRow | null> {
  const result = await pgPool.query<RawCommentRow>(
    'SELECT id, post_id, author_id, content, created_at FROM comments WHERE id = $1',
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createComment(
  postId: string,
  profileId: string,
  dto: CreateCommentDto,
): Promise<RawCommentRow> {
  const result = await pgPool.query<RawCommentRow>(
    `INSERT INTO comments (post_id, author_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, post_id, author_id, content, created_at`,
    [postId, profileId, dto.content],
  );
  return result.rows[0]!;
}

export async function deleteComment(id: string): Promise<void> {
  await pgPool.query('DELETE FROM comments WHERE id = $1', [id]);
}
