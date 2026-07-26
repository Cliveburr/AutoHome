import { randomUUID } from 'node:crypto';
import { loadEnvFile } from 'node:process';
import argon2 from 'argon2';
import cookie from '@fastify/cookie';
import Fastify, { type FastifyInstance } from 'fastify';
import { ObjectId } from 'mongodb';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { AuditService } from '../src/audit.js';
import { AuthenticationService } from '../src/authentication.js';
import { AuthorizationService } from '../src/authorization.js';
import { type AppConfig, ConfigurationError, loadConfig } from '../src/config.js';
import { Database } from '../src/database.js';
import { BaseRepository } from '../src/repository.js';

loadEnvFile(new URL('../.env', import.meta.url));

function getTestDatabaseUri(name: string): string {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error('MONGODB_URI must be configured in api/.env to run integration tests.');
  }

  const uri = new URL(mongodbUri);
  const configuredDatabase = uri.pathname.replace(/^\//, '') || 'autohome-central';
  uri.pathname = `/${configuredDatabase}-test-${name}-${randomUUID().slice(0, 8)}`;
  return uri.toString();
}

async function connectTestDatabase(name: string): Promise<Database> {
  return Database.connect(getTestDatabaseUri(name));
}

function getFirstCookie(setCookie: string | string[] | undefined): string {
  return (Array.isArray(setCookie) ? setCookie[0] : setCookie)?.split(';')[0] ?? '';
}

const app = buildApp();

afterAll(async () => {
  await app.close();
});

describe('initialization endpoint', () => {
  it('returns the temporary API initialization message', async () => {
    const response = await app.inject({ method: 'GET', url: '/' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ message: 'AutoHome Central API initialized' });
  });
});

describe('configuration', () => {
  it('fails explicitly when a required environment variable is absent', () => {
    expect(() => loadConfig({})).toThrow(ConfigurationError);
    expect(() => loadConfig({})).toThrow('MONGODB_URI');
  });
});

describe('technical endpoints', () => {
  it('returns health status without configuration values', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('returns the standard error format with a request identifier', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/missing' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      code: 'NOT_FOUND',
      message: 'Recurso nao encontrado.',
      details: {},
    });
    expect(response.json().requestId).toEqual(expect.any(String));
  });
});

