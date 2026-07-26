import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { ConfigurationError, loadConfig } from '../src/config.js';

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
