import { AppError } from '../../utils/AppError.js';
import { parsePagination, buildPaginationResult, type PaginationResult } from '../../utils/pagination.js';
import { findProfileById } from '../profiles/profiles.repository.js';
import { findProfileIdByUsername } from '../followers/followers.repository.js';
import {
  findGuestbookByProfileId,
  findGuestbookEntryById,
  createGuestbookEntry,
  deleteGuestbookEntry,
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

  if (authorProfile.id === targetProfileId) {
    throw new AppError('Cannot write in your own guestbook', 400);
  }

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