describe('MongoDB persistence', () => {
  let database: Database;

  beforeAll(async () => {
    database = await connectTestDatabase('persistence');
  });

  afterAll(async () => {
    await database.db.dropDatabase();
    await database.close();
  });

  it('connects and creates the documented collection indexes', async () => {
    expect(await database.isAvailable()).toBe(true);

    const expectedIndexes = new Map<string, Array<Record<string, 1 | -1>>>([
      ['users', [{ username: 1 }]],
      ['sessions', [{ sessionId: 1 }, { expiresAt: 1 }]],
      [
        'audit_logs',
        [
          { createdAt: -1 },
          { actorUserId: 1, createdAt: -1 },
          { targetId: 1, createdAt: -1 },
          { action: 1, createdAt: -1 },
          { result: 1, createdAt: -1 },
        ],
      ],
      ['areas', [{ position: 1 }]],
      ['rooms', [{ areaId: 1, position: 1 }]],
      ['modules', [{ protocolId: 1 }, { family: 1 }, { roomId: 1 }, { availability: 1 }]],
      ['module_states', [{ moduleId: 1 }, { lastSeenAt: -1 }]],
      ['module_configurations', [{ moduleId: 1 }, { syncStatus: 1 }]],
      [
        'commands',
        [{ commandId: 1 }, { moduleId: 1, createdAt: -1 }, { status: 1, createdAt: -1 }],
      ],
      ['ota_jobs', [{ createdAt: -1 }, { family: 1 }, { status: 1 }]],
      ['ota_job_items', [{ otaJobId: 1, moduleId: 1 }, { status: 1 }]],
    ]);

    const collectionNames = (await database.db.listCollections().toArray()).map(({ name }) => name);
    expect(collectionNames).toEqual(expect.arrayContaining([...expectedIndexes.keys()]));

    for (const [name, keys] of expectedIndexes) {
      const indexes = await database.db.collection(name).indexes();

      expect(indexes.map(({ key }) => key)).toEqual(expect.arrayContaining(keys));
    }
  });

  it('reports health while the database is available', async () => {
    const persistence = await connectTestDatabase('health');
    const persistenceApp = buildApp({ database: persistence });

    const response = await persistenceApp.inject({ method: 'GET', url: '/api/v1/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });

    await persistence.db.dropDatabase();
    await persistenceApp.close();
  });
});

describe('base repository', () => {
  it('serializes MongoDB IDs as public IDs without exposing _id', () => {
    class TestRepository extends BaseRepository<{ name: string }> {
      toPublic(document: { _id: ObjectId; name: string }) {
        return this.serialize(document);
      }
    }

    const id = new ObjectId();
    const document = new TestRepository().toPublic({ _id: id, name: 'Kitchen' });

    expect(document).toEqual({ id: id.toHexString(), name: 'Kitchen' });
    expect(document).not.toHaveProperty('_id');
  });
});

describe('authentication and sessions', () => {
  let database: Database;
  let authenticationApp: ReturnType<typeof buildApp>;
  const config: AppConfig = {
    mongodbUri: 'mongodb://unused-in-tests',
    sessionSecret: 'test-session-secret',
    nodeEnv: 'test',
    httpPort: 3000,
    firmwareGen1Dir: './firmware/gen1',
    otaMaxConcurrency: 1,
    bootstrapAdminPassword: 'bootstrap-password',
  };

  beforeAll(async () => {
    database = await connectTestDatabase('authentication');
    authenticationApp = buildApp({ database, config });
    await authenticationApp.ready();
  });

  afterAll(async () => {
    await database.db.dropDatabase();
    await authenticationApp.close();
  });

  it('creates the bootstrap administrator once with an Argon2id hash', async () => {
    const users = await database.db.collection('users').find().toArray();

    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({
      username: 'admin',
      role: 'administrador',
      active: true,
      passwordChangeRequired: true,
    });
    expect(users[0]?.passwordHash).toMatch(/^\$argon2id\$/);
    expect(users[0]?.passwordHash).not.toBe(config.bootstrapAdminPassword);

    await authenticationApp.ready();
    expect(await database.db.collection('users').countDocuments()).toBe(1);

    expect(
      await database.db.collection('audit_logs').find({ action: 'user.created' }).toArray(),
    ).toEqual([
      expect.objectContaining({
        result: 'success',
        targetType: 'user',
        details: { username: 'admin', role: 'administrador', bootstrap: true },
      }),
    ]);
  });

  it('rejects invalid credentials and creates an HttpOnly signed session cookie for valid login', async () => {
    const invalidLogin = await authenticationApp.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { username: 'admin', password: 'incorrect-password' },
    });
    expect(invalidLogin.statusCode).toBe(401);
    expect(invalidLogin.json().code).toBe('INVALID_CREDENTIALS');

    const login = await authenticationApp.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { username: 'admin', password: config.bootstrapAdminPassword },
    });
    const setCookie = login.headers['set-cookie'];
    const cookie = (Array.isArray(setCookie) ? setCookie[0] : setCookie)?.split(';')[0];

    expect(login.statusCode).toBe(200);
    expect(login.json()).toMatchObject({
      user: { username: 'admin', passwordChangeRequired: true },
    });
    expect(setCookie).toContain('HttpOnly');
    expect(cookie).toBeDefined();
  });

  it('requires the initial password to be changed and invalidates the session on logout', async () => {
    const login = await authenticationApp.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { username: 'admin', password: config.bootstrapAdminPassword },
    });
    const setCookie = login.headers['set-cookie'];
    const cookie = (Array.isArray(setCookie) ? setCookie[0] : setCookie)?.split(';')[0] ?? '';

    const session = await authenticationApp.inject({
      method: 'GET',
      url: '/api/v1/me',
      headers: { cookie },
    });
    expect(session.statusCode).toBe(200);
    expect(session.json().user.passwordChangeRequired).toBe(true);

    const change = await authenticationApp.inject({
      method: 'POST',
      url: '/api/v1/auth/change-password',
      headers: { cookie },
      payload: { currentPassword: config.bootstrapAdminPassword, newPassword: 'new-password' },
    });
    expect(change.statusCode).toBe(200);
    expect(change.json().user.passwordChangeRequired).toBe(false);

    const oldPassword = await authenticationApp.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { username: 'admin', password: config.bootstrapAdminPassword },
    });
    expect(oldPassword.statusCode).toBe(401);

    const logout = await authenticationApp.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      headers: { cookie },
    });
    expect(logout.statusCode).toBe(204);

    const invalidatedSession = await authenticationApp.inject({
      method: 'GET',
      url: '/api/v1/me',
      headers: { cookie },
    });
    expect(invalidatedSession.statusCode).toBe(401);
  });

  it('records authentication and user mutations without persisting secrets', async () => {
    const auditLogs = await database.db.collection('audit_logs').find().toArray();
    const actions = auditLogs.map(({ action, result }) => `${action}:${result}`);

    expect(actions).toEqual(
      expect.arrayContaining([
        'user.created:success',
        'auth.login:failure',
        'auth.login:success',
        'user.password_changed:success',
        'auth.logout:success',
      ]),
    );
    expect(JSON.stringify(auditLogs)).not.toContain(config.bootstrapAdminPassword);
    expect(JSON.stringify(auditLogs)).not.toContain('new-password');
    expect(JSON.stringify(auditLogs)).not.toContain('passwordHash');
  });
});

