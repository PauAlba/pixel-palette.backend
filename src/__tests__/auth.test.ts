import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { pgPool } from '../config/db.js';
import mongoose from 'mongoose';

describe('Auth Flow', () => {
  const testUser = {
    email: `test_${Date.now()}@test.com`,
    password: 'Password123',
    username: `user_${Date.now()}`,
    display_name: 'Test User'
  };

  let accessToken: string;
  let refreshToken: string;

  afterAll(async () => {
    await pgPool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
  });

  it('should signup a new user', async () => {
    const res = await request(app).post('/api/auth/signup').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('should not signup with existing email', async () => {
    const res = await request(app).post('/api/auth/signup').send(testUser);
    expect(res.status).toBe(409);
  });

  it('should login', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    accessToken = res.body.data.accessToken;
  });

  it('should fail login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'wrongpassword'
    });
    expect(res.status).toBe(401);
  });

  it('should get current user profile (/me)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBeUndefined(); // Email not exposed
    expect(res.body.data.username).toBe(testUser.username);
  });

  it('should refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({
      refreshToken
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
  });
});
