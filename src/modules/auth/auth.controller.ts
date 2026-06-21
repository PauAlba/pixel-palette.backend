import { type Request, type Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { type SignupDto, type LoginDto, type RefreshDto } from './auth.validator.js';
import * as authService from './auth.service.js';

export const signupHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const dto = req.body as SignupDto;
  const result = await authService.signup(dto);
  res.status(201).json({ data: result });
});

export const loginHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const dto = req.body as LoginDto;
  const result = await authService.login(dto);
  res.status(200).json({ data: result });
});

export const meHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  const profile = await authService.me(req.user.id);
  res.status(200).json({ data: profile });
});

export const refreshHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as RefreshDto;
  const tokens = await authService.refresh(refreshToken);
  res.status(200).json({ data: tokens });
});