describe('authorization and audit safety', () => {
  let database: Database;
  let authorizationApp: FastifyInstance;

  beforeAll(async () => {
    database = await connectTestDatabase('authorization');
    const audit = new AuditService(database);
    const authentication = new AuthenticationService(database, undefined, audit);
    await authentication.initialize();

    const now = new Date();
    await database.db.collection('users').insertOne({
      username: 'basic',
      passwordHash: await argon2.hash('basic-password', { type: argon2.argon2id }),
      role: 'basico',
      active: true,
      passwordChangeRequired: false,
      createdAt: now,
      updatedAt: now,
    });

    authorizationApp = Fastify();
    await authorizationApp.register(cookie, { secret: 'authorization-test-secret' });
    const authorization = new AuthorizationService(authentication, 'autohome_session');
    authorizationApp.get<{ Params: { username: string } }>(
      '/test-login/:username',
      async (request, reply) => {
        const password = request.params.username === 'basic' ? 'basic-password' : 'admin';
        const session = await authentication.login(request.params.username, password, request.ip);
        if (!session) {
          return reply.status(401).send();
        }

        reply.setCookie('autohome_session', session.sessionId, {
          httpOnly: true,
          signed: true,
          path: '/',
        });
        return reply.send();
      },
    );
    authorizationApp.get(
      '/administrative',
      { preHandler: authorization.requireRole('administrador') },
      async () => ({ ok: true }),
    );
    await authorizationApp.ready();
  });

  afterAll(async () => {
    await authorizationApp.close();
    await database.db.dropDatabase();
    await database.close();
  });

  it('denies an administrative route to a basic user and authorizes an administrator', async () => {
    const basicLogin = await authorizationApp.inject({ method: 'GET', url: '/test-login/basic' });
    const basicCookie = getFirstCookie(basicLogin.headers['set-cookie']);
    const basicResponse = await authorizationApp.inject({
      method: 'GET',
      url: '/administrative',
      headers: { cookie: basicCookie },
    });
    expect(basicResponse.statusCode).toBe(403);
    expect(basicResponse.json().code).toBe('FORBIDDEN');

    const adminLogin = await authorizationApp.inject({ method: 'GET', url: '/test-login/admin' });
    const adminCookie = getFirstCookie(adminLogin.headers['set-cookie']);
    const adminResponse = await authorizationApp.inject({
      method: 'GET',
      url: '/administrative',
      headers: { cookie: adminCookie },
    });
    expect(adminResponse.statusCode).toBe(200);
    expect(adminResponse.json()).toEqual({ ok: true });
  });

  it('removes secrets from arbitrary audit details before they reach MongoDB', async () => {
    const audit = new AuditService(database);
    await audit.record({
      action: 'test.audit_safety',
      result: 'success',
      details: {
        allowed: 'visible',
        password: 'never-store-this',
        nested: { token: 'never-store-this', allowed: 'still-visible' },
      },
    });

    const entry = await database.db
      .collection('audit_logs')
      .findOne({ action: 'test.audit_safety' });
    expect(entry?.details).toEqual({ allowed: 'visible', nested: { allowed: 'still-visible' } });
  });
});

