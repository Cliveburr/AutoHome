import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadEnvFile } from 'node:process';
import { tmpdir } from 'node:os';
import argon2 from 'argon2';
import cookie from '@fastify/cookie';
import Fastify, { type FastifyInstance } from 'fastify';
import { ObjectId } from 'mongodb';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { buildApp } from '../src/app.js';
import { AuditService } from '../src/audit.js';
import { AuthenticationService } from '../src/authentication.js';
import { AuthorizationService } from '../src/authorization.js';
import { type AppConfig, ConfigurationError, loadConfig } from '../src/config.js';
import { Database } from '../src/database.js';
import { BaseRepository } from '../src/repository.js';
import { InMemoryModuleTransport } from '../src/transport.js';

loadEnvFile(new URL('../.env', import.meta.url));

const fixtureFirmwareDirectory = mkdtempSync(join(tmpdir(), 'autohome-central-api-'));

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

interface OpenApiDocument {
  paths: Record<string, Record<string, unknown>>;
}

async function getPublishedOperations(): Promise<Array<{ method: string; url: string }>> {
  const source = await readFile(new URL('../../docs/openapi.yaml', import.meta.url), 'utf8');
  const document = parse(source) as OpenApiDocument;

  return Object.entries(document.paths).flatMap(([path, operations]) =>
    Object.keys(operations)
      .filter((method) => ['get', 'post', 'put', 'patch', 'delete'].includes(method))
      .map((method) => ({
        method: method.toUpperCase(),
        url: `/api/v1${path.replaceAll(/\{([^}]+)\}/g, ':$1')}`,
      })),
  );
}

const app = buildApp();

