import { AppError } from '../../utils/AppError.js';
import { parsePagination, buildPaginationResult, type PaginationResult } from '../../utils/pagination.js';
import { fireNotification } from '../../utils/notifications.js';
import { findProfileById } from '../profiles/profiles.repository.js';
import { findPostById } from '../posts/posts.repository.js';
import {
  findCommentsByPostId,
  findCommentById,
  createComment,
  deleteComment,
  type CommentRow,
  type RawCommentRow,
} from './comments.repository.js';
import { type CreateCommentDto } from './comments.validator.js';
import {
  likePost,
  unlikePost,
} from '../likes/likes.repository.js';

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function getComments(
  postId: string,
  rawPage: unknown,
  rawLimit: unknown,
): Promise<PaginationResult<CommentRow>> {
  const post = await findPostById(postId);
  if (!post) throw new AppError('Post not found', 404);

  const params = parsePagination(rawPage, rawLimit);
  const offset = (params.page - 1) * params.limit;
  const { rows, total } = await findCommentsByPostId(postId, offset, params.limit);
  return buildPaginationResult(rows, total, params);
}

export async function addComment(
  userId: string,
  postId: string,
  dto: CreateCommentDto,
): Promise<RawCommentRow> {
  const post = await findPostById(postId);
  if (!post) throw new AppError('Post not found', 404);

  const profile = await findProfileById(userId);
  if (!profile) throw new AppError('Profile not found', 404);

  const comment = await createComment(postId, profile.id, dto);

  // Notify post author (skip if self-comment)
  if (post.author_id !== profile.id) {
    fireNotification(post.author_id, profile.id, 'comment', {
      postId,
      commentId: comment.id,
    });
  }

  return comment;
}

export async function removeComment(userId: string, commentId: string): Promise<void> {
  const comment = await findCommentById(commentId);
  if (!comment) throw new AppError('Comment not found', 404);

  const profile = await findProfileById(userId);
  if (!profile) throw new AppError('Profile not found', 404);

  if (comment.author_id !== profile.id) throw new AppError('Forbidden', 403);

  await deleteComment(commentId);
}

// ─── Likes ────────────────────────────────────────────────────────────────────

export async function like(userId: string, postId: string): Promise<void> {
  const post = await findPostById(postId);
  if (!post) throw new AppError('Post not found', 404);

  const profile = await findProfileById(userId);
  if (!profile) throw new AppError('Profile not found', 404);

  await likePost(profile.id, postId);

  if (post.author_id !== profile.id) {
    fireNotification(post.author_id, profile.id, 'like', { postId });
  }
}

export async function unlike(userId: string, postId: string): Promise<void> {
  const post = await findPostById(postId);
  if (!post) throw new AppError('Post not found', 404);

  const profile = await findProfileById(userId);
  if (!profile) throw new AppError('Profile not found', 404);

  await unlikePost(profile.id, postId);
}
