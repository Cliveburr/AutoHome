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
import {
  type ModuleAdoptionFailure,
  type ModuleAvailability,
  ModuleInventoryService,
  type ModuleFilters,
} from './modules.js';
import { type OrganizationFailure, OrganizationService } from './organization.js';
import { InMemoryModuleTransport, type TransportEvent } from './transport.js';

export interface AppDependencies {
  database?: Database;
  config?: AppConfig;
  simulatedTransport?: InMemoryModuleTransport;
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

function organizationError(
  failure: OrganizationFailure,
  requestId: string,
): {
  statusCode: number;
  code: string;
  message: string;
  requestId: string;
  details: Record<string, never>;
} {
  const errors = {
    area_not_found: { statusCode: 404, code: 'AREA_NOT_FOUND', message: 'Area nao encontrada.' },
    room_not_found: { statusCode: 404, code: 'ROOM_NOT_FOUND', message: 'Comodo nao encontrado.' },
    area_in_use: {
      statusCode: 409,
      code: 'AREA_IN_USE',
      message: 'A area possui comodos vinculados e nao pode ser excluida.',
    },
    room_in_use: {
      statusCode: 409,
      code: 'ROOM_IN_USE',
      message: 'O comodo possui modulos vinculados e nao pode ser excluido.',
    },
  } as const;
  const error = errors[failure];

  return { ...error, details: {}, requestId };
}

function moduleAdoptionError(
  failure: ModuleAdoptionFailure,
  requestId: string,
): {
  statusCode: number;
  code: string;
  message: string;
  requestId: string;
  details: Record<string, never>;
} {
  const errors = {
    module_not_found: {
      statusCode: 404,
      code: 'DISCOVERED_MODULE_NOT_FOUND',
      message: 'Modulo descoberto nao encontrado.',
    },
    module_already_adopted: {
      statusCode: 409,
      code: 'MODULE_ALREADY_ADOPTED',
      message: 'O modulo ja foi adotado.',
    },
  } as const;
  const error = errors[failure];

  return { ...error, details: {}, requestId };
}

function isPosition(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.length > 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isModuleAvailability(value: unknown): value is ModuleAvailability {
  return value === 'online' || value === 'offline';
}

function moduleFiltersFromQuery(query: Record<string, unknown>): ModuleFilters | undefined {
  const { protocolId, family, capability, transport, availability } = query;
  if (
    (protocolId !== undefined && (typeof protocolId !== 'string' || !protocolId)) ||
    (family !== undefined && (typeof family !== 'string' || !family)) ||
    (capability !== undefined && (typeof capability !== 'string' || !capability)) ||
    (transport !== undefined && transport !== 'simulated') ||
    (availability !== undefined && !isModuleAvailability(availability))
  ) {
    return undefined;
  }

  return {
    ...(typeof protocolId === 'string' ? { protocolId } : {}),
    ...(typeof family === 'string' ? { family } : {}),
    ...(typeof capability === 'string' ? { capability } : {}),
    ...(transport === 'simulated' ? { transport } : {}),
    ...(isModuleAvailability(availability) ? { availability } : {}),
  };
}

function transportEventLogData(event: TransportEvent): Record<string, string> {
  switch (event.type) {
    case 'module.discovered':
      return {
        type: event.type,
        protocolId: event.module.protocolId,
        family: event.module.family,
      };
    case 'module.state':
      return { type: event.type, protocolId: event.protocolId };
    case 'operation.confirmed':
      return {
        type: event.type,
        protocolId: event.protocolId,
        operation: event.operation,
        correlationId: event.correlationId,
      };
    case 'module.unavailable':
      return { type: event.type, protocolId: event.protocolId, operation: event.operation };
    case 'ota.transfer_failed':
      return { type: event.type, protocolId: event.protocolId };
  }
}

export function buildApp({ database, config, simulatedTransport }: AppDependencies = {}) {
  const app = Fastify({ logger: { base: { component: 'api' } } });
  const audit = database ? new AuditService(database) : undefined;
  const authentication = database
    ? new AuthenticationService(database, config?.bootstrapAdminPassword, audit)
    : undefined;
  const organization = database && audit ? new OrganizationService(database, audit) : undefined;
  const modules = database && audit ? new ModuleInventoryService(database, audit) : undefined;
  const developmentTransport =
    config?.nodeEnv === 'development'
      ? (simulatedTransport ?? new InMemoryModuleTransport())
      : undefined;

  developmentTransport?.subscribe((event) => {
    app.log.info(
      { transportEvent: transportEventLogData(event) },
      'Simulated module transport event',
    );
    void modules?.handleTransportEvent(event).catch((error: unknown) => {
      app.log.error(
        { err: error, transportEvent: transportEventLogData(event) },
        'Unable to persist simulated module transport event',
      );
    });
  });

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

  if (developmentTransport) {
    app.post<{
      Body: { protocolId?: unknown; family?: unknown; capabilities?: unknown; state?: unknown };
    }>('/api/v1/development/simulated-modules', async (request, reply) => {
      const { protocolId, family, capabilities, state } = request.body ?? {};
      if (
        typeof protocolId !== 'string' ||
        !protocolId ||
        typeof family !== 'string' ||
        !family ||
        !isStringList(capabilities) ||
        (state !== undefined && !isRecord(state))
      ) {
        return reply.status(400).send({
          code: 'BAD_REQUEST',
          message: 'protocolId, family, capabilities e state devem ser validos.',
          details: {},
          requestId: request.id,
        });
      }

      try {
        const module = developmentTransport.registerModule({
          protocolId,
          family,
          capabilities,
          ...(state === undefined ? {} : { state }),
        });
        return reply.status(201).send({ module });
      } catch (error) {
        return reply.status(409).send({
          code: 'SIMULATED_MODULE_EXISTS',
          message: error instanceof Error ? error.message : 'Modulo simulado ja registrado.',
          details: {},
          requestId: request.id,
        });
      }
    });
  }

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

    if (organization) {
      app.get(
        '/api/v1/areas',
        { preHandler: authorization.requireAdministrativeAccess },
        async () => ({ areas: await organization.listAreas() }),
      );

      app.post<{ Body: { name?: string; position?: unknown } }>(
        '/api/v1/areas',
        { preHandler: authorization.requireAdministrativeAccess },
        async (request, reply) => {
          const name = request.body?.name?.trim();
          const { position } = request.body ?? {};
          if (!name || (position !== undefined && !isPosition(position))) {
            return reply.status(400).send({
              code: 'BAD_REQUEST',
              message: 'Nome e posicao valida sao obrigatorios.',
              details: {},
              requestId: request.id,
            });
          }

          const area = await organization.createArea(
            name,
            position,
            request.authenticatedSession!,
            request.ip,
          );
          return reply.status(201).send({ area });
        },
      );

      app.patch<{ Params: { areaId: string }; Body: { name?: string; position?: unknown } }>(
        '/api/v1/areas/:areaId',
        { preHandler: authorization.requireAdministrativeAccess },
        async (request, reply) => {
          const name = request.body?.name?.trim();
          const { position } = request.body ?? {};
          if (
            (request.body?.name !== undefined && !name) ||
            (position !== undefined && !isPosition(position)) ||
            (name === undefined && position === undefined)
          ) {
            return reply.status(400).send({
              code: 'BAD_REQUEST',
              message: 'Informe um nome ou uma posicao valida.',
              details: {},
              requestId: request.id,
            });
          }

          const result = await organization.updateArea(
            request.params.areaId,
            {
              ...(name !== undefined ? { name } : {}),
              ...(position !== undefined ? { position } : {}),
            },
            request.authenticatedSession!,
            request.ip,
          );
          if (result.failure) {
            const error = organizationError(result.failure, request.id);
            return reply.status(error.statusCode).send(error);
          }
          return { area: result.value };
        },
      );

      app.delete<{ Params: { areaId: string } }>(
        '/api/v1/areas/:areaId',
        { preHandler: authorization.requireAdministrativeAccess },
        async (request, reply) => {
          const result = await organization.deleteArea(
            request.params.areaId,
            request.authenticatedSession!,
            request.ip,
          );
          if (result.failure) {
            const error = organizationError(result.failure, request.id);
            return reply.status(error.statusCode).send(error);
          }
          return reply.status(204).send();
        },
      );

      app.get(
        '/api/v1/rooms',
        { preHandler: authorization.requireAdministrativeAccess },
        async () => ({ rooms: await organization.listRooms() }),
      );

      app.post<{ Body: { name?: string; areaId?: unknown; position?: unknown } }>(
        '/api/v1/rooms',
        { preHandler: authorization.requireAdministrativeAccess },
        async (request, reply) => {
          const name = request.body?.name?.trim();
          const { areaId, position } = request.body ?? {};
          if (
            !name ||
            (areaId !== undefined && typeof areaId !== 'string') ||
            (position !== undefined && !isPosition(position))
          ) {
            return reply.status(400).send({
              code: 'BAD_REQUEST',
              message: 'Nome, area e posicao devem ser validos.',
              details: {},
              requestId: request.id,
            });
          }

          const result = await organization.createRoom(
            name,
            areaId,
            position,
            request.authenticatedSession!,
            request.ip,
          );
          if (result.failure) {
            const error = organizationError(result.failure, request.id);
            return reply.status(error.statusCode).send(error);
          }
          return reply.status(201).send({ room: result.value });
        },
      );

      app.patch<{
        Params: { roomId: string };
        Body: { name?: string; areaId?: unknown; position?: unknown };
      }>(
        '/api/v1/rooms/:roomId',
        { preHandler: authorization.requireAdministrativeAccess },
        async (request, reply) => {
          const name = request.body?.name?.trim();
          const { areaId, position } = request.body ?? {};
          const hasAreaId = Object.hasOwn(request.body ?? {}, 'areaId');
          if (
            (request.body?.name !== undefined && !name) ||
            (hasAreaId && areaId !== null && typeof areaId !== 'string') ||
            (position !== undefined && !isPosition(position)) ||
            (name === undefined && !hasAreaId && position === undefined)
          ) {
            return reply.status(400).send({
              code: 'BAD_REQUEST',
              message: 'Informe nome, area ou posicao valida.',
              details: {},
              requestId: request.id,
            });
          }

          const result = await organization.updateRoom(
            request.params.roomId,
            {
              ...(name !== undefined ? { name } : {}),
              ...(hasAreaId ? { areaId: areaId as string | null } : {}),
              ...(position !== undefined ? { position } : {}),
            },
            request.authenticatedSession!,
            request.ip,
          );
          if (result.failure) {
            const error = organizationError(result.failure, request.id);
            return reply.status(error.statusCode).send(error);
          }
          return { room: result.value };
        },
      );

      app.delete<{ Params: { roomId: string } }>(
        '/api/v1/rooms/:roomId',
        { preHandler: authorization.requireAdministrativeAccess },
        async (request, reply) => {
          const result = await organization.deleteRoom(
            request.params.roomId,
            request.authenticatedSession!,
            request.ip,
          );
          if (result.failure) {
            const error = organizationError(result.failure, request.id);
            return reply.status(error.statusCode).send(error);
          }
          return reply.status(204).send();
        },
      );
    }

    if (modules) {
      app.get<{ Querystring: Record<string, unknown> }>(
        '/api/v1/discovery',
        { preHandler: authorization.requireAdministrativeAccess },
        async (request, reply) => {
          const filters = moduleFiltersFromQuery(request.query);
          if (!filters) {
            return reply.status(400).send({
              code: 'BAD_REQUEST',
              message: 'Filtros de descoberta invalidos.',
              details: {},
              requestId: request.id,
            });
          }
          return { modules: await modules.listDiscovered(filters) };
        },
      );

      app.post<{ Params: { protocolId: string } }>(
        '/api/v1/discovery/:protocolId/adopt',
        { preHandler: authorization.requireAdministrativeAccess },
        async (request, reply) => {
          if (!request.params.protocolId) {
            return reply.status(400).send({
              code: 'BAD_REQUEST',
              message: 'protocolId e obrigatorio.',
              details: {},
              requestId: request.id,
            });
          }
          const result = await modules.adopt(
            request.params.protocolId,
            request.authenticatedSession!,
            request.ip,
          );
          if ('failure' in result) {
            const error = moduleAdoptionError(result.failure, request.id);
            return reply.status(error.statusCode).send(error);
          }
          return { module: result.module };
        },
      );

      app.get<{ Querystring: Record<string, unknown> }>(
        '/api/v1/modules',
        { preHandler: authorization.requireAuthentication },
        async (request, reply) => {
          const filters = moduleFiltersFromQuery(request.query);
          if (!filters) {
            return reply.status(400).send({
              code: 'BAD_REQUEST',
              message: 'Filtros de modulos invalidos.',
              details: {},
              requestId: request.id,
            });
          }
          return { modules: await modules.listRegistered(filters) };
        },
      );
    }
  }

  return app;
}
