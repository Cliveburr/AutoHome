import { describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  createOperationalCommand: vi.fn(),
  getOperationalModuleDetail: vi.fn(),
  listOperationalAreas: vi.fn(),
  listOperationalModules: vi.fn(),
  listOperationalRooms: vi.fn(),
}));

vi.mock('./api/client', () => api);

import {
  commandStatus,
  deriveOperationControls,
  groupOperationRooms,
  sendOperationCommand,
} from './operation';
import type { ModuleDetail } from './api/client';

const module: ModuleDetail = {
  id: 'module-1',
  protocolId: 'garage-light',
  family: 'gen1',
  capabilities: [
    { id: 'light', actions: [{ name: 'set', parameters: [{ key: 'on', type: 'boolean' }] }] },
  ],
  transport: 'simulated' as const,
  status: 'cadastrado' as const,
  availability: 'online' as const,
  discoveredAt: '2026-07-28T00:00:00.000Z',
  lastSeenAt: '2026-07-28T00:00:00.000Z',
  lastObservedAt: '2026-07-28T00:00:00.000Z',
  roomId: 'room-1',
  configurations: [],
  localLinks: [],
  state: { values: { on: false }, observedAt: '2026-07-28T00:00:00.000Z' },
};

describe('operation models', () => {
  it('groups ordered rooms, keeps unassigned rooms, and omits modules without a room', () => {
    const groups = groupOperationRooms({
      areas: [{ id: 'area-1', name: 'Social', position: 0 }],
      rooms: [
        { id: 'room-2', name: 'Entrada', position: 0 },
        { id: 'room-1', name: 'Sala', areaId: 'area-1', position: 0 },
      ],
      modules: [module, { ...module, protocolId: 'unassigned-module', roomId: undefined }],
    });

    expect(groups.map((group) => group.name)).toEqual(['Social', 'Sem área']);
    expect(groups[0]?.rooms[0]?.modules).toHaveLength(1);
    expect(
      groups.flatMap((group) => group.rooms.flatMap((room) => room.modules)),
    ).not.toContainEqual(expect.objectContaining({ protocolId: 'unassigned-module' }));
  });

  it('derives a boolean light control only from a declared action and valid parameter', () => {
    const controls = deriveOperationControls(module);
    expect(controls).toEqual([
      expect.objectContaining({
        capabilityId: 'light',
        action: 'set',
        kind: 'boolean',
        parameters: { on: true },
      }),
    ]);
    expect(deriveOperationControls({ ...module, capabilities: [{ id: 'light' }] })).toEqual([]);
    expect(
      deriveOperationControls({
        ...module,
        capabilities: [
          { id: 'light', actions: [{ name: 'set', parameters: [{ key: 'on', type: 'string' }] }] },
        ],
      }),
    ).toEqual([]);
  });

  it('maps persistent command states and sends one new idempotency key per intention', async () => {
    api.createOperationalCommand.mockResolvedValue({ commandId: 'command-1', status: 'enviado' });
    expect(commandStatus({ commandId: 'pending', status: 'enviado' } as never)).toBe('pendente');
    expect(commandStatus({ commandId: 'confirmed', status: 'confirmado' } as never)).toBe(
      'confirmado',
    );
    expect(commandStatus({ commandId: 'offline', status: 'indisponivel' } as never)).toBe(
      'indisponivel',
    );

    const control = deriveOperationControls(module)[0];
    if (!control) throw new Error('O controle booleano deveria ter sido derivado.');
    await sendOperationCommand(module, control);
    await sendOperationCommand(module, control);

    const keys = api.createOperationalCommand.mock.calls.map((call) => call[1]);
    expect(keys[0]).toEqual(expect.any(String));
    expect(keys[1]).toEqual(expect.any(String));
    expect(keys[0]).not.toBe(keys[1]);
    expect(api.createOperationalCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        protocolId: 'garage-light',
        capabilityId: 'light',
        action: 'set',
        parameters: { on: true },
      }),
      expect.any(String),
    );
  });
});
