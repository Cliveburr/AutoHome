import { client } from './generated/client.gen';
import {
  changePassword as generatedChangePassword,
  getCurrentSession as generatedGetCurrentSession,
  login as generatedLogin,
  logout as generatedLogout,
} from './generated/sdk.gen';
import type {
  ChangePasswordRequest,
  LoginRequestWritable,
  SessionResponse,
} from './generated/types.gen';

interface ApiErrorPayload {
  code?: string;
  message?: string;
  requestId?: string;
}

export class ApiRequestError extends Error {
  readonly status?: number;
  readonly code?: string;

  constructor(message: string, options: { status?: number; code?: string } = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = options.status;
    this.code = options.code;
  }
}

let unauthenticatedHandler: (() => void) | undefined;

function toApiRequestError(error: unknown): ApiRequestError {
  if (error instanceof ApiRequestError) {
    return error;
  }

  const payload = error as ApiErrorPayload | undefined;
  return new ApiRequestError(payload?.message ?? 'Não foi possível concluir a solicitação.', {
    code: payload?.code,
  });
}

export function setUnauthenticatedHandler(handler: (() => void) | undefined) {
  unauthenticatedHandler = handler;
}

export function configureApiClient(baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1') {
  return client.setConfig({
    baseUrl,
    credentials: 'include',
    throwOnError: true,
    fetch: async (input, init) => {
      const response = await fetch(input, init);
      if (response.status === 401) {
        unauthenticatedHandler?.();
      }
      return response;
    },
  });
}

export async function getSession(): Promise<SessionResponse> {
  try {
    const { data } = await generatedGetCurrentSession({ throwOnError: true });
    return data;
  } catch (error) {
    throw toApiRequestError(error);
  }
}

export async function loginSession(body: LoginRequestWritable): Promise<SessionResponse> {
  try {
    const { data } = await generatedLogin({ body, throwOnError: true });
    return data;
  } catch (error) {
    throw toApiRequestError(error);
  }
}

export async function changeSessionPassword(body: ChangePasswordRequest): Promise<SessionResponse> {
  try {
    const { data } = await generatedChangePassword({ body, throwOnError: true });
    return data;
  } catch (error) {
    throw toApiRequestError(error);
  }
}

export async function logoutSession(): Promise<void> {
  try {
    await generatedLogout({ throwOnError: true });
  } catch (error) {
    throw toApiRequestError(error);
  }
}

export type { SessionResponse, User } from './generated/types.gen';
