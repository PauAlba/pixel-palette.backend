import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { pgPool } from '../config/db.js';

describe('Security Injections', () => {
  let token: string;
  const user = { email: `inj_${Date.now()}@test.com`, password: 'pw', username: `inj_${Date.now()}`, display_name: 'Inj' };

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/signup').send(user);
    token = res.body.data.accessToken;
  });

  afterAll(async () => {
    await pgPool.query('DELETE FROM users WHERE email = $1', [user.email]);
  });

  it('should prevent SQL injection in profile lookup', async () => {
    const maliciousUsername = "test' OR '1'='1";
    const res = await request(app).get(`/api/profiles/${encodeURIComponent(maliciousUsername)}`);
    // Parameterized queries will just not find this user (404) rather than executing the SQL
    expect(res.status).toBe(404);
  });

  it('should sanitize stored XSS in themes', async () => {
    const xssPayload = 'body { color: red; } <script>alert("xss")</script>';
    const res = await request(app)
      .put('/api/themes/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customCss: xssPayload,
        backgroundPattern: 'none',
        musicUrl: ''
      });

    expect(res.status).toBe(200);
    // The script tag should be stripped by sanitizeCss
    expect(res.body.data.customCss).not.toContain('<script>');
    expect(res.body.data.customCss).toContain('body { color: red; }');
  });
});