afterAll(async () => {
  await app.close();
  rmSync(fixtureFirmwareDirectory, { force: true, recursive: true });
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
    firmwareGen1Dir: fixtureFirmwareDirectory,
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
    firmwareGen1Dir: fixtureFirmwareDirectory,
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

  it('implements every operation published in the OpenAPI contract', async () => {
    const operations = await getPublishedOperations();

    expect(operations).not.toHaveLength(0);
    for (const operation of operations) {
      expect(userManagementApp.hasRoute(operation)).toBe(true);
    }
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

describe('areas and rooms administration', () => {
  let database: Database;
  let organizationApp: ReturnType<typeof buildApp>;
  const config: AppConfig = {
    mongodbUri: 'mongodb://unused-in-tests',
    sessionSecret: 'organization-test-secret',
    nodeEnv: 'test',
    httpPort: 3000,
    firmwareGen1Dir: fixtureFirmwareDirectory,
    otaMaxConcurrency: 1,
    bootstrapAdminPassword: 'bootstrap-password',
  };

  async function login(username: string, password: string): Promise<string> {
    const response = await organizationApp.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { username, password },
    });
    expect(response.statusCode).toBe(200);
    return getFirstCookie(response.headers['set-cookie']);
  }

  beforeAll(async () => {
    database = await connectTestDatabase('organization');
    organizationApp = buildApp({ database, config });
    await organizationApp.ready();
  });

  afterAll(async () => {
    await database.db.dropDatabase();
    await organizationApp.close();
  });

  it('creates, orders, renames and reorganizes areas and rooms', async () => {
    const bootstrapCookie = await login('admin', config.bootstrapAdminPassword!);
    const passwordChange = await organizationApp.inject({
      method: 'POST',
      url: '/api/v1/auth/change-password',
      headers: { cookie: bootstrapCookie },
      payload: { currentPassword: config.bootstrapAdminPassword, newPassword: 'admin-password' },
    });
    expect(passwordChange.statusCode).toBe(200);

    const kitchen = await organizationApp.inject({
      method: 'POST',
      url: '/api/v1/areas',
      headers: { cookie: bootstrapCookie },
      payload: { name: 'Cozinha' },
    });
    const livingRoom = await organizationApp.inject({
      method: 'POST',
      url: '/api/v1/areas',
      headers: { cookie: bootstrapCookie },
      payload: { name: 'Sala', position: 0 },
    });
    expect(kitchen.statusCode).toBe(201);
    expect(livingRoom.statusCode).toBe(201);
    const kitchenId = kitchen.json().area.id as string;
    const livingRoomId = livingRoom.json().area.id as string;

    const areas = await organizationApp.inject({
      method: 'GET',
      url: '/api/v1/areas',
      headers: { cookie: bootstrapCookie },
    });
    expect(areas.json().areas).toEqual([
      expect.objectContaining({ id: livingRoomId, name: 'Sala', position: 0 }),
      expect.objectContaining({ id: kitchenId, name: 'Cozinha', position: 1 }),
    ]);

    const pantry = await organizationApp.inject({
      method: 'POST',
      url: '/api/v1/rooms',
      headers: { cookie: bootstrapCookie },
      payload: { name: 'Despensa' },
    });
    const mainKitchen = await organizationApp.inject({
      method: 'POST',
      url: '/api/v1/rooms',
      headers: { cookie: bootstrapCookie },
      payload: { name: 'Cozinha principal', areaId: kitchenId },
    });
    const balcony = await organizationApp.inject({
      method: 'POST',
      url: '/api/v1/rooms',
      headers: { cookie: bootstrapCookie },
      payload: { name: 'Varanda', areaId: kitchenId, position: 0 },
    });
    expect(pantry.statusCode).toBe(201);
    expect(mainKitchen.statusCode).toBe(201);
    expect(balcony.statusCode).toBe(201);
    const pantryId = pantry.json().room.id as string;
    const balconyId = balcony.json().room.id as string;

    const roomUpdate = await organizationApp.inject({
      method: 'PATCH',
      url: `/api/v1/rooms/${pantryId}`,
      headers: { cookie: bootstrapCookie },
      payload: { name: 'Lavanderia', areaId: livingRoomId },
    });
    expect(roomUpdate.statusCode).toBe(200);
    expect(roomUpdate.json().room).toMatchObject({
      id: pantryId,
      name: 'Lavanderia',
      areaId: livingRoomId,
      position: 0,
    });

    const removeArea = await organizationApp.inject({
      method: 'PATCH',
      url: `/api/v1/rooms/${pantryId}`,
      headers: { cookie: bootstrapCookie },
      payload: { areaId: null },
    });
    expect(removeArea.statusCode).toBe(200);
    expect(removeArea.json().room).not.toHaveProperty('areaId');

    const rooms = await organizationApp.inject({
      method: 'GET',
      url: '/api/v1/rooms',
      headers: { cookie: bootstrapCookie },
    });
    expect(rooms.statusCode).toBe(200);
    expect(rooms.json().rooms).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: balconyId, areaId: kitchenId, position: 0 }),
        expect.objectContaining({ id: pantryId, name: 'Lavanderia', position: 0 }),
      ]),
    );
  });

  it('blocks deletion while areas or rooms are referenced and audits organization mutations', async () => {
    const adminCookie = await login('admin', 'admin-password');
    const areas = await organizationApp.inject({
      method: 'GET',
      url: '/api/v1/areas',
      headers: { cookie: adminCookie },
    });
    const kitchenId = areas.json().areas.find((area: { name: string }) => area.name === 'Cozinha')
      .id as string;
    const rooms = await organizationApp.inject({
      method: 'GET',
      url: '/api/v1/rooms',
      headers: { cookie: adminCookie },
    });
    const kitchenRoomId = rooms
      .json()
      .rooms.find((room: { areaId?: string }) => room.areaId === kitchenId).id as string;

    const areaInUse = await organizationApp.inject({
      method: 'DELETE',
      url: `/api/v1/areas/${kitchenId}`,
      headers: { cookie: adminCookie },
    });
    expect(areaInUse.statusCode).toBe(409);
    expect(areaInUse.json().code).toBe('AREA_IN_USE');

    await database.db.collection('modules').insertOne({ roomId: new ObjectId(kitchenRoomId) });
    const roomInUse = await organizationApp.inject({
      method: 'DELETE',
      url: `/api/v1/rooms/${kitchenRoomId}`,
      headers: { cookie: adminCookie },
    });
    expect(roomInUse.statusCode).toBe(409);
    expect(roomInUse.json().code).toBe('ROOM_IN_USE');

    const basicUser = await organizationApp.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: { cookie: adminCookie },
      payload: { username: 'basic-user', password: 'basic-password', role: 'basico' },
    });
    expect(basicUser.statusCode).toBe(201);
    const basicCookie = await login('basic-user', 'basic-password');
    const denied = await organizationApp.inject({
      method: 'GET',
      url: '/api/v1/areas',
      headers: { cookie: basicCookie },
    });
    expect(denied.statusCode).toBe(403);

    const auditLogs = await database.db.collection('audit_logs').find().toArray();
    expect(auditLogs.map(({ action }) => action)).toEqual(
      expect.arrayContaining(['area.created', 'room.created', 'room.updated']),
    );
  });
});

