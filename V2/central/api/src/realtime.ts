import { randomUUID } from 'node:crypto';
import type { WebSocket } from 'ws';

export type RealtimeEventType =
  | 'module.state.changed'
  | 'module.availability.changed'
  | 'command.updated'
  | 'realtime.reconciliation.required';

export interface RealtimeEvent {
  eventId: string;
  type: RealtimeEventType;
  occurredAt: string;
  data: Record<string, unknown>;
}

export class RealtimeService {
  private readonly clients = new Set<WebSocket>();
  private readonly events: RealtimeEvent[] = [];

  constructor(private readonly bufferLimit = 100) {}

  publish(
    type: Exclude<RealtimeEventType, 'realtime.reconciliation.required'>,
    data: Record<string, unknown>,
  ): RealtimeEvent {
    const event: RealtimeEvent = {
      eventId: randomUUID(),
      type,
      occurredAt: new Date().toISOString(),
      data,
    };
    this.events.push(event);
    if (this.events.length > this.bufferLimit) this.events.shift();
    this.broadcast(event);
    return event;
  }

  connect(socket: WebSocket, eventId?: string): void {
    this.clients.add(socket);
    socket.on('close', () => this.clients.delete(socket));
    if (!eventId) return;
    const index = this.events.findIndex((event) => event.eventId === eventId);
    if (index < 0) {
      this.send(socket, this.reconciliationEvent());
      return;
    }
    for (const event of this.events.slice(index + 1)) this.send(socket, event);
  }

  private reconciliationEvent(): RealtimeEvent {
    return {
      eventId: randomUUID(),
      type: 'realtime.reconciliation.required',
      occurredAt: new Date().toISOString(),
      data: { resources: ['GET /api/v1/modules', 'GET /api/v1/commands/{commandId}'] },
    };
  }

  private broadcast(event: RealtimeEvent): void {
    for (const client of this.clients) this.send(client, event);
  }

  private send(socket: WebSocket, event: RealtimeEvent): void {
    if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(event));
  }
}
