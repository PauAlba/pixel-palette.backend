import { AppError } from '../../utils/AppError.js';
import { parsePagination, buildPaginationResult, type PaginationResult } from '../../utils/pagination.js';
import { fireNotification } from '../../utils/notifications.js';
import { findProfileById } from '../profiles/profiles.repository.js';
import {
  findFeedPosts,
  findPostById,
  createPost,
  updatePost,
  deletePost,
  type PostWithMeta,
  type PostRow,
} from './posts.repository.js';
import { type CreatePostDto, type UpdatePostDto } from './posts.validator.js';

export async function getFeed(
  rawPage: unknown,
  rawLimit: unknown,
): Promise<PaginationResult<PostWithMeta>> {
  const params = parsePagination(rawPage, rawLimit);
  const offset = (params.page - 1) * params.limit;
  const { rows, total } = await findFeedPosts(offset, params.limit);
  return buildPaginationResult(rows, total, params);
}

export async function getPost(id: string): Promise<PostWithMeta> {
  const post = await findPostById(id);
  if (!post) throw new AppError('Post not found', 404);
  return post;
}

export async function createNewPost(
  userId: string,
  dto: CreatePostDto,
): Promise<PostRow> {
  const profile = await findProfileById(userId);
  if (!profile) throw new AppError('Profile not found', 404);

  const post = await createPost(profile.id, dto);

  // fire-and-forget — does not block response
  fireNotification(profile.id, profile.id, 'post_created', { postId: post.id });

  return post;
}

export async function patchPost(
  userId: string,
  postId: string,
  dto: UpdatePostDto,
): Promise<PostRow> {
  const existing = await findPostById(postId);
  if (!existing) throw new AppError('Post not found', 404);

  const profile = await findProfileById(userId);
  if (!profile) throw new AppError('Profile not found', 404);

  if (existing.author_id !== profile.id) throw new AppError('Forbidden', 403);

  const updated = await updatePost(postId, dto);
  if (!updated) throw new AppError('Post not found', 404);
  return updated;
}

export async function removePost(userId: string, postId: string): Promise<void> {
  const existing = await findPostById(postId);
  if (!existing) throw new AppError('Post not found', 404);

  const profile = await findProfileById(userId);
  if (!profile) throw new AppError('Profile not found', 404);

  if (existing.author_id !== profile.id) throw new AppError('Forbidden', 403);

  await deletePost(postId);
}
