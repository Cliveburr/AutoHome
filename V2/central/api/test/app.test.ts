import { ObjectId } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { type AppConfig, ConfigurationError, loadConfig } from '../src/config.js';
import { Database } from '../src/database.js';
import { BaseRepository } from '../src/repository.js';

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
  let mongoServer: MongoMemoryServer;
  let database: Database;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    database = await Database.connect(mongoServer.getUri('autohome_test'));
  });

  afterAll(async () => {
    await database.close();
    await mongoServer.stop();
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
      ['commands', [{ commandId: 1 }, { moduleId: 1, createdAt: -1 }, { status: 1, createdAt: -1 }]],
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
    const persistence = await Database.connect(mongoServer.getUri('health_test'));
    const persistenceApp = buildApp({ database: persistence });

    const response = await persistenceApp.inject({ method: 'GET', url: '/api/v1/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });

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
  let mongoServer: MongoMemoryServer;
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
    mongoServer = await MongoMemoryServer.create();
    database = await Database.connect(mongoServer.getUri('authentication_test'));
    authenticationApp = buildApp({ database, config });
    await authenticationApp.ready();
  });

  afterAll(async () => {
    await authenticationApp.close();
    await mongoServer.stop();
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
    expect(login.json()).toMatchObject({ user: { username: 'admin', passwordChangeRequired: true } });
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

    const session = await authenticationApp.inject({ method: 'GET', url: '/api/v1/me', headers: { cookie } });
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

    const logout = await authenticationApp.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: { cookie } });
    expect(logout.statusCode).toBe(204);

    const invalidatedSession = await authenticationApp.inject({ method: 'GET', url: '/api/v1/me', headers: { cookie } });
    expect(invalidatedSession.statusCode).toBe(401);
  });
});
