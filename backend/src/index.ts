import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

async function bootstrap(): Promise<void> {
  const app = createApp();

  // Verify database connectivity before accepting traffic.
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
  } catch (error) {
    console.error('❌ Failed to connect to database', error);
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`🚀 ExpenSee API running on http://localhost:${env.port} [${env.nodeEnv}]`);
  });

  // Graceful shutdown.
  const shutdown = (signal: string): void => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      void prisma.$disconnect().finally(() => process.exit(0));
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((error) => {
  console.error('Fatal error during startup', error);
  process.exit(1);
});
