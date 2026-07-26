import { buildApp } from './app.js';
import { loadConfig } from './config.js';

try {
  const config = loadConfig();
  const app = buildApp();

  await app.listen({ host: '127.0.0.1', port: config.httpPort });
  app.log.info({ port: config.httpPort }, 'AutoHome Central API initialized');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
