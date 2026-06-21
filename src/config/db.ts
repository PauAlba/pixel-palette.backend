import pg from 'pg';
import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

const { Pool } = pg;

// ─── PostgreSQL ───────────────────────────────────────────────────────────────

export const pgPool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pgPool.on('error', (err: Error) => {
  logger.error({ err }, 'Unexpected PostgreSQL pool error');
});

export async function connectPostgres(): Promise<void> {
  const client = await pgPool.connect();
  await client.query('SELECT 1');
  client.release();
  logger.info('PostgreSQL connected');
}

// ─── MongoDB ──────────────────────────────────────────────────────────────────

mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('error', (err: Error) => logger.error({ err }, 'MongoDB error'));

export async function connectMongo(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5_000,
  });
}

export const mongooseConnection = mongoose.connection;

// ─── Health check helpers ─────────────────────────────────────────────────────

export async function isPgHealthy(): Promise<boolean> {
  try {
    const client = await pgPool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch {
    return false;
  }
}

export function isMongoHealthy(): boolean {
  return mongoose.connection.readyState === 1;
}
