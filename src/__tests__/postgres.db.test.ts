import { describe, it, expect, afterAll } from 'vitest';
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
  });
});
