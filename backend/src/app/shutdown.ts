import type { Server } from 'node:http';

import type { Logger } from 'pino';

export function registerGracefulShutdown(
  server: Server,
  logger: Logger,
  closeDependencies: () => Promise<void>,
): void {
  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Graceful shutdown started');
    server.close((error) => {
      void (async () => {
        if (error) logger.error({ err: error }, 'HTTP server close failed');
        try {
          await closeDependencies();
          logger.info('Graceful shutdown complete');
          process.exit(error ? 1 : 0);
        } catch (closeError) {
          logger.error({ err: closeError }, 'Dependency shutdown failed');
          process.exit(1);
        }
      })();
    });
    setTimeout(() => {
      logger.error('Graceful shutdown timed out');
      process.exit(1);
    }, 30_000).unref();
  };
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}
