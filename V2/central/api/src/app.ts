import Fastify from 'fastify';

export function buildApp() {
  const app = Fastify();

  app.get('/', async () => ({ message: 'AutoHome Central API initialized' }));

  return app;
}
