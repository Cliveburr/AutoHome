import {
  createOperationalCommand,
  listOperationalAreas,
  listOperationalModules,
  listOperationalRooms,
} from './api/client';
import type {
  Area,
  Command,
  CreateCommandRequest,
  Module,
  ModuleCapability,
  ModuleDetail,
  ParameterDeclaration,
  Room,
} from './api/client';

export const operationInventoryKey = ['operation', 'inventory'] as const;
export const operationModuleKey = (protocolId: string) =>
  ['operation', 'module', protocolId] as const;
export const operationCommandKey = (commandId: string) =>
  ['operation', 'command', commandId] as const;

export interface OperationInventory {
  areas: Area[];
  rooms: Room[];
  modules: Module[];
}

export interface OperationRoom {
  room: Room;
  modules: Module[];
  capabilitySummary: string;
  unavailableModules: number;
}

export interface OperationRoomGroup {
  id: string;
  name: string;
  rooms: OperationRoom[];
}

export interface OperationControl {
  id: string;
  label: string;
  moduleName: string;
  capabilityName: string;
  capabilityId: string;
  action: string;
  parameters: Record<string, boolean | number | string>;
  kind: 'action' | 'boolean';
  active?: boolean;
}

export type OperationCommandStatus = 'pendente' | 'confirmado' | 'falhou' | 'indisponivel';

export async function loadOperationInventory(): Promise<OperationInventory> {
  const [areas, rooms, modules] = await Promise.all([
    listOperationalAreas(),
    listOperationalRooms(),
    listOperationalModules(),
  ]);
  return { areas, rooms, modules };
}

export function groupOperationRooms(inventory: OperationInventory): OperationRoomGroup[] {
  const roomsByArea = new Map<string, Room[]>();
  const knownAreaIds = new Set(inventory.areas.map((area) => area.id));
  const unassigned: Room[] = [];

  for (const room of inventory.rooms) {
    if (room.areaId && knownAreaIds.has(room.areaId)) {
      const rooms = roomsByArea.get(room.areaId) ?? [];
      rooms.push(room);
      roomsByArea.set(room.areaId, rooms);
    } else {
      unassigned.push(room);
    }
  }

  const sortedAreas = [...inventory.areas].sort(comparePositionAndName);
  const groups = sortedAreas.flatMap((area) => {
    const rooms = roomsByArea.get(area.id) ?? [];
    return rooms.length
      ? [{ id: area.id, name: area.name, rooms: toOperationRooms(rooms, inventory.modules) }]
      : [];
  });

  if (unassigned.length) {
    groups.push({
      id: 'unassigned',
      name: 'Sem área',
      rooms: toOperationRooms(unassigned, inventory.modules),
    });
  }

  return groups;
}

export function getRoomModules(inventory: OperationInventory, roomId: string): Module[] {
  return inventory.modules.filter((module) => module.roomId === roomId);
}

export function deriveOperationControls(module: ModuleDetail, moduleIndex = 0): OperationControl[] {
  if (module.availability !== 'online') return [];

  return module.capabilities.flatMap((capability) =>
    (capability.actions ?? []).flatMap((action) => {
      const parameters = action.parameters ?? [];
      const base = {
        capabilityId: capability.id,
        capabilityName: capabilityDisplayName(capability),
        moduleName: module.name ?? `Módulo ${moduleIndex + 1}`,
      };

      if (!parameters.length) {
        return {
          ...base,
          id: `${module.protocolId}:${capability.id}:${action.name}`,
          label: actionDisplayName(action.name, capability),
          action: action.name,
          parameters: {},
          kind: 'action' as const,
        };
      }

      const [parameter] = parameters;
      if (!parameter || parameters.length !== 1 || parameter.type !== 'boolean') return [];
      const nextValue = nextBooleanValue(module, capability, parameter);
      if (nextValue === undefined) return [];

      return {
        ...base,
        id: `${module.protocolId}:${capability.id}:${action.name}:${parameter.key}`,
        label: actionDisplayName(action.name, capability),
        action: action.name,
        parameters: { [parameter.key]: nextValue },
        kind: 'boolean' as const,
        active: !nextValue,
      };
    }),
  );
}

export function commandStatus(command: Command): OperationCommandStatus {
  switch (command.status) {
    case 'confirmado':
      return 'confirmado';
    case 'falhou':
      return 'falhou';
    case 'indisponivel':
      return 'indisponivel';
    default:
      return 'pendente';
  }
}

export async function sendOperationCommand(
  module: Pick<Module, 'protocolId'>,
  control: Pick<OperationControl, 'capabilityId' | 'action' | 'parameters'>,
): Promise<Command> {
  const body: CreateCommandRequest = {
    protocolId: module.protocolId,
    capabilityId: control.capabilityId,
    action: control.action,
    parameters: control.parameters,
  };
  return createOperationalCommand(body, newIdempotencyKey());
}

function toOperationRooms(rooms: Room[], modules: Module[]): OperationRoom[] {
  return [...rooms].sort(comparePositionAndName).map((room) => {
    const roomModules = getRoomModules({ areas: [], rooms: [], modules }, room.id);
    return {
      room,
      modules: roomModules,
      capabilitySummary: capabilitySummary(roomModules),
      unavailableModules: roomModules.filter((module) => module.availability !== 'online').length,
    };
  });
}

function comparePositionAndName<T extends { name: string; position: number }>(
  left: T,
  right: T,
): number {
  return left.position - right.position || left.name.localeCompare(right.name, 'pt-BR');
}

function capabilitySummary(modules: Module[]): string {
  const capabilities = [
    ...new Set(modules.flatMap((module) => module.capabilities.map(capabilityDisplayName))),
  ];
  return capabilities.length ? capabilities.slice(0, 3).join(', ') : 'Sem controles disponíveis';
}

function capabilityDisplayName(capability: Pick<ModuleCapability, 'id'>): string {
  const identifier = capability.id.toLocaleLowerCase('pt-BR');
  if (/(luz|lamp|light)/.test(identifier)) return 'Luzes';
  if (/(rele|relay|interruptor|switch)/.test(identifier)) return 'Interruptores';
  return 'Controles';
}

function actionDisplayName(action: string, capability: Pick<ModuleCapability, 'id'>): string {
  const capabilityName = capabilityDisplayName(capability);
  const normalized = action.toLocaleLowerCase('pt-BR');
  if (normalized === 'toggle') return `Alternar ${capabilityName.toLocaleLowerCase('pt-BR')}`;
  if (normalized === 'set') return capabilityName.slice(0, -1) || 'Controle';
  return `${capabilityName}: ${action}`;
}

function nextBooleanValue(
  module: ModuleDetail,
  capability: Pick<ModuleCapability, 'id'>,
  parameter: ParameterDeclaration,
): boolean | undefined {
  const allowed = parameter.enum?.filter((value): value is boolean => typeof value === 'boolean');
  if (parameter.enum && !allowed?.length) return undefined;

  const values = module.state?.values ?? {};
  const current = [
    values[`${capability.id}.${parameter.key}`],
    values[parameter.key],
    values[capability.id],
  ].find((value): value is boolean => typeof value === 'boolean');
  const preferred = current === undefined ? true : !current;
  if (!allowed) return preferred;
  return allowed.includes(preferred) ? preferred : allowed[0];
}

function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
