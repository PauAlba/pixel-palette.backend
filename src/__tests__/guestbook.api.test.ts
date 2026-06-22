import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { pgPool } from '../config/db.js';

describe('Guestbook API', () => {
  let token: string;
  let username: string;
  let entryId: string;

  beforeAll(async () => {
    username = `gbuser_${Date.now()}`;

    const res = await request(app).post('/api/auth/signup').send({
      email: `${username}@test.com`,
      password: 'Password123',
      username: username,
      display_name: 'Guestbook User'
    });
    token = res.body.data.accessToken;
  });

  afterAll(async () => {
    // Cleanup
    await pgPool.query('DELETE FROM users WHERE email LIKE $1', ['gbuser%@test.com']);
  });

  it('should create a guestbook entry', async () => {
    const res = await request(app)
      .post(`/api/guestbook/${username}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Welcome to my guestbook!' });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    entryId = res.body.data.id;
  });

  it('should list guestbook entries', async () => {
    const res = await request(app).get(`/api/guestbook/${username}`);
    expect(res.status).toBe(200);
    expect(res.body.data.data.length).toBeGreaterThan(0);
    expect(res.body.data.data[0].message).toBe('Welcome to my guestbook!');
  });

  it('should delete a guestbook entry', async () => {
    const res = await request(app)
      .delete(`/api/guestbook/${entryId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
  });
});
