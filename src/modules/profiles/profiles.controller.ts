import { type Request, type Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { type UpdateProfileDto } from './profiles.validator.js';
import * as profilesService from './profiles.service.js';

export const getProfileHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { username } = req.params as { username: string };
  const profile = await profilesService.getProfile(username);
  res.status(200).json({ data: profile });
});

export const patchProfileHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  const dto = req.body as UpdateProfileDto;
  const profile = await profilesService.patchProfile(req.user.id, dto);
  res.status(200).json({ data: profile });
});

export const getProfilePostsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { username } = req.params as { username: string };
  const result = await profilesService.getProfilePosts(username, req.query['page'], req.query['limit']);
  res.status(200).json({ data: result });
});
