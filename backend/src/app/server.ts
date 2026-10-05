import { createServer } from 'node:http';

import { createApp } from './app.js';
import { createContainer } from './container.js';
import { loadEnv } from '../config/env.js';
import { registerGracefulShutdown } from './shutdown.js';
import { initializeSentry } from '../shared/infrastructure/sentry.js';

const config = loadEnv();
initializeSentry(config);
const container = createContainer(config);
const app = createApp(config, container.logger, container, container.metrics);
const server = createServer(app);

server.requestTimeout = 30_000;
server.headersTimeout = 35_000;
server.keepAliveTimeout = 5_000;

server.listen(config.PORT, '0.0.0.0', () => {
  container.logger.info(
    { port: config.PORT, environment: config.NODE_ENV },
    'API server listening',
  );
});

registerGracefulShutdown(server, container.logger, container.close);
