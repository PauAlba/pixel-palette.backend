import { AppError } from '../../utils/AppError.js';
import { parsePagination, buildPaginationResult, type PaginationResult } from '../../utils/pagination.js';
import {
  findProfileWithCountsByUsername,
  updateProfile,
  findPostsByUsername,
  findTopProfilesByFollowers,
  findAllProfiles,
  type ProfileWithCounts,
  type PostRow,
} from './profiles.repository.js';
import { deleteUserById } from '../auth/auth.repository.js';
import { type UpdateProfileDto } from './profiles.validator.js';

export async function getProfile(username: string): Promise<ProfileWithCounts> {
  const profile = await findProfileWithCountsByUsername(username);
  if (!profile) throw new AppError('Profile not found', 404);
  return profile;
}

export async function patchProfile(
  userId: string,
  dto: UpdateProfileDto,
): Promise<ProfileWithCounts> {
  const updated = await updateProfile(userId, dto);
  if (!updated) throw new AppError('Profile not found', 404);
  return updated;
}

export async function getProfilePosts(
  username: string,
  rawPage: unknown,
  rawLimit: unknown,
): Promise<PaginationResult<PostRow>> {
  const params = parsePagination(rawPage, rawLimit);
  const offset = (params.page - 1) * params.limit;
  const { rows, total } = await findPostsByUsername(username, offset, params.limit);
  return buildPaginationResult(rows, total, params);
}

export async function getTopProfiles(limit: number = 4): Promise<ProfileWithCounts[]> {
  return findTopProfilesByFollowers(limit);
}

export async function getAllProfiles(
  rawPage: unknown,
  rawLimit: unknown,
): Promise<PaginationResult<ProfileWithCounts>> {
  const params = parsePagination(rawPage, rawLimit);
  const offset = (params.page - 1) * params.limit;
  const { rows, total } = await findAllProfiles(offset, params.limit);
  return buildPaginationResult(rows, total, params);
}

export async function removeProfile(
  currentUserId: string,
  currentUserRole: string | undefined,
  targetUsername: string,
): Promise<void> {
  const targetProfile = await findProfileWithCountsByUsername(targetUsername);
  if (!targetProfile) throw new AppError('Profile not found', 404);

  // Check authorization: must be the owner or an admin
  if (targetProfile.user_id !== currentUserId && currentUserRole !== 'admin') {
    throw new AppError('Forbidden: you do not have permission to delete this profile', 403);
  }

  await deleteUserById(targetProfile.user_id);
}
