import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { createPostSchema, updatePostSchema } from './posts.validator.js';
import { createCommentSchema } from '../comments/comments.validator.js';
import {
  getFeedHandler,
  getPostHandler,
  createPostHandler,
  updatePostHandler,
  deletePostHandler,
} from './posts.controller.js';
import {
  getCommentsHandler,
  createCommentHandler,
  likePostHandler,
  unlikePostHandler,
} from '../comments/comments.controller.js';

export const postsRouter = Router();

// Feed & detail
postsRouter.get('/', getFeedHandler);
postsRouter.get('/:id', getPostHandler);

// Post CRUD (protected)
postsRouter.post('/', requireAuth, validate(createPostSchema), createPostHandler);
postsRouter.patch('/:id', requireAuth, validate(updatePostSchema), updatePostHandler);
postsRouter.delete('/:id', requireAuth, deletePostHandler);

// Comments on a post
postsRouter.get('/:postId/comments', getCommentsHandler);
postsRouter.post('/:postId/comments', requireAuth, validate(createCommentSchema), createCommentHandler);

// Likes on a post
postsRouter.post('/:postId/like', requireAuth, likePostHandler);
postsRouter.delete('/:postId/like', requireAuth, unlikePostHandler);
