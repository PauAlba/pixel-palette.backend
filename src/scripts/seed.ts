import mongoose from 'mongoose';
import { pgPool } from '../config/db.js';
import { env } from '../config/env.js';
import * as authService from '../modules/auth/auth.service.js';
import * as postsService from '../modules/posts/posts.service.js';
import * as commentsService from '../modules/comments/comments.service.js';
import * as followersRepository from '../modules/followers/followers.repository.js';
import { logger } from '../config/logger.js';

async function seed() {
  logger.info('Connecting to DBs...');
  await mongoose.connect(env.MONGODB_URI);

  // Clear existing
  logger.info('Clearing database...');
  await pgPool.query('TRUNCATE TABLE users CASCADE');

  logger.info('Creating users...');
  const user1 = await authService.signup({
    email: 'alice@pixel.io', password: 'Password123', username: 'alice', display_name: 'Alice in Wonderland'
  });
  const user2 = await authService.signup({
    email: 'bob@pixel.io', password: 'Password123', username: 'bob', display_name: 'Bob Ross'
  });
  const user3 = await authService.signup({
    email: 'charlie@pixel.io', password: 'Password123', username: 'charlie', display_name: 'Charlie Chaplin'
  });

  logger.info('Creating posts...');
  const p1 = await postsService.createNewPost(user1.profile.id, { content: 'My first pixel art!', post_type: 'text', tags: [], is_featured: false });
  const p2 = await postsService.createNewPost(user2.profile.id, { content: 'Happy little pixels.', post_type: 'text', tags: [], is_featured: false });
  await postsService.createNewPost(user1.profile.id, { content: 'Another masterpiece.', post_type: 'text', tags: [], is_featured: false });
  const p4 = await postsService.createNewPost(user3.profile.id, { content: 'Silent movies were better.', post_type: 'text', tags: [], is_featured: false });
  await postsService.createNewPost(user2.profile.id, { content: 'More happy trees.', post_type: 'text', tags: [], is_featured: false });

  logger.info('Creating comments...');
  await commentsService.addComment(user2.profile.id, p1.id, { content: 'Looks great!' });
  await commentsService.addComment(user3.profile.id, p2.id, { content: 'Very calming.' });
  await commentsService.addComment(user1.profile.id, p4.id, { content: 'I agree.' });

  logger.info('Creating likes...');
  await commentsService.like(user2.profile.id, p1.id);
  await commentsService.like(user3.profile.id, p1.id);
  await commentsService.like(user1.profile.id, p2.id);

  logger.info('Creating followers...');
  await followersRepository.followUser(user1.profile.id, user2.profile.id);
  await followersRepository.followUser(user2.profile.id, user1.profile.id);
  await followersRepository.followUser(user3.profile.id, user1.profile.id);

  logger.info('Seed completed successfully!');
  await mongoose.disconnect();
  await pgPool.end();
  process.exit(0);
}

seed().catch(err => {
  logger.error(err, 'Seed failed');
  process.exit(1);
});
