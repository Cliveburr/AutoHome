import Fastify from 'fastify';
import { type Database } from './database.js';

export interface AppDependencies {
  database?: Database;
}

function getErrorStatusCode(error: unknown): number {
  if (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof error.statusCode === 'number' &&
    error.statusCode < 500
  ) {
    return error.statusCode;
  }

  return 500;
}

export function buildApp({ database }: AppDependencies = {}) {
  const app = Fastify({ logger: { base: { component: 'api' } } });

  if (database) {
    app.addHook('onClose', async () => {
      await database.close();
    });
  }

  app.addHook('onRequest', async (request) => {
    request.log.info({ requestId: request.id }, 'Request received');
  });

  app.setNotFoundHandler(async (request, reply) => {
    return reply.status(404).send({
      code: 'NOT_FOUND',
      message: 'Recurso nao encontrado.',
      details: {},
      requestId: request.id,
    });
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error, requestId: request.id }, 'Request failed');

    const statusCode = getErrorStatusCode(error);
    const code = statusCode === 400 ? 'BAD_REQUEST' : 'INTERNAL_ERROR';
    const message =
      statusCode === 400 ? 'A requisicao nao pode ser processada.' : 'Ocorreu um erro interno.';

    return reply.status(statusCode).send({
      code,
      message,
      details: {},
      requestId: request.id,
    });
  });

  app.get('/', async () => ({ message: 'AutoHome Central API initialized' }));
  app.get('/api/v1/health', async (_request, reply) => {
    if (database && !(await database.isAvailable())) {
      return reply.status(503).send({ status: 'unavailable' });
    }

    return { status: 'ok' };
  });

  return app;
}