describe('module discovery and adoption HTTP API', () => {
  let database: Database;
  let modulesApp: ReturnType<typeof buildApp>;
  const transport = new InMemoryModuleTransport();
  const config: AppConfig = {
    mongodbUri: 'mongodb://unused-in-tests',
    sessionSecret: 'module-discovery-test-secret',
    nodeEnv: 'development',
    httpPort: 3000,
    firmwareGen1Dir: fixtureFirmwareDirectory,
    otaMaxConcurrency: 1,
    bootstrapAdminPassword: 'bootstrap-password',
  };

  async function login(username: string, password: string): Promise<string> {
    const response = await modulesApp.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { username, password },
    });
    expect(response.statusCode).toBe(200);
    return getFirstCookie(response.headers['set-cookie']);
  }

  async function waitForDiscovered(protocolId: string): Promise<void> {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      if (await database.db.collection('modules').findOne({ protocolId })) return;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    throw new Error(`Discovery for ${protocolId} was not persisted.`);
  }

  beforeAll(async () => {
    database = await connectTestDatabase('module-discovery');
    modulesApp = buildApp({ database, config, simulatedTransport: transport });
    await modulesApp.ready();
  });

  afterAll(async () => {
    await database.db.dropDatabase();
    await modulesApp.close();
  });

  it('publishes discovery only to administrators and moves an adopted module to the authenticated inventory', async () => {
    const pendingCookie = await login('admin', config.bootstrapAdminPassword!);
    const pendingDiscovery = await modulesApp.inject({
      method: 'GET',
      url: '/api/v1/discovery',
      headers: { cookie: pendingCookie },
    });
    expect(pendingDiscovery.statusCode).toBe(403);

    const passwordChange = await modulesApp.inject({
      method: 'POST',
      url: '/api/v1/auth/change-password',
      headers: { cookie: pendingCookie },
      payload: { currentPassword: config.bootstrapAdminPassword, newPassword: 'admin-password' },
    });
    expect(passwordChange.statusCode).toBe(200);

    const basicUser = await modulesApp.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: { cookie: pendingCookie },
      payload: { username: 'module-basic', password: 'basic-password', role: 'basico' },
    });
    expect(basicUser.statusCode).toBe(201);
    const basicCookie = await login('module-basic', 'basic-password');

    const created = await modulesApp.inject({
      method: 'POST',
      url: '/api/v1/development/simulated-modules',
      payload: {
        protocolId: 'gen1-lamp-garage',
        family: 'gen1',
        capabilities: [
          {
            id: 'dimmer',
            configuration: [{ key: 'brightness', type: 'number', minimum: 0, maximum: 100 }],
          },
          { id: 'energy' },
        ],
        state: { brightness: 30 },
      },
    });
    expect(created.statusCode).toBe(201);
    await waitForDiscovered('gen1-lamp-garage');

    const basicDiscovery = await modulesApp.inject({
      method: 'GET',
      url: '/api/v1/discovery',
      headers: { cookie: basicCookie },
    });
    expect(basicDiscovery.statusCode).toBe(403);

    const discovery = await modulesApp.inject({
      method: 'GET',
      url: '/api/v1/discovery?capability=energy&availability=online&transport=simulated',
      headers: { cookie: pendingCookie },
    });
    expect(discovery.statusCode).toBe(200);
    expect(discovery.json().modules).toEqual([
      expect.objectContaining({
        protocolId: 'gen1-lamp-garage',
        family: 'gen1',
        capabilities: [
          {
            id: 'dimmer',
            configuration: [{ key: 'brightness', type: 'number', minimum: 0, maximum: 100 }],
          },
          { id: 'energy' },
        ],
        transport: 'simulated',
        availability: 'online',
        status: 'descoberto',
      }),
    ]);
    expect(discovery.json().modules[0]).not.toHaveProperty('_id');

    const missing = await modulesApp.inject({
      method: 'POST',
      url: '/api/v1/discovery/unknown/adopt',
      headers: { cookie: pendingCookie },
    });
    expect(missing.statusCode).toBe(404);
    expect(missing.json().code).toBe('DISCOVERED_MODULE_NOT_FOUND');

    const adopted = await modulesApp.inject({
      method: 'POST',
      url: '/api/v1/discovery/gen1-lamp-garage/adopt',
      headers: { cookie: pendingCookie },
    });
    expect(adopted.statusCode).toBe(200);
    expect(adopted.json().module).toMatchObject({
      protocolId: 'gen1-lamp-garage',
      status: 'cadastrado',
    });
    expect(adopted.json().module).not.toHaveProperty('roomId');

    const repeatedAdoption = await modulesApp.inject({
      method: 'POST',
      url: '/api/v1/discovery/gen1-lamp-garage/adopt',
      headers: { cookie: pendingCookie },
    });
    expect(repeatedAdoption.statusCode).toBe(409);
    expect(repeatedAdoption.json().code).toBe('MODULE_ALREADY_ADOPTED');

    const noLongerDiscovered = await modulesApp.inject({
      method: 'GET',
      url: '/api/v1/discovery',
      headers: { cookie: pendingCookie },
    });
    expect(noLongerDiscovered.json()).toEqual({ modules: [] });

    const inventory = await modulesApp.inject({
      method: 'GET',
      url: '/api/v1/modules?family=gen1',
      headers: { cookie: basicCookie },
    });
    expect(inventory.statusCode).toBe(200);
    expect(inventory.json().modules).toEqual([
      expect.objectContaining({ protocolId: 'gen1-lamp-garage', status: 'cadastrado' }),
    ]);

    const audit = await database.db.collection('audit_logs').findOne({ action: 'module.adopted' });
    expect(audit).toMatchObject({
      result: 'success',
      details: expect.objectContaining({ protocolId: 'gen1-lamp-garage' }),
    });

    const basicDetail = await modulesApp.inject({
      method: 'GET',
      url: '/api/v1/modules/gen1-lamp-garage',
      headers: { cookie: basicCookie },
    });
    expect(basicDetail.statusCode).toBe(200);
    expect(basicDetail.json().module).toMatchObject({ configurations: [], localLinks: [] });

    const deniedOrganization = await modulesApp.inject({
      method: 'PATCH',
      url: '/api/v1/modules/gen1-lamp-garage',
      headers: { cookie: basicCookie },
      payload: { name: 'Lampada da garagem' },
    });
    expect(deniedOrganization.statusCode).toBe(403);

    const room = await modulesApp.inject({
      method: 'POST',
      url: '/api/v1/rooms',
      headers: { cookie: pendingCookie },
      payload: { name: 'Garagem' },
    });
    expect(room.statusCode).toBe(201);
    const organization = await modulesApp.inject({
      method: 'PATCH',
      url: '/api/v1/modules/gen1-lamp-garage',
      headers: { cookie: pendingCookie },
      payload: { name: 'Lampada da garagem', roomId: room.json().room.id },
    });
    expect(organization.statusCode).toBe(200);
    expect(organization.json().module).toMatchObject({
      name: 'Lampada da garagem',
      roomId: room.json().room.id,
    });

    const configured = await modulesApp.inject({
      method: 'PUT',
      url: '/api/v1/modules/gen1-lamp-garage/configurations',
      headers: { cookie: pendingCookie },
      payload: { capabilityId: 'dimmer', parameterKey: 'brightness', value: 40 },
    });
    expect(configured.statusCode).toBe(200);
    expect(configured.json().configuration).toMatchObject({
      desired: 40,
      confirmed: { value: 40 },
      syncStatus: 'confirmada',
    });
    const invalidConfiguration = await modulesApp.inject({
      method: 'PUT',
      url: '/api/v1/modules/gen1-lamp-garage/configurations',
      headers: { cookie: pendingCookie },
      payload: { capabilityId: 'dimmer', parameterKey: 'brightness', value: 101 },
    });
    expect(invalidConfiguration.statusCode).toBe(422);
    expect(invalidConfiguration.json().code).toBe('CONFIGURATION_INVALID');
    const roomInUse = await modulesApp.inject({
      method: 'DELETE',
      url: `/api/v1/rooms/${room.json().room.id}`,
      headers: { cookie: pendingCookie },
    });
    expect(roomInUse.statusCode).toBe(409);

    const anonymousOta = await modulesApp.inject({ method: 'GET', url: '/api/v1/ota' });
    expect(anonymousOta.statusCode).toBe(401);
    const basicOta = await modulesApp.inject({
      method: 'GET',
      url: '/api/v1/ota',
      headers: { cookie: basicCookie },
    });
    expect(basicOta.statusCode).toBe(403);
    const ota = await modulesApp.inject({
      method: 'GET',
      url: '/api/v1/ota',
      headers: { cookie: pendingCookie },
    });
    expect(ota.statusCode).toBe(200);
    expect(ota.json()).toMatchObject({
      families: [
        {
          family: 'gen1',
          artifacts: [],
          modules: [{ protocolId: 'gen1-lamp-garage', status: 'desconhecido' }],
        },
      ],
    });
    expect(JSON.stringify(ota.json())).not.toContain(fixtureFirmwareDirectory);
  });
});
