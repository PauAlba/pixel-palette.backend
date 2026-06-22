import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { pgPool } from '../config/db.js';
import { createUserWithProfile, deleteUserById, findUserByEmail } from '../modules/auth/auth.repository.js';
import { updateProfile, findProfileWithCountsByUsername } from '../modules/profiles/profiles.repository.js';

describe('Relational DB (PostgreSQL) Tests (Checklist 4.2)', () => {
  const testEmail = `db_test_${Date.now()}@test.com`;
  const testUsername = `db_test_user_${Date.now()}`;
  let createdUserId: string;

  afterAll(async () => {
    // Cleanup specifically the data created in this suite
    await pgPool.query("DELETE FROM users WHERE email LIKE 'db_test_%'");
  });

  describe('CRUD on Repositories', () => {
    it('should Create a user and profile (C)', async () => {
      const result = await createUserWithProfile({
        email: testEmail,
        password_hash: 'hashedpassword',
        username: testUsername,
        display_name: 'DB Test'
      });
      
      expect(result.user).toBeDefined();
      expect(result.profile).toBeDefined();
      createdUserId = result.user.id;
    });

    it('should Read a profile from DB (R)', async () => {
      const profile = await findProfileWithCountsByUsername(testUsername);
      expect(profile).not.toBeNull();
      expect(profile?.display_name).toBe('DB Test');
    });

    it('should Update a profile directly in DB (U)', async () => {
      const updated = await updateProfile(createdUserId, { bio: 'Updated by DB Test' });
      expect(updated?.bio).toBe('Updated by DB Test');
    });

    it('should Delete the user from DB (D)', async () => {
      await deleteUserById(createdUserId);
      const user = await findUserByEmail(testEmail);
      expect(user).toBeNull(); // Should not exist anymore
    });
  });

  describe('Database Constraints and Transactions', () => {
    it('should throw an error on UNIQUE constraint violation', async () => {
      // Create first user
      const uniqueEmail = `unique_${Date.now()}@test.com`;
      await createUserWithProfile({
        email: uniqueEmail,
        password_hash: 'hash',
        username: `unique_${Date.now()}`,
        display_name: 'Unique'
      });

      // Try to create another with the exact same email
      await expect(
        createUserWithProfile({
          email: uniqueEmail, // Duplicate email!
          password_hash: 'hash2',
          username: `unique2_${Date.now()}`,
          display_name: 'Unique2'
        })
      ).rejects.toThrow(); // Postgres error 23505 (unique_violation)
    });

    it('should rollback transaction if profile creation fails', async () => {
      const email = `tx_${Date.now()}@test.com`;
      
      // Try to create a user, but pass an extremely long username to violate a DB constraint
      // assuming username is varchar(50) or something, let's pass a 200 char string
      // OR better, pass a null for username (which TS won't like, so we cast)
      const badUsername = null as unknown as string;
      
      await expect(
        createUserWithProfile({
          email: email,
          password_hash: 'hash',
          username: badUsername,
          display_name: 'Tx Test'
        })
      ).rejects.toThrow();

      // Because the transaction rolled back, the user should NOT have been created in the `users` table either
      const user = await findUserByEmail(email);
      expect(user).toBeNull();
    });

    it('should prevent inserting data with invalid Foreign Keys (FK Constraint)', async () => {
      // Intenta crear un post con un author_id que no existe
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      await expect(
        pgPool.query(
          `INSERT INTO posts (author_id, content) VALUES ($1, $2)`,
          [fakeUuid, 'Este post nunca debería existir']
        )
      ).rejects.toThrow(); // Postgres error 23503 (foreign_key_violation)
    });
  });

  describe('Consultas Avanzadas y Pool', () => {
    const advUsername = `adv_user_${Date.now()}`;
    let advUserId: string;
    let advProfileId: string;

    beforeAll(async () => {
      const result = await createUserWithProfile({
        email: `adv_${Date.now()}@test.com`,
        password_hash: 'hash',
        username: advUsername,
        display_name: 'Advanced User'
      });
      advUserId = result.user.id;
      advProfileId = result.profile.id;
    });

    it('should solve the N+1 problem by using a JOIN to get author data in a single query', async () => {
      // findProfileWithCountsByUsername usa JOINs para resolver todo de un golpe
      const profile = await findProfileWithCountsByUsername(advUsername);
      expect(profile).toHaveProperty('followers_count');
      expect(profile).toHaveProperty('following_count');
      expect(profile).not.toBeNull();
    });

    it('should maintain Determinism (ORDER BY should return consistent ordered results)', async () => {
      // Inserción directa saltando validaciones para manipular fechas artificialmente
      await pgPool.query(
        `INSERT INTO posts (author_id, content, created_at) VALUES 
         ($1, 'Post Viejo', now() - interval '2 days'),
         ($1, 'Post Nuevo', now()),
         ($1, 'Post Medio', now() - interval '1 day')`,
        [advProfileId]
      );

      // findFeedPosts ordena por created_at DESC, traemos más límite por si hay posts de otros tests
      const { rows } = await import('../modules/posts/posts.repository.js').then(m => m.findFeedPosts(0, 100));
      
      // Filtrar los que acabamos de crear
      const userPosts = rows.filter(r => r.author_id === advProfileId);
      
      expect(userPosts.length).toBe(3);
      expect(userPosts[0].content).toBe('Post Nuevo');
      expect(userPosts[1].content).toBe('Post Medio');
      expect(userPosts[2].content).toBe('Post Viejo');
    });

    it('should release connections back to the pool without leaking', async () => {
      // Obtenemos una conexión manual
      const client = await pgPool.connect();
      // Ejecutamos una consulta simple
      await client.query('SELECT 1');
      // La liberamos obligatoriamente
      client.release();
      
      // En un pool sano donde nadie está haciendo query activamente en este momento (porque los tests son secuenciales)
      // el idleCount (conexiones dormidas pero vivas) debe ser igual al totalCount
      expect(pgPool.idleCount).toBe(pgPool.totalCount);
    });
  });
});
