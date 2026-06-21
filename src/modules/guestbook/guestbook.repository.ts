import { pgPool } from '../../config/db.js';

export interface GuestbookEntryRow {
  id: string;
  profile_id: string;
  author_id: string;
  message: string;
  created_at: Date;
  author_username: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
}

export interface RawGuestbookRow {
  id: string;
  profile_id: string;
  author_id: string;
  message: string;
  created_at: Date;
}

export async function findGuestbookByProfileId(
  profileId: string,
  offset: number,
  limit: number,
): Promise<{ rows: GuestbookEntryRow[]; total: number }> {
  const [countRes, dataRes] = await Promise.all([
    pgPool.query<{ total: string }>(
      'SELECT COUNT(*)::text AS total FROM guestbook_entries WHERE profile_id = $1',
      [profileId],
    ),
    pgPool.query<GuestbookEntryRow>(
      `SELECT g.id, g.profile_id, g.author_id, g.message, g.created_at,
              p.username AS author_username,
              p.display_name AS author_display_name,
              p.avatar_url AS author_avatar_url
       FROM guestbook_entries g
       JOIN profiles p ON p.id = g.author_id
       WHERE g.profile_id = $1
       ORDER BY g.created_at DESC
       LIMIT $2 OFFSET $3`,
      [profileId, limit, offset],
    ),
  ]);
  return {
    total: parseInt(countRes.rows[0]?.total ?? '0', 10),
    rows: dataRes.rows,
  };
}

export async function findGuestbookEntryById(id: string): Promise<RawGuestbookRow | null> {
  const result = await pgPool.query<RawGuestbookRow>(
    'SELECT id, profile_id, author_id, message, created_at FROM guestbook_entries WHERE id = $1',
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createGuestbookEntry(
  profileId: string,
  authorId: string,
  message: string,
): Promise<RawGuestbookRow> {
  const result = await pgPool.query<RawGuestbookRow>(
    `INSERT INTO guestbook_entries (profile_id, author_id, message)
     VALUES ($1, $2, $3)
     RETURNING id, profile_id, author_id, message, created_at`,
    [profileId, authorId, message],
  );
  return result.rows[0]!;
}

export async function deleteGuestbookEntry(id: string): Promise<void> {
  await pgPool.query('DELETE FROM guestbook_entries WHERE id = $1', [id]);
}
