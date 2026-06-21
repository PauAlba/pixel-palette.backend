import { type Request, type Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { type CreateCommentDto } from './comments.validator.js';
import * as commentsService from './comments.service.js';

export const getCommentsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { postId } = req.params as { postId: string };
  const result = await commentsService.getComments(postId, req.query['page'], req.query['limit']);
  res.status(200).json({ data: result });
});

export const createCommentHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  const { postId } = req.params as { postId: string };
  const dto = req.body as CreateCommentDto;
  const comment = await commentsService.addComment(req.user.id, postId, dto);
  res.status(201).json({ data: comment });
});

export const deleteCommentHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  const { id } = req.params as { id: string };
  await commentsService.removeComment(req.user.id, id);
  res.status(204).send();
});

export const likePostHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  const { postId } = req.params as { postId: string };
  await commentsService.like(req.user.id, postId);
  res.status(200).json({ data: { message: 'Post liked' } });
});

export const unlikePostHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  const { postId } = req.params as { postId: string };
  await commentsService.unlike(req.user.id, postId);
  res.status(200).json({ data: { message: 'Post unliked' } });
});
