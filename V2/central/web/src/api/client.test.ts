import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  configureApiClient,
  createOperationalCommand,
  getSession,
  listOperationalAreas,
  listOperationalModules,
  listOperationalRooms,
  setUnauthenticatedHandler,
} from './client';

afterEach(() => {
  setUnauthenticatedHandler(undefined);
  vi.unstubAllGlobals();
});

describe('generated API client', () => {
  it('uses the central API base URL and includes the session cookie', () => {
    const configuration = configureApiClient('http://central.local/api/v1');

    expect(configuration.baseUrl).toBe('http://central.local/api/v1');
    expect(configuration.credentials).toBe('include');
  });

  it('invalidates the local session handler when the generated client receives 401', async () => {
    const onUnauthenticated = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ code: 'UNAUTHENTICATED', message: 'Autenticação obrigatória.' }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 401,
          },
        ),
      ),
    );
    setUnauthenticatedHandler(onUnauthenticated);
    configureApiClient('http://central.local/api/v1');

    await expect(getSession()).rejects.toThrow('Autenticação obrigatória.');
    expect(onUnauthenticated).toHaveBeenCalledTimes(1);
  });

  it('uses generated operational routes and sends the idempotency header', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ areas: [] }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ rooms: [] }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ modules: [] }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            command: {
              commandId: 'command-1',
              protocolId: 'lamp',
              capabilityId: 'light',
              action: 'set',
              parameters: { on: true },
              status: 'enviado',
              createdAt: '2026-07-28T00:00:00.000Z',
            },
          }),
          { headers: { 'Content-Type': 'application/json' } },
        ),
      );
    vi.stubGlobal('fetch', fetch);
    configureApiClient('http://central.local/api/v1');

    await expect(listOperationalAreas()).resolves.toEqual([]);
    await expect(listOperationalRooms()).resolves.toEqual([]);
    await expect(listOperationalModules()).resolves.toEqual([]);
    await expect(
      createOperationalCommand(
        { protocolId: 'lamp', capabilityId: 'light', action: 'set', parameters: { on: true } },
        'intent-1',
      ),
    ).resolves.toMatchObject({ commandId: 'command-1', status: 'enviado' });

    expect(
      fetch.mock.calls.map(([input]) => (input instanceof Request ? input.url : String(input))),
    ).toEqual([
      'http://central.local/api/v1/areas',
      'http://central.local/api/v1/rooms',
      'http://central.local/api/v1/modules',
      'http://central.local/api/v1/commands',
    ]);
    const commandCall = fetch.mock.calls[3];
    if (!commandCall) throw new Error('A solicitação de comando não foi executada.');
    const headers =
      commandCall[0] instanceof Request ? commandCall[0].headers : commandCall[1]?.headers;
    expect(new Headers(headers).get('Idempotency-Key')).toBe('intent-1');
  });
});
