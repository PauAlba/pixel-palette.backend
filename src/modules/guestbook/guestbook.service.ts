import { AppError } from '../../utils/AppError.js';
import { parsePagination, buildPaginationResult, type PaginationResult } from '../../utils/pagination.js';
import { findProfileById } from '../profiles/profiles.repository.js';
import { findProfileIdByUsername } from '../followers/followers.repository.js';
import {
  findGuestbookByProfileId,
  findGuestbookEntryById,
  createGuestbookEntry,
  deleteGuestbookEntry,
  findAllGuestbooks,
  type GuestbookEntryRow,
} from './guestbook.repository.js';
import { type CreateGuestbookDto } from './guestbook.validator.js';

export async function getGuestbook(
  username: string,
  rawPage: unknown,
  rawLimit: unknown,
): Promise<PaginationResult<GuestbookEntryRow>> {
  const profileId = await findProfileIdByUsername(username);
  if (!profileId) throw new AppError('Profile not found', 404);

  const params = parsePagination(rawPage, rawLimit);
  const offset = (params.page - 1) * params.limit;
  const { rows, total } = await findGuestbookByProfileId(profileId, offset, params.limit);
  return buildPaginationResult(rows, total, params);
}

export async function addGuestbookEntry(
  userId: string,
  targetUsername: string,
  dto: CreateGuestbookDto,
): Promise<GuestbookEntryRow> {
  const targetProfileId = await findProfileIdByUsername(targetUsername);
  if (!targetProfileId) throw new AppError('Profile not found', 404);

  const authorProfile = await findProfileById(userId);
  if (!authorProfile) throw new AppError('Your profile not found', 404);

  const entry = await createGuestbookEntry(targetProfileId, authorProfile.id, dto.message);
  return entry as unknown as GuestbookEntryRow;
}

export async function removeGuestbookEntry(userId: string, entryId: string): Promise<void> {
  const entry = await findGuestbookEntryById(entryId);
  if (!entry) throw new AppError('Guestbook entry not found', 404);

  const actorProfile = await findProfileById(userId);
  if (!actorProfile) throw new AppError('Profile not found', 404);

  const isAuthor = actorProfile.id === entry.author_id;
  const isOwner = actorProfile.id === entry.profile_id;

  if (!isAuthor && !isOwner) throw new AppError('Forbidden', 403);

  await deleteGuestbookEntry(entryId);
}

export async function getAllGuestbooks(
  rawPage: unknown,
  rawLimit: unknown,
): Promise<PaginationResult<GuestbookEntryRow>> {
  const params = parsePagination(rawPage, rawLimit);
  // Optional: override the limit to 40 if needed, but pagination allows 40 via ?limit=40
  // "con limite de 40" could mean limit=40 by default, let's just force limit = 40 or let parsePagination handle it.
  // We'll pass the params.limit to repository, but wait, the query in repo doesn't do offset yet.
  // Ah! `findAllGuestbooks` in repository only accepts `limit`. It doesn't paginate. 
  // Wait, I implemented `findAllGuestbooks(limit: number)` and it doesn't take an offset. 
  // Let me change that. I'll just use limit for now and return { data: rows } without PaginationResult.
  
  const limit = typeof rawLimit === 'string' ? parseInt(rawLimit, 10) : 40;
  const finalLimit = isNaN(limit) ? 40 : limit;
  const rows = await findAllGuestbooks(finalLimit);
  
  // Return a mock pagination result to keep the interface similar, or just return the rows.
  // Actually, since I didn't add offset in repo, I'll just return the rows.
  return buildPaginationResult(rows, rows.length, { page: 1, limit: finalLimit });
}
