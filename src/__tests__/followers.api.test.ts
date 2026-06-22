import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { pgPool } from '../config/db.js';

describe('Followers API', () => {
  let token1: string;
  let username1: string;
  let token2: string;
  let username2: string;

  beforeAll(async () => {
    username1 = `user1_${Date.now()}`;
    username2 = `user2_${Date.now()}`;

    // Create user 1
    const res1 = await request(app).post('/api/auth/signup').send({
      email: `${username1}@test.com`,
      password: 'Password123',
      username: username1,
      display_name: 'Follower 1'
    });
    token1 = res1.body.data.accessToken;

    // Create user 2
    const res2 = await request(app).post('/api/auth/signup').send({
      email: `${username2}@test.com`,
      password: 'Password123',
      username: username2,
      display_name: 'Follower 2'
    });
    token2 = res2.body.data.accessToken;
  });

  afterAll(async () => {
    // Cleanup
    await pgPool.query('DELETE FROM users WHERE email LIKE $1', ['user%@test.com']);
  });

  it('should follow a user', async () => {
    // user 1 follows user 2
    const res = await request(app)
      .post(`/api/followers/${username2}`)
      .set('Authorization', `Bearer ${token1}`);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toMatch(/following/i);
  });

  it('should not allow following already followed user', async () => {
    const res = await request(app)
      .post(`/api/followers/${username2}`)
      .set('Authorization', `Bearer ${token1}`);

    expect(res.status).toBe(409); // Usually a 400 or 409
  });

  it('should list followers of user 2', async () => {
    const res = await request(app).get(`/api/profiles/${username2}/followers`);
    expect(res.status).toBe(200);
    expect(res.body.data.data.length).toBeGreaterThan(0);
  });

  it('should list following of user 1', async () => {
    const res = await request(app).get(`/api/profiles/${username1}/following`);
    expect(res.status).toBe(200);
    expect(res.body.data.data.length).toBeGreaterThan(0);
  });

  it('should unfollow a user', async () => {
    const res = await request(app)
      .delete(`/api/followers/${username2}`)
      .set('Authorization', `Bearer ${token1}`);

    expect(res.status).toBe(200);
  });
});
