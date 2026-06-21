import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { pgPool } from '../config/db.js';

describe('Posts CRUD and Ownership', () => {
  const user1 = { email: `u1_${Date.now()}@test.com`, password: 'pw', username: `u1_${Date.now()}`, display_name: 'U1' };
  const user2 = { email: `u2_${Date.now()}@test.com`, password: 'pw', username: `u2_${Date.now()}`, display_name: 'U2' };
  let token1: string;
  let token2: string;
  let postId: string;

  beforeAll(async () => {
    const res1 = await request(app).post('/api/auth/signup').send(user1);
    token1 = res1.body.data.accessToken;
    const res2 = await request(app).post('/api/auth/signup').send(user2);
    token2 = res2.body.data.accessToken;
  });

  afterAll(async () => {
    await pgPool.query('DELETE FROM users WHERE email IN ($1, $2)', [user1.email, user2.email]);
  });

  it('should create a post (user1)', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token1}`)
      .send({ content: 'Hello World', title: 'Test Post', post_type: 'text' });
    expect(res.status).toBe(201);
    postId = res.body.data.id;
  });

  it('should read the post', async () => {
    const res = await request(app).get(`/api/posts/${postId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.content).toBe('Hello World');
  });

  it('should prevent user2 from editing user1 post (403)', async () => {
    const res = await request(app)
      .patch(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ content: 'Hacked' });
    expect(res.status).toBe(403);
  });

  it('should allow user1 to edit their own post', async () => {
    const res = await request(app)
      .patch(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ content: 'Updated Hello' });
    expect(res.status).toBe(200);
    expect(res.body.data.content).toBe('Updated Hello');
  });

  it('should prevent user2 from deleting user1 post (403)', async () => {
    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token2}`);
    expect(res.status).toBe(403);
  });

  it('should allow user1 to delete their own post', async () => {
    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token1}`);
    expect(res.status).toBe(204);
  });
});
