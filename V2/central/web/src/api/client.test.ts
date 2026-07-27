import { describe, expect, it } from 'vitest';
import { configureApiClient } from './client';

describe('generated API client', () => {
  it('uses the central API base URL and includes the session cookie', () => {
    const configuration = configureApiClient('http://central.local/api/v1');

    expect(configuration.baseUrl).toBe('http://central.local/api/v1');
    expect(configuration.credentials).toBe('include');
  });
});
