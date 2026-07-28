import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { operationCommandKey, operationInventoryKey, operationModuleKey } from './operation';
import { OperationalRealtime } from './realtime';

class FakeSocket {
  private readonly listeners = new Map<string, EventListener[]>();
  addEventListener(type: string, listener: EventListener) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  close() {}
  emit(type: string, data?: string) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(type === 'message' ? new MessageEvent('message', { data }) : new Event(type));
    }
  }
}

describe('OperationalRealtime', () => {
  it('updates module state, availability, and command caches from authenticated events', () => {
    const queryClient = new QueryClient();
    const socket = new FakeSocket();
    queryClient.setQueryData(operationInventoryKey, {
      areas: [],
      rooms: [],
      modules: [{ protocolId: 'lamp', availability: 'online' }],
    });
    queryClient.setQueryData(operationModuleKey('lamp'), {
      protocolId: 'lamp',
      availability: 'online',
    });
    const realtime = new OperationalRealtime(queryClient, {
      createSocket: () => socket,
      reconnectDelayMs: 1,
    });
    realtime.start();

    socket.emit(
      'message',
      JSON.stringify({
        eventId: 'state-1',
        type: 'module.state.changed',
        data: {
          protocolId: 'lamp',
          state: { values: { on: true }, observedAt: '2026-07-28T00:00:00.000Z' },
        },
      }),
    );
    socket.emit(
      'message',
      JSON.stringify({
        eventId: 'availability-1',
        type: 'module.availability.changed',
        data: { protocolId: 'lamp', availability: 'offline' },
      }),
    );
    socket.emit(
      'message',
      JSON.stringify({
        eventId: 'command-1',
        type: 'command.updated',
        data: {
          command: {
            commandId: 'command-1',
            protocolId: 'lamp',
            capabilityId: 'light',
            action: 'set',
            parameters: { on: true },
            status: 'confirmado',
            createdAt: '2026-07-28T00:00:00.000Z',
          },
        },
      }),
    );

    expect(queryClient.getQueryData(operationModuleKey('lamp'))).toMatchObject({
      availability: 'offline',
      state: { values: { on: true } },
    });
    expect(queryClient.getQueryData(operationInventoryKey)).toMatchObject({
      modules: [{ protocolId: 'lamp', availability: 'offline' }],
    });
    expect(queryClient.getQueryData(operationCommandKey('command-1'))).toMatchObject({
      status: 'confirmado',
    });
    realtime.stop();
  });

  it('invalidates HTTP projections when reconciliation is required', async () => {
    const queryClient = new QueryClient();
    const socket = new FakeSocket();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    const realtime = new OperationalRealtime(queryClient, { createSocket: () => socket });
    realtime.start();

    socket.emit(
      'message',
      JSON.stringify({
        eventId: 'reconcile-1',
        type: 'realtime.reconciliation.required',
        data: { resources: ['GET /api/v1/modules'] },
      }),
    );

    await vi.waitFor(() => expect(invalidateQueries).toHaveBeenCalledTimes(3));
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: operationInventoryKey });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['operation', 'module'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['operation', 'command'] });
    realtime.stop();
  });
});
