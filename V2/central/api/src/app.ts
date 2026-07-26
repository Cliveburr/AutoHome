import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import { AuditService } from './audit.js';
import {
  AuthenticationService,
  type UserManagementFailure,
  type UserRole,
} from './authentication.js';
import { AuthorizationService } from './authorization.js';
import { type AppConfig } from './config.js';
import { type Database } from './database.js';

export interface AppDependencies {
  database?: Database;
  config?: AppConfig;
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

function isUserRole(value: unknown): value is UserRole {
  return value === 'basico' || value === 'administrador';
}

function userManagementError(
  failure: UserManagementFailure,
  requestId: string,
): {
  statusCode: number;
  code: string;
  message: string;
  requestId: string;
  details: Record<string, never>;
} {
  const errors = {
    user_not_found: { statusCode: 404, code: 'USER_NOT_FOUND', message: 'Usuario nao encontrado.' },
    username_taken: {
      statusCode: 409,
      code: 'USERNAME_TAKEN',
      message: 'O nome de usuario ja esta em uso.',
    },
    last_active_administrator: {
      statusCode: 409,
      code: 'LAST_ACTIVE_ADMINISTRATOR',
      message: 'A instalacao deve manter ao menos um administrador ativo.',
    },
  } as const;
  const error = errors[failure];

  return { ...error, details: {}, requestId };
}

export function buildApp({ database, config }: AppDependencies = {}) {
  const app = Fastify({ logger: { base: { component: 'api' } } });
  const audit = database ? new AuditService(database) : undefined;
  const authentication = database
    ? new AuthenticationService(database, config?.bootstrapAdminPassword, audit)
    : undefined;

  if (config) {
    app.register(cookie, { secret: config.sessionSecret });
  }

  if (database) {
    app.addHook('onClose', async () => {
      await database.close();
    });
  }

  if (authentication) {
    app.addHook('onReady', async () => {
      await authentication.initialize();
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

  if (authentication && config) {
    const sessionCookie = 'autohome_session';
    const authorization = new AuthorizationService(authentication, sessionCookie);
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: config.nodeEnv === 'production',
      path: '/',
    };

    app.post<{ Body: { username?: string; password?: string } }>(
      '/api/v1/auth/login',
      async (request, reply) => {
        const { username, password } = request.body ?? {};
        if (!username || !password) {
          return reply.status(400).send({
            code: 'BAD_REQUEST',
            message: 'Usuario e senha sao obrigatorios.',
            details: {},
            requestId: request.id,
          });
        }

        const session = await authentication.login(username, password, request.ip);
        if (!session) {
          return reply.status(401).send({
            code: 'INVALID_CREDENTIALS',
            message: 'Usuario ou senha invalidos.',
            details: {},
            requestId: request.id,
          });
        }

        reply.setCookie(sessionCookie, session.sessionId, { ...cookieOptions, signed: true });
        return { user: session.user };
      },
    );

    app.get('/api/v1/me', { preHandler: authorization.requireAuthentication }, async (request) => ({
      user: request.authenticatedSession!.user,
    }));

    app.post(
      '/api/v1/auth/logout',
      { preHandler: authorization.requireAuthentication },
      async (request, reply) => {
        await authentication.logout(request.authenticatedSession!.sessionId, request.ip);
        reply.clearCookie(sessionCookie, cookieOptions);
        return reply.status(204).send();
      },
    );

    app.post<{ Body: { currentPassword?: string; newPassword?: string } }>(
      '/api/v1/auth/change-password',
      { preHandler: authorization.requireAuthentication },
      async (request, reply) => {
        const { currentPassword, newPassword } = request.body ?? {};
        if (!currentPassword || !newPassword) {
          return reply.status(400).send({
            code: 'BAD_REQUEST',
            message: 'Senha atual e nova senha sao obrigatorias.',
            details: {},
            requestId: request.id,
          });
        }

        const user = await authentication.changePassword(
          request.authenticatedSession!.sessionId,
          currentPassword,
          newPassword,
          request.ip,
        );
        if (!user) {
          return reply.status(401).send({
            code: 'INVALID_CREDENTIALS',
            message: 'Sessao ou senha atual invalida.',
            details: {},
            requestId: request.id,
          });
        }

        return { user };
      },
    );

    app.get(
      '/api/v1/users',
      { preHandler: authorization.requireAdministrativeAccess },
      async () => ({ users: await authentication.listUsers() }),
    );

    app.post<{ Body: { username?: string; password?: string; role?: unknown } }>(
      '/api/v1/users',
      { preHandler: authorization.requireAdministrativeAccess },
      async (request, reply) => {
        const username = request.body?.username?.trim();
        const { password, role } = request.body ?? {};
        if (!username || !password || !isUserRole(role)) {
          return reply.status(400).send({
            code: 'BAD_REQUEST',
            message: 'Usuario, senha e papel valido sao obrigatorios.',
            details: {},
            requestId: request.id,
          });
        }

        const result = await authentication.createUser(
          username,
          password,
          role,
          request.authenticatedSession!,
          request.ip,
        );
        if (result.failure) {
          const error = userManagementError(result.failure, request.id);
          return reply.status(error.statusCode).send(error);
        }

        return reply.status(201).send({ user: result.user });
      },
    );

    app.patch<{ Params: { userId: string }; Body: { role?: unknown } }>(
      '/api/v1/users/:userId/role',
      { preHandler: authorization.requireAdministrativeAccess },
      async (request, reply) => {
        const { role } = request.body ?? {};
        if (!isUserRole(role)) {
          return reply.status(400).send({
            code: 'BAD_REQUEST',
            message: 'Um papel valido e obrigatorio.',
            details: {},
            requestId: request.id,
          });
        }

        const result = await authentication.changeUserRole(
          request.params.userId,
          role,
          request.authenticatedSession!,
          request.ip,
        );
        if (result.failure) {
          const error = userManagementError(result.failure, request.id);
          return reply.status(error.statusCode).send(error);
        }

        return { user: result.user };
      },
    );

    app.post<{ Params: { userId: string } }>(
      '/api/v1/users/:userId/activate',
      { preHandler: authorization.requireAdministrativeAccess },
      async (request, reply) => {
        const result = await authentication.setUserActive(
          request.params.userId,
          true,
          request.authenticatedSession!,
          request.ip,
        );
        if (result.failure) {
          const error = userManagementError(result.failure, request.id);
          return reply.status(error.statusCode).send(error);
        }

        return { user: result.user };
      },
    );

    app.post<{ Params: { userId: string } }>(
      '/api/v1/users/:userId/deactivate',
      { preHandler: authorization.requireAdministrativeAccess },
      async (request, reply) => {
        const result = await authentication.setUserActive(
          request.params.userId,
          false,
          request.authenticatedSession!,
          request.ip,
        );
        if (result.failure) {
          const error = userManagementError(result.failure, request.id);
          return reply.status(error.statusCode).send(error);
        }

        return { user: result.user };
      },
    );

    app.post<{ Params: { userId: string }; Body: { password?: string } }>(
      '/api/v1/users/:userId/reset-password',
      { preHandler: authorization.requireAdministrativeAccess },
      async (request, reply) => {
        const { password } = request.body ?? {};
        if (!password) {
          return reply.status(400).send({
            code: 'BAD_REQUEST',
            message: 'Uma nova senha e obrigatoria.',
            details: {},
            requestId: request.id,
          });
        }

        const result = await authentication.resetUserPassword(
          request.params.userId,
          password,
          request.authenticatedSession!,
          request.ip,
        );
        if (result.failure) {
          const error = userManagementError(result.failure, request.id);
          return reply.status(error.statusCode).send(error);
        }

        return { user: result.user };
      },
    );
  }

  return app;
}
