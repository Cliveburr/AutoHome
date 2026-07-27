import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureApiClient, getSession, setUnauthenticatedHandler } from './client';

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
});
