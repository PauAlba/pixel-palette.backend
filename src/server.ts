import { app } from './app.js';
import { env } from './config/env.js';
import { connectPostgres, connectMongo } from './config/db.js';
import { logger } from './config/logger.js';

async function main(): Promise<void> {
  await connectPostgres();
  await connectMongo();

  app.listen(Number(env.PORT), () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, '🚀 Pixel Palette API ready');
  });
}

main().catch((err: unknown) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
