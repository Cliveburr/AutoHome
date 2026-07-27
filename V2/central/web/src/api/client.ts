import { client } from './generated/client.gen';

export function configureApiClient(baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1') {
  return client.setConfig({ baseUrl, credentials: 'include' });
}

export { changePassword, getCurrentSession, getHealth, login, logout } from './generated';
export type * from './generated';
