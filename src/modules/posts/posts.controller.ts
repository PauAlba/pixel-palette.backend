import { type Request, type Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { type CreatePostDto, type UpdatePostDto } from './posts.validator.js';
import * as postsService from './posts.service.js';

export const getFeedHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await postsService.getFeed(req.query['page'], req.query['limit']);
  res.status(200).json({ data: result });
});

export const getPostHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const post = await postsService.getPost(id);
  res.status(200).json({ data: post });
});

export const createPostHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  const dto = req.body as CreatePostDto;
  const post = await postsService.createNewPost(req.user.id, dto);
  res.status(201).json({ data: post });
});

export const updatePostHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  const { id } = req.params as { id: string };
  const dto = req.body as UpdatePostDto;
  const post = await postsService.patchPost(req.user.id, id, dto);
  res.status(200).json({ data: post });
});

export const deletePostHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  const { id } = req.params as { id: string };
  await postsService.removePost(req.user.id, id);
  res.status(204).send();
});
