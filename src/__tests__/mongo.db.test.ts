import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { UserTheme } from '../models/mongo/userTheme.model.js';

describe('NoSQL DB (MongoDB) Tests (Checklist 4.3)', () => {

  afterEach(async () => {
    // Colecciones limpias entre tests (Punto del checklist)
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  describe('Document Validations', () => {
    it('should create a UserTheme with valid data', async () => {
      const theme = new UserTheme({ userId: 'user_123', customCss: 'body { color: red; }' });
      const savedTheme = await theme.save();
      expect(savedTheme.userId).toBe('user_123');
      expect(savedTheme.customCss).toBe('body { color: red; }');
      expect(savedTheme.backgroundPattern).toBe('none'); // Default
    });

    it('should fail validation if required field (userId) is missing', async () => {
      const theme = new UserTheme({ customCss: 'body { color: red; }' });
      let error;
      try {
        await theme.save();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect((error as any).name).toBe('ValidationError');
      expect((error as any).errors.userId).toBeDefined();
    });

    it('should fail validation if backgroundPattern is not in the allowed ENUM', async () => {
      const theme = new UserTheme({ userId: 'user_456', backgroundPattern: 'invalid_pattern' });
      let error;
      try {
        await theme.save();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect((error as any).name).toBe('ValidationError');
      expect((error as any).errors.backgroundPattern).toBeDefined();
    });
  });
});