describe('administrative user management', () => {
  let database: Database;
  let userManagementApp: ReturnType<typeof buildApp>;
  const config: AppConfig = {
    mongodbUri: 'mongodb://unused-in-tests',
    sessionSecret: 'user-management-test-secret',
    nodeEnv: 'test',
    httpPort: 3000,
    firmwareGen1Dir: './firmware/gen1',
    otaMaxConcurrency: 1,
    bootstrapAdminPassword: 'bootstrap-password',
  };

  async function login(username: string, password: string): Promise<string> {
    const response = await userManagementApp.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { username, password },
    });
    expect(response.statusCode).toBe(200);
    return getFirstCookie(response.headers['set-cookie']);
  }

  beforeAll(async () => {
    database = await connectTestDatabase('user-management');
    userManagementApp = buildApp({ database, config });
    await userManagementApp.ready();
  });

  afterAll(async () => {
    await database.db.dropDatabase();
    await userManagementApp.close();
  });

  it('allows an administrator to create, list, update, activate and deactivate users', async () => {
    const bootstrapCookie = await login('admin', config.bootstrapAdminPassword!);
    const passwordChange = await userManagementApp.inject({
      method: 'POST',
      url: '/api/v1/auth/change-password',
      headers: { cookie: bootstrapCookie },
      payload: { currentPassword: config.bootstrapAdminPassword, newPassword: 'admin-password' },
    });
    expect(passwordChange.statusCode).toBe(200);

    const create = await userManagementApp.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: { cookie: bootstrapCookie },
      payload: { username: 'resident', password: 'resident-password', role: 'basico' },
    });
    expect(create.statusCode).toBe(201);
    expect(create.json()).toEqual({
      user: expect.objectContaining({ username: 'resident', role: 'basico', active: true }),
    });
    const residentId = create.json().user.id as string;

    const duplicate = await userManagementApp.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: { cookie: bootstrapCookie },
      payload: { username: 'resident', password: 'another-password', role: 'basico' },
    });
    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json().code).toBe('USERNAME_TAKEN');

    const list = await userManagementApp.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: { cookie: bootstrapCookie },
    });
    expect(list.statusCode).toBe(200);
    expect(list.json().users).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ username: 'admin', role: 'administrador' }),
        expect.objectContaining({ username: 'resident', role: 'basico' }),
      ]),
    );

    const roleChange = await userManagementApp.inject({
      method: 'PATCH',
      url: `/api/v1/users/${residentId}/role`,
      headers: { cookie: bootstrapCookie },
      payload: { role: 'administrador' },
    });
    expect(roleChange.statusCode).toBe(200);
    expect(roleChange.json().user.role).toBe('administrador');

    const deactivation = await userManagementApp.inject({
      method: 'POST',
      url: `/api/v1/users/${residentId}/deactivate`,
      headers: { cookie: bootstrapCookie },
    });
    expect(deactivation.statusCode).toBe(200);
    expect(deactivation.json().user.active).toBe(false);

    const activation = await userManagementApp.inject({
      method: 'POST',
      url: `/api/v1/users/${residentId}/activate`,
      headers: { cookie: bootstrapCookie },
    });
    expect(activation.statusCode).toBe(200);
    expect(activation.json().user.active).toBe(true);
  });

  it('invalidates sessions after password reset and requires the user to choose a new password', async () => {
    const adminCookie = await login('admin', 'admin-password');
    const resident = await database.db.collection('users').findOne({ username: 'resident' });
    expect(resident).toBeDefined();

    const residentCookie = await login('resident', 'resident-password');
    const reset = await userManagementApp.inject({
      method: 'POST',
      url: `/api/v1/users/${resident!._id.toHexString()}/reset-password`,
      headers: { cookie: adminCookie },
      payload: { password: 'reset-password' },
    });
    expect(reset.statusCode).toBe(200);
    expect(reset.json().user.passwordChangeRequired).toBe(true);

    const invalidatedSession = await userManagementApp.inject({
      method: 'GET',
      url: '/api/v1/me',
      headers: { cookie: residentCookie },
    });
    expect(invalidatedSession.statusCode).toBe(401);

    const resetLoginCookie = await login('resident', 'reset-password');
    const session = await userManagementApp.inject({
      method: 'GET',
      url: '/api/v1/me',
      headers: { cookie: resetLoginCookie },
    });
    expect(session.statusCode).toBe(200);
    expect(session.json().user.passwordChangeRequired).toBe(true);
  });

  it('prevents an administrator with a required password change from managing users', async () => {
    const secondAdmin = await database.db.collection('users').findOne({ username: 'resident' });
    expect(secondAdmin).toBeDefined();

    const residentCookie = await login('resident', 'reset-password');
    const response = await userManagementApp.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: { cookie: residentCookie },
    });
    expect(response.statusCode).toBe(403);
  });

  it('protects the last active administrator and audits user mutations without secrets', async () => {
    const adminCookie = await login('admin', 'admin-password');
    const admin = await database.db.collection('users').findOne({ username: 'admin' });
    expect(admin).toBeDefined();
    await database.db
      .collection('users')
      .updateOne({ _id: new ObjectId(admin!._id) }, { $set: { active: true } });
    await database.db
      .collection('users')
      .updateOne({ username: 'resident' }, { $set: { active: false } });

    const deactivation = await userManagementApp.inject({
      method: 'POST',
      url: `/api/v1/users/${admin!._id.toHexString()}/deactivate`,
      headers: { cookie: adminCookie },
    });
    expect(deactivation.statusCode).toBe(409);
    expect(deactivation.json().code).toBe('LAST_ACTIVE_ADMINISTRATOR');

    const roleChange = await userManagementApp.inject({
      method: 'PATCH',
      url: `/api/v1/users/${admin!._id.toHexString()}/role`,
      headers: { cookie: adminCookie },
      payload: { role: 'basico' },
    });
    expect(roleChange.statusCode).toBe(409);
    expect(roleChange.json().code).toBe('LAST_ACTIVE_ADMINISTRATOR');

    const auditLogs = await database.db.collection('audit_logs').find().toArray();
    const actions = auditLogs.map(({ action }) => action);
    expect(actions).toEqual(
      expect.arrayContaining([
        'user.created',
        'user.role_changed',
        'user.activated',
        'user.deactivated',
        'user.password_reset',
      ]),
    );
    expect(JSON.stringify(auditLogs)).not.toContain('resident-password');
    expect(JSON.stringify(auditLogs)).not.toContain('reset-password');
  });
});
