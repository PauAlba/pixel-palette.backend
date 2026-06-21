import { type Request, type Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { type CreateGuestbookDto } from './guestbook.validator.js';
import * as guestbookService from './guestbook.service.js';

export const getGuestbookHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { username } = req.params as { username: string };
  const result = await guestbookService.getGuestbook(username, req.query['page'], req.query['limit']);
  res.status(200).json({ data: result });
});

export const createGuestbookHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  const { username } = req.params as { username: string };
  const dto = req.body as CreateGuestbookDto;
  const entry = await guestbookService.addGuestbookEntry(req.user.id, username, dto);
  res.status(201).json({ data: entry });
});

export const deleteGuestbookHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  const { id } = req.params as { id: string };
  await guestbookService.removeGuestbookEntry(req.user.id, id);
  res.status(204).send();
});

export const getAllGuestbooksHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await guestbookService.getAllGuestbooks(req.query['page'], req.query['limit']);
  res.status(200).json({ data: result });
});
