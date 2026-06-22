import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { pgPool } from '../config/db.js';

describe('Comments API', () => {
  let token: string;
  let postId: string;
  let commentId: string;
  const testEmail = `comments_test_${Date.now()}@test.com`;

  beforeAll(async () => {
    // 1. Signup a user
    const resAuth = await request(app).post('/api/auth/signup').send({
      email: testEmail,
      password: 'Password123',
      username: `c_${Date.now().toString().slice(-10)}`,
      display_name: 'Commenter'
    });
    token = resAuth.body.data.accessToken;

    // 2. Create a post
    const resPost = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Post for comments' });
    
    postId = resPost.body.data.id;
  });

  afterAll(async () => {
    // Cleanup
    await pgPool.query('DELETE FROM users WHERE email = $1', [testEmail]);
  });

  it('should create a comment on a post', async () => {
    const res = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'This is a test comment' });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.content).toBe('This is a test comment');
    commentId = res.body.data.id;
  });

  it('should list comments for a post', async () => {
    const res = await request(app).get(`/api/posts/${postId}/comments`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expect(res.body.data.data.length).toBeGreaterThan(0);
    expect(res.body.data.data[0].content).toBe('This is a test comment');
  });

  it('should delete a comment', async () => {
    const res = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(204);
  });
});
