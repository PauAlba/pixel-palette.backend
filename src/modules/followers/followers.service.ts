import { AppError } from '../../utils/AppError.js';
import { parsePagination, buildPaginationResult, type PaginationResult } from '../../utils/pagination.js';
import {
  findProfileIdByUsername,
  isFollowing,
  followUser,
  unfollowUser,
  findFollowers,
  findFollowing,
  type FollowerProfileRow,
} from './followers.repository.js';
import { findProfileById } from '../profiles/profiles.repository.js';

export async function follow(actorUserId: string, targetUsername: string): Promise<void> {
  const actorProfile = await findProfileById(actorUserId);
  if (!actorProfile) throw new AppError('Your profile not found', 404);

  const targetProfileId = await findProfileIdByUsername(targetUsername);
  if (!targetProfileId) throw new AppError('Target profile not found', 404);

  if (actorProfile.id === targetProfileId) {
    throw new AppError('You cannot follow yourself', 400);
  }

  const already = await isFollowing(actorProfile.id, targetProfileId);
  if (already) throw new AppError('Already following this user', 409);

  await followUser(actorProfile.id, targetProfileId);
}

export async function unfollow(actorUserId: string, targetUsername: string): Promise<void> {
  const actorProfile = await findProfileById(actorUserId);
  if (!actorProfile) throw new AppError('Your profile not found', 404);

  const targetProfileId = await findProfileIdByUsername(targetUsername);
  if (!targetProfileId) throw new AppError('Target profile not found', 404);

  await unfollowUser(actorProfile.id, targetProfileId);
}

export async function getFollowers(
  username: string,
  rawPage: unknown,
  rawLimit: unknown,
): Promise<PaginationResult<FollowerProfileRow>> {
  const profileId = await findProfileIdByUsername(username);
  if (!profileId) throw new AppError('Profile not found', 404);

  const params = parsePagination(rawPage, rawLimit);
  const offset = (params.page - 1) * params.limit;
  const { rows, total } = await findFollowers(profileId, offset, params.limit);
  return buildPaginationResult(rows, total, params);
}

export async function getFollowing(
  username: string,
  rawPage: unknown,
  rawLimit: unknown,
): Promise<PaginationResult<FollowerProfileRow>> {
  const profileId = await findProfileIdByUsername(username);
  if (!profileId) throw new AppError('Profile not found', 404);

  const params = parsePagination(rawPage, rawLimit);
  const offset = (params.page - 1) * params.limit;
  const { rows, total } = await findFollowing(profileId, offset, params.limit);
  return buildPaginationResult(rows, total, params);
}
