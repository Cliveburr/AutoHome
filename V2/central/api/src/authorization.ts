import { type FastifyReply, type FastifyRequest } from 'fastify';
import {
  type AuthenticatedSession,
  type AuthenticationService,
  type UserRole,
} from './authentication.js';

declare module 'fastify' {
  interface FastifyRequest {
    authenticatedSession?: AuthenticatedSession;
  }
}

function unauthenticated(request: FastifyRequest, reply: FastifyReply): void {
  void reply.status(401).send({
    code: 'UNAUTHENTICATED',
    message: 'Autenticacao obrigatoria.',
    details: {},
    requestId: request.id,
  });
}

function forbidden(request: FastifyRequest, reply: FastifyReply): void {
  void reply.status(403).send({
    code: 'FORBIDDEN',
    message: 'Voce nao tem permissao para executar esta acao.',
    details: {},
    requestId: request.id,
  });
}

type AuthorizationHook = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

export class AuthorizationService {
  constructor(
    private readonly authentication: AuthenticationService,
    private readonly sessionCookie: string,
  ) {}

  readonly requireAuthentication: AuthorizationHook = async (request, reply) => {
    const sessionId = request.unsignCookie(request.cookies[this.sessionCookie] ?? '').value ?? '';
    const session = await this.authentication.getSession(sessionId);
    if (!session) {
      unauthenticated(request, reply);
      return;
    }

    request.authenticatedSession = session;
  };

  requireRole(...allowedRoles: UserRole[]): AuthorizationHook {
    return async (request, reply) => {
      await this.requireAuthentication(request, reply);
      const session = request.authenticatedSession;
      if (!session) {
        return;
      }

      if (!allowedRoles.includes(session.user.role)) {
        forbidden(request, reply);
      }
    };
  }

  requireAdministrativeAccess: AuthorizationHook = async (request, reply) => {
    await this.requireRole('administrador')(request, reply);
    if (reply.sent || request.authenticatedSession?.user.passwordChangeRequired) {
      if (!reply.sent) {
        forbidden(request, reply);
      }
      return;
    }
  };
}
