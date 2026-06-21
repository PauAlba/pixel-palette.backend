import { pgPool } from '../../config/db.js';
import { type CreatePostDto, type UpdatePostDto } from './posts.validator.js';

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

export interface PostWithMeta extends PostRow {
  author_username: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
  likes_count: number;
  comments_count: number;
}

const POST_WITH_META_SQL = `
  SELECT
    p.id, p.author_id, p.content, p.image_url,
    p.title, p.post_type, p.tags, p.is_featured, p.created_at,
    pr.username        AS author_username,
    pr.display_name    AS author_display_name,
    pr.avatar_url      AS author_avatar_url,
    (SELECT COUNT(*)::int FROM likes    WHERE post_id = p.id) AS likes_count,
    (SELECT COUNT(*)::int FROM comments WHERE post_id = p.id) AS comments_count
  FROM posts p
  JOIN profiles pr ON pr.id = p.author_id
`;

export async function findFeedPosts(
  offset: number,
  limit: number,
): Promise<{ rows: PostWithMeta[]; total: number }> {
  const [countRes, dataRes] = await Promise.all([
    pgPool.query<{ total: string }>('SELECT COUNT(*)::text AS total FROM posts'),
    pgPool.query<PostWithMeta>(
      `${POST_WITH_META_SQL} ORDER BY p.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    ),
  ]);
  return {
    total: parseInt(countRes.rows[0]?.total ?? '0', 10),
    rows: dataRes.rows,
  };
}

export async function findPostById(id: string): Promise<PostWithMeta | null> {
  const result = await pgPool.query<PostWithMeta>(
    `${POST_WITH_META_SQL} WHERE p.id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createPost(
  profileId: string,
  dto: CreatePostDto,
): Promise<PostRow> {
  const result = await pgPool.query<PostRow>(
    `INSERT INTO posts (author_id, content, image_url, title, post_type, tags, is_featured)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, author_id, content, image_url, title, post_type, tags, is_featured, created_at`,
    [
      profileId,
      dto.content,
      dto.image_url ?? null,
      dto.title ?? null,
      dto.post_type ?? 'text',
      dto.tags ?? [],
      dto.is_featured ?? false,
    ],
  );
  return result.rows[0]!;
}

export async function updatePost(
  id: string,
  dto: UpdatePostDto,
): Promise<PostRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (dto.content   !== undefined) { fields.push(`content    = $${idx++}`); values.push(dto.content); }
  if (dto.image_url !== undefined) { fields.push(`image_url  = $${idx++}`); values.push(dto.image_url); }
  if (dto.title     !== undefined) { fields.push(`title      = $${idx++}`); values.push(dto.title); }
  if (dto.post_type !== undefined) { fields.push(`post_type  = $${idx++}`); values.push(dto.post_type); }
  if (dto.tags      !== undefined) { fields.push(`tags       = $${idx++}`); values.push(dto.tags); }
  if (dto.is_featured !== undefined) { fields.push(`is_featured = $${idx++}`); values.push(dto.is_featured); }
  if (fields.length === 0) return findPostById(id);

  values.push(id);
  const result = await pgPool.query<PostRow>(
    `UPDATE posts SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values,
  );
  return result.rows[0] ?? null;
}

export async function deletePost(id: string): Promise<void> {
  await pgPool.query('DELETE FROM posts WHERE id = $1', [id]);
}
