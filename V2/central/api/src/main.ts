import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { Database } from './database.js';

try {
  const config = loadConfig();
  const database = await Database.connect(config.mongodbUri);
  const app = buildApp({ database, config });

  await app.listen({ host: '127.0.0.1', port: config.httpPort });
  app.log.info({ port: config.httpPort }, 'AutoHome Central API initialized');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
