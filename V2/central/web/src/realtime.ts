import type { QueryClient } from '@tanstack/react-query';
import type { Command, ModuleDetail, ModuleState } from './api/client';
import {
  operationCommandKey,
  operationInventoryKey,
  operationModuleKey,
  type OperationInventory,
} from './operation';

type RealtimeEventType =
  | 'module.state.changed'
  | 'module.availability.changed'
  | 'command.updated'
  | 'realtime.reconciliation.required';

interface RealtimeEvent {
  eventId: string;
  type: RealtimeEventType;
  data: Record<string, unknown>;
}

interface RealtimeSocket {
  addEventListener(type: string, listener: EventListener): void;
  close(): void;
}

export interface OperationalRealtimeOptions {
  createSocket?: (url: string) => RealtimeSocket;
  reconnectDelayMs?: number;
}

export class OperationalRealtime {
  private socket: RealtimeSocket | undefined;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private lastEventId: string | undefined;
  private running = false;

  constructor(
    private readonly queryClient: QueryClient,
    private readonly options: OperationalRealtimeOptions = {},
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.connect();
  }

  stop(): void {
    this.running = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    this.socket?.close();
    this.socket = undefined;
  }

  private connect(): void {
    if (!this.running) return;
    const socket = (this.options.createSocket ?? defaultSocket)(websocketUrl(this.lastEventId));
    this.socket = socket;
    socket.addEventListener('message', ((event: MessageEvent) =>
      this.receive(event.data)) as EventListener);
    socket.addEventListener('close', (() => this.scheduleReconnect()) as EventListener);
  }

  private receive(message: unknown): void {
    if (typeof message !== 'string') return;
    let event: unknown;
    try {
      event = JSON.parse(message);
    } catch {
      return;
    }
    if (!isRealtimeEvent(event)) return;
    this.lastEventId = event.eventId;

    switch (event.type) {
      case 'module.state.changed':
        this.applyModuleState(event.data);
        break;
      case 'module.availability.changed':
        this.applyModuleAvailability(event.data);
        break;
      case 'command.updated':
        this.applyCommand(event.data);
        break;
      case 'realtime.reconciliation.required':
        void this.reconcile();
        break;
    }
  }

  private applyModuleState(data: Record<string, unknown>): void {
    if (typeof data.protocolId !== 'string' || !isModuleState(data.state)) return;
    const protocolId = data.protocolId;
    const state = data.state;
    this.queryClient.setQueryData<ModuleDetail>(operationModuleKey(protocolId), (module) =>
      module ? { ...module, state } : module,
    );
    void this.queryClient.invalidateQueries({ queryKey: operationModuleKey(protocolId) });
  }

  private applyModuleAvailability(data: Record<string, unknown>): void {
    if (
      typeof data.protocolId !== 'string' ||
      (data.availability !== 'online' && data.availability !== 'offline')
    ) {
      return;
    }
    const protocolId = data.protocolId;
    const availability = data.availability;
    this.queryClient.setQueryData<OperationInventory>(operationInventoryKey, (inventory) =>
      inventory
        ? {
            ...inventory,
            modules: inventory.modules.map((module) =>
              module.protocolId === protocolId ? { ...module, availability } : module,
            ),
          }
        : inventory,
    );
    this.queryClient.setQueryData<ModuleDetail>(operationModuleKey(protocolId), (module) =>
      module ? { ...module, availability } : module,
    );
    void this.queryClient.invalidateQueries({ queryKey: operationModuleKey(protocolId) });
  }

  private applyCommand(data: Record<string, unknown>): void {
    if (!isCommand(data.command)) return;
    this.queryClient.setQueryData(operationCommandKey(data.command.commandId), data.command);
  }

  private async reconcile(): Promise<void> {
    await this.queryClient.invalidateQueries({ queryKey: operationInventoryKey });
    await this.queryClient.invalidateQueries({ queryKey: ['operation', 'module'] });
    await this.queryClient.invalidateQueries({ queryKey: ['operation', 'command'] });
  }

  private scheduleReconnect(): void {
    if (!this.running) return;
    this.reconnectTimer = setTimeout(() => this.connect(), this.options.reconnectDelayMs ?? 1000);
  }
}

export function websocketUrl(eventId?: string): string {
  const url = new URL('/api/v1/realtime', window.location.origin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  if (eventId) url.searchParams.set('eventId', eventId);
  return url.toString();
}

function defaultSocket(url: string): RealtimeSocket {
  return new WebSocket(url);
}

function isRealtimeEvent(value: unknown): value is RealtimeEvent {
  if (!isRecord(value) || typeof value.eventId !== 'string' || !isRecord(value.data)) return false;
  return (
    value.type === 'module.state.changed' ||
    value.type === 'module.availability.changed' ||
    value.type === 'command.updated' ||
    value.type === 'realtime.reconciliation.required'
  );
}

function isModuleState(value: unknown): value is ModuleState {
  return isRecord(value) && isRecord(value.values) && typeof value.observedAt === 'string';
}

function isCommand(value: unknown): value is Command {
  return (
    isRecord(value) &&
    typeof value.commandId === 'string' &&
    typeof value.protocolId === 'string' &&
    typeof value.capabilityId === 'string' &&
    typeof value.action === 'string' &&
    isRecord(value.parameters) &&
    typeof value.createdAt === 'string' &&
    ['aguardando', 'enviado', 'confirmado', 'falhou', 'indisponivel'].includes(String(value.status))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
