import { randomUUID } from 'node:crypto';
import { loadEnvFile } from 'node:process';
import { WebSocket } from 'ws';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { type AppConfig } from '../src/config.js';
import { Database } from '../src/database.js';
import { RealtimeService } from '../src/realtime.js';
import { InMemoryModuleTransport } from '../src/transport.js';

loadEnvFile(new URL('../.env', import.meta.url));

function getTestDatabaseUri(): string {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) throw new Error('MONGODB_URI must be configured in api/.env to run tests.');
  const uri = new URL(mongodbUri);
  const configuredDatabase = uri.pathname.replace(/^\//, '') || 'autohome-central';
  uri.pathname = `/${configuredDatabase}-test-realtime-${randomUUID().slice(0, 8)}`;
  return uri.toString();
}

function firstCookie(setCookie: string | string[] | undefined): string {
  return (Array.isArray(setCookie) ? setCookie[0] : setCookie)?.split(';')[0] ?? '';
}

function connect(url: string, cookie?: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url, cookie ? { headers: { cookie } } : undefined);
    socket.once('open', () => resolve(socket));
    socket.once('error', reject);
  });
}

function nextMessage(socket: WebSocket): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    socket.once('message', (data) =>
      resolve(JSON.parse(data.toString()) as Record<string, unknown>),
    );
    socket.once('error', reject);
  });
}

describe('realtime WebSocket', () => {
  let database: Database;
  let app: ReturnType<typeof buildApp>;
  let transport: InMemoryModuleTransport;
  let address: string;
  let cookie: string;
  let adminCookie: string;
  let requiredUserId: string;

  beforeAll(async () => {
    database = await Database.connect(getTestDatabaseUri());
    transport = new InMemoryModuleTransport();
    const config: AppConfig = {
      mongodbUri: 'mongodb://unused-in-tests',
      sessionSecret: 'realtime-test-secret',
      nodeEnv: 'development',
      httpPort: 0,
      firmwareGen1Dir: './firmware/gen1',
      otaMaxConcurrency: 1,
      bootstrapAdminPassword: 'bootstrap-password',
    };
    app = buildApp({ database, config, simulatedTransport: transport });
    await app.ready();
    const listening = await app.listen({ host: '127.0.0.1', port: 0 });
    address = listening.replace('http://', 'ws://');

    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { username: 'admin', password: 'bootstrap-password' },
    });
    adminCookie = firstCookie(login.headers['set-cookie']);
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/change-password',
      headers: { cookie: adminCookie },
      payload: { currentPassword: 'bootstrap-password', newPassword: 'changed-password' },
    });
    const createBasic = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: { cookie: adminCookie },
      payload: { username: 'basic', password: 'basic-password', role: 'basico' },
    });
    expect(createBasic.statusCode).toBe(201);
    const createRequired = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: { cookie: adminCookie },
      payload: { username: 'required', password: 'required-password', role: 'basico' },
    });
    expect(createRequired.statusCode).toBe(201);
    requiredUserId = createRequired.json().user.id;
    const basicLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { username: 'basic', password: 'basic-password' },
    });
    cookie = firstCookie(basicLogin.headers['set-cookie']);
    transport.registerModule({
      protocolId: 'gen1-realtime-module',
      family: 'gen1',
      capabilities: [
        {
          id: 'relay',
          actions: [
            {
              name: 'set',
              parameters: [{ key: 'enabled', type: 'boolean' as const, required: true }],
            },
          ],
        },
      ],
      state: { temperature: 20 },
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    const adopted = await app.inject({
      method: 'POST',
      url: '/api/v1/discovery/gen1-realtime-module/adopt',
      headers: { cookie: adminCookie },
    });
    expect(adopted.statusCode).toBe(200);
  });

  afterAll(async () => {
    await database.db.dropDatabase();
    await app.close();
  });

  it('accepts an operational cookie and publishes public state envelopes', async () => {
    const socket = await connect(`${address}/api/v1/realtime`, cookie);
    const message = nextMessage(socket);
    transport.setState('gen1-realtime-module', { temperature: 21 });
    const event = await message;
    expect(event).toMatchObject({
      eventId: expect.any(String),
      type: 'module.state.changed',
      occurredAt: expect.any(String),
      data: { protocolId: 'gen1-realtime-module', state: { values: { temperature: 21 } } },
    });
    socket.close();
  });

  it('refuses an anonymous handshake', async () => {
    await expect(connect(`${address}/api/v1/realtime`)).rejects.toBeDefined();
    const reset = await app.inject({
      method: 'POST',
      url: `/api/v1/users/${requiredUserId}/reset-password`,
      headers: { cookie: adminCookie },
      payload: { password: 'required-reset' },
    });
    expect(reset.statusCode).toBe(200);
    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { username: 'required', password: 'required-reset' },
    });
    await expect(
      connect(`${address}/api/v1/realtime`, firstCookie(login.headers['set-cookie'])),
    ).rejects.toBeDefined();
  });

  it('allows a basic user to create and retrieve an idempotent command by HTTP', async () => {
    const request = {
      method: 'POST' as const,
      url: '/api/v1/commands',
      headers: { cookie, 'idempotency-key': 'realtime-basic-command' },
      payload: {
        protocolId: 'gen1-realtime-module',
        capabilityId: 'relay',
        action: 'set',
        parameters: { enabled: true },
      },
    };
    const created = await app.inject(request);
    const repeated = await app.inject(request);
    expect(created.statusCode).toBe(201);
    expect(repeated.statusCode).toBe(200);
    expect(repeated.json().command).toEqual(created.json().command);
    expect(created.json().command).not.toHaveProperty('_id');
    const loaded = await app.inject({
      method: 'GET',
      url: `/api/v1/commands/${created.json().command.commandId}`,
      headers: { cookie },
    });
    expect(loaded.statusCode).toBe(200);
    expect(loaded.json().command).toEqual(created.json().command);
  });
});

describe('realtime cursor buffer', () => {
  it('replays only later events or explicitly requests reconciliation', () => {
    const realtime = new RealtimeService(2);
    const sent: string[] = [];
    const socket = {
      OPEN: 1,
      readyState: 1,
      on: () => undefined,
      send: (message: string) => sent.push(message),
    } as unknown as WebSocket;
    const first = realtime.publish('command.updated', { command: { commandId: 'first' } });
    realtime.publish('command.updated', { command: { commandId: 'second' } });
    realtime.connect(socket, first.eventId);
    expect(sent.map((message) => JSON.parse(message))).toEqual([
      expect.objectContaining({
        type: 'command.updated',
        data: { command: { commandId: 'second' } },
      }),
    ]);
    sent.length = 0;
    realtime.connect(socket, 'expired');
    expect(sent.map((message) => JSON.parse(message))).toEqual([
      expect.objectContaining({ type: 'realtime.reconciliation.required' }),
    ]);
  });
});
