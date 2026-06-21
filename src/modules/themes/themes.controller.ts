import { type Request, type Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { type UpsertThemeDto } from './themes.validator.js';
import * as themesService from './themes.service.js';

export const getThemeHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { username } = req.params as { username: string };
  const theme = await themesService.getThemeByUsername(username);
  res.status(200).json({ data: theme });
});

export const putThemeHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  const dto = req.body as UpsertThemeDto;
  const theme = await themesService.putTheme(req.user.id, dto);
  res.status(200).json({ data: theme });
});
