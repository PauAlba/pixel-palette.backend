import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { pgPool } from '../config/db.js';

describe('Posts API Flow (Checklist 4.1)', () => {
  const testUser = {
    email: `p1_${Date.now()}@test.com`,
    password: 'Password123',
    username: `pu_${Date.now()}`,
    display_name: 'Post User'
  };

  const otherUser = {
    email: `p2_${Date.now()}@test.com`,
    password: 'Password123',
    username: `ou_${Date.now()}`,
    display_name: 'Other User'
  };

  let userToken: string;
  let otherToken: string;
  let createdPostId: string;

  beforeAll(async () => {
    // Register test user 1
    let res = await request(app).post('/api/auth/signup').send(testUser);
    userToken = res.body.data.accessToken;

    // Register test user 2
    res = await request(app).post('/api/auth/signup').send(otherUser);
    otherToken = res.body.data.accessToken;
  });

  afterAll(async () => {
    // Cleanup will cascade to profiles and posts
    await pgPool.query('DELETE FROM users WHERE email IN ($1, $2)', [testUser.email, otherUser.email]);
  });

  describe('Create Post (Validations and Auth)', () => {
    it('should return 401 Unauthorized if no token is provided', async () => {
      const res = await request(app).post('/api/posts').send({ content: 'Hello' });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AppError'); // Or whatever the error middleware returns
    });

    it('should return 400 Bad Request if content is missing (Schema validation)', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'No content' });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Validation failed');
    });

    it('should return 400 Bad Request if types are incorrect (e.g., tags is string instead of array)', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Hello', tags: 'invalid-tag-format' });
      expect(res.status).toBe(400);
    });

    it('should create a post successfully and return correct schema', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'My first integration test post!', tags: ['test'] });
      
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(typeof res.body.data.id).toBe('string');
      expect(res.body.data.content).toBe('My first integration test post!');
      
      createdPostId = res.body.data.id;
    });
  });

  describe('Read Posts (Pagination and 404)', () => {
    it('should get posts with pagination (limit and page)', async () => {
      const res = await request(app).get('/api/posts?page=1&limit=2');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('limit');
      expect(res.body.data.limit).toBe(2);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('should return 404 Not Found for a non-existent post ID', async () => {
      // Fake UUID
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app).get(`/api/posts/${fakeId}`);
      expect(res.status).toBe(404);
    });
  });

  describe('Update and Delete (Authorization and Idempotency)', () => {
    it('should return 403 Forbidden when trying to delete someone else\'s post', async () => {
      const res = await request(app)
        .delete(`/api/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${otherToken}`);
      expect(res.status).toBe(403);
    });

    it('should allow the owner to delete their post', async () => {
      const res = await request(app)
        .delete(`/api/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(204);
    });

    it('should return 404 when trying to delete a post that was already deleted (Idempotency concept)', async () => {
      const res = await request(app)
        .delete(`/api/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(404);
    });
  });
});
