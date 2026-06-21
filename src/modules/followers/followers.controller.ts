import { type Request, type Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import * as followersService from './followers.service.js';

export const followHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  const { username } = req.params as { username: string };
  await followersService.follow(req.user.id, username);
  res.status(200).json({ data: { message: `Now following ${username}` } });
});

export const unfollowHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  const { username } = req.params as { username: string };
  await followersService.unfollow(req.user.id, username);
  res.status(200).json({ data: { message: `Unfollowed ${username}` } });
});

export const getFollowersHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { username } = req.params as { username: string };
  const result = await followersService.getFollowers(username, req.query['page'], req.query['limit']);
  res.status(200).json({ data: result });
});

export const getFollowingHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { username } = req.params as { username: string };
  const result = await followersService.getFollowing(username, req.query['page'], req.query['limit']);
  res.status(200).json({ data: result });
});
