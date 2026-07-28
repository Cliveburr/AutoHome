import { client } from './generated/client.gen';
import {
  changePassword as generatedChangePassword,
  createCommand as generatedCreateCommand,
  getCommand as generatedGetCommand,
  getCurrentSession as generatedGetCurrentSession,
  getModuleDetail as generatedGetModuleDetail,
  listAreas as generatedListAreas,
  listModules as generatedListModules,
  listRooms as generatedListRooms,
  login as generatedLogin,
  logout as generatedLogout,
} from './generated/sdk.gen';
import type {
  ChangePasswordRequest,
  Command,
  CreateCommandRequest,
  LoginRequestWritable,
  Module,
  ModuleDetail,
  SessionResponse,
  Area,
  Room,
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

export async function listOperationalAreas(): Promise<Area[]> {
  try {
    const { data } = await generatedListAreas({ throwOnError: true });
    return data.areas;
  } catch (error) {
    throw toApiRequestError(error);
  }
}

export async function listOperationalRooms(): Promise<Room[]> {
  try {
    const { data } = await generatedListRooms({ throwOnError: true });
    return data.rooms;
  } catch (error) {
    throw toApiRequestError(error);
  }
}

export async function listOperationalModules(): Promise<Module[]> {
  try {
    const { data } = await generatedListModules({ throwOnError: true });
    return data.modules;
  } catch (error) {
    throw toApiRequestError(error);
  }
}

export async function getOperationalModuleDetail(protocolId: string): Promise<ModuleDetail> {
  try {
    const { data } = await generatedGetModuleDetail({
      path: { protocolId },
      throwOnError: true,
    });
    return data.module;
  } catch (error) {
    throw toApiRequestError(error);
  }
}

export async function createOperationalCommand(
  body: CreateCommandRequest,
  idempotencyKey: string,
): Promise<Command> {
  try {
    const { data } = await generatedCreateCommand({
      body,
      headers: { 'Idempotency-Key': idempotencyKey },
      throwOnError: true,
    });
    return data.command;
  } catch (error) {
    throw toApiRequestError(error);
  }
}

export async function getOperationalCommand(commandId: string): Promise<Command> {
  try {
    const { data } = await generatedGetCommand({ path: { commandId }, throwOnError: true });
    return data.command;
  } catch (error) {
    throw toApiRequestError(error);
  }
}

export type {
  ActionDeclaration,
  Area,
  Command,
  CreateCommandRequest,
  Module,
  ModuleCapability,
  ModuleDetail,
  ModuleState,
  ParameterDeclaration,
  Room,
  SessionResponse,
  User,
} from './generated/types.gen';
