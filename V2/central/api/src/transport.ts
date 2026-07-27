export type ParameterValue = boolean | number | string;
export type ParameterType = 'boolean' | 'number' | 'string';

export interface ParameterDeclaration {
  key: string;
  type: ParameterType;
  minimum?: number;
  maximum?: number;
  enum?: readonly ParameterValue[];
  required?: boolean;
}

export interface ModuleActionDeclaration {
  name: string;
  parameters?: readonly ParameterDeclaration[];
}

export interface ModuleCapability {
  id: string;
  configuration?: readonly ParameterDeclaration[];
  events?: readonly string[];
  actions?: readonly ModuleActionDeclaration[];
}

export type TransportOperation = 'command' | 'configuration' | 'local_link' | 'ota';

export interface TransportModule {
  protocolId: string;
  family: string;
  capabilities: readonly ModuleCapability[];
  transport: 'simulated';
}

export interface ModuleState {
  values: Readonly<Record<string, unknown>>;
  firmwareHash?: string;
  observedAt: Date;
}

export type TransportEvent =
  | { type: 'module.discovered'; module: TransportModule; occurredAt: Date }
  | { type: 'module.available'; protocolId: string; occurredAt: Date }
  | { type: 'module.state'; protocolId: string; state: ModuleState; occurredAt: Date }
  | {
      type: 'operation.confirmed';
      protocolId: string;
      operation: TransportOperation;
      correlationId: string;
      occurredAt: Date;
    }
  | {
      type: 'operation.failed';
      protocolId: string;
      operation: TransportOperation;
      correlationId: string;
      reason: 'simulated_failure';
      occurredAt: Date;
    }
  | {
      type: 'module.unavailable';
      protocolId: string;
      operation: TransportOperation | 'state' | 'firmware_hash';
      occurredAt: Date;
    }
  | {
      type: 'ota.transfer_failed';
      protocolId: string;
      expectedHash: string;
      reason: string;
      occurredAt: Date;
    };

export type TransportOperationResult =
  | { status: 'confirmed' }
  | { status: 'pending' }
  | { status: 'unavailable' }
  | { status: 'failed'; reason: 'simulated_failure' };

export interface ModuleTransport {
  subscribe(listener: (event: TransportEvent) => void): () => void;
  requestState(protocolId: string): Promise<ModuleState | undefined>;
  requestFirmwareHash(protocolId: string): Promise<string | undefined>;
  sendCommand(input: {
    protocolId: string;
    action: string;
    parameters: Readonly<Record<string, unknown>>;
    correlationId: string;
  }): Promise<TransportOperationResult>;
  distributeConfiguration(input: {
    protocolId: string;
    configuration: Readonly<Record<string, unknown>>;
    correlationId: string;
  }): Promise<TransportOperationResult>;
  distributeLocalLink(input: {
    protocolId: string;
    link: Readonly<Record<string, unknown>>;
    correlationId: string;
  }): Promise<TransportOperationResult>;
  transferFirmware(input: {
    protocolId: string;
    expectedHash: string;
    firmware: Uint8Array;
    correlationId: string;
  }): Promise<TransportOperationResult>;
}

interface SimulatedModule {
  module: TransportModule;
  available: boolean;
  state: ModuleState;
  nextTransferFailure?: string;
  autoConfirm: Set<TransportOperation>;
  nextOperationFailure: Partial<Record<TransportOperation, true>>;
}

/** Development/test adapter. It models Central-facing declarations and events, never packets. */
export class InMemoryModuleTransport implements ModuleTransport {
  private readonly modules = new Map<string, SimulatedModule>();
  private readonly listeners = new Set<(event: TransportEvent) => void>();

  subscribe(listener: (event: TransportEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  registerModule(input: {
    protocolId: string;
    family: string;
    capabilities: readonly ModuleCapability[];
    state?: Readonly<Record<string, unknown>>;
    firmwareHash?: string;
  }): TransportModule {
    if (this.modules.has(input.protocolId)) {
      throw new Error(
        `A simulated module with protocolId ${input.protocolId} is already registered.`,
      );
    }
    const module: TransportModule = {
      protocolId: input.protocolId,
      family: input.family,
      capabilities: input.capabilities.map(cloneCapability),
      transport: 'simulated',
    };
    this.modules.set(input.protocolId, {
      module,
      available: true,
      state: {
        values: { ...input.state },
        ...(input.firmwareHash === undefined ? {} : { firmwareHash: input.firmwareHash }),
        observedAt: new Date(),
      },
      autoConfirm: new Set(['command', 'configuration', 'local_link', 'ota']),
      nextOperationFailure: {},
    });
    this.emit({ type: 'module.discovered', module, occurredAt: new Date() });
    return module;
  }

  setAvailability(protocolId: string, available: boolean): void {
    const simulated = this.requireModule(protocolId);
    if (simulated.available === available) return;
    simulated.available = available;
    if (available) this.emit({ type: 'module.available', protocolId, occurredAt: new Date() });
    else this.emitUnavailable(protocolId, 'state');
  }

  setAutoConfirm(protocolId: string, operation: TransportOperation, enabled: boolean): void {
    const simulated = this.requireModule(protocolId);
    if (enabled) simulated.autoConfirm.add(operation);
    else simulated.autoConfirm.delete(operation);
  }

  failNextOperation(protocolId: string, operation: TransportOperation): void {
    this.requireModule(protocolId).nextOperationFailure[operation] = true;
  }

  confirmOperation(protocolId: string, operation: TransportOperation, correlationId: string): void {
    const simulated = this.requireModule(protocolId);
    if (!simulated.available) {
      this.emitUnavailable(protocolId, operation);
      return;
    }
    this.emit({
      type: 'operation.confirmed',
      protocolId,
      operation,
      correlationId,
      occurredAt: new Date(),
    });
  }

  setState(protocolId: string, values: Readonly<Record<string, unknown>>): void {
    const simulated = this.requireModule(protocolId);
    simulated.state = { ...simulated.state, values: { ...values }, observedAt: new Date() };
    if (simulated.available) this.emitState(protocolId, simulated.state);
  }

  failNextTransfer(protocolId: string, reason: string): void {
    this.requireModule(protocolId).nextTransferFailure = reason;
  }

  async requestState(protocolId: string): Promise<ModuleState | undefined> {
    const simulated = this.modules.get(protocolId);
    if (!simulated || !simulated.available) {
      this.emitUnavailable(protocolId, 'state');
      return undefined;
    }
    this.emitState(protocolId, simulated.state);
    return simulated.state;
  }

  async requestFirmwareHash(protocolId: string): Promise<string | undefined> {
    const simulated = this.modules.get(protocolId);
    if (!simulated || !simulated.available) {
      this.emitUnavailable(protocolId, 'firmware_hash');
      return undefined;
    }
    return simulated.state.firmwareHash;
  }

  async sendCommand(input: {
    protocolId: string;
    action: string;
    parameters: Readonly<Record<string, unknown>>;
    correlationId: string;
  }): Promise<TransportOperationResult> {
    return this.completeOperation(input.protocolId, 'command', input.correlationId);
  }

  async distributeConfiguration(input: {
    protocolId: string;
    configuration: Readonly<Record<string, unknown>>;
    correlationId: string;
  }): Promise<TransportOperationResult> {
    return this.completeOperation(input.protocolId, 'configuration', input.correlationId);
  }

  async distributeLocalLink(input: {
    protocolId: string;
    link: Readonly<Record<string, unknown>>;
    correlationId: string;
  }): Promise<TransportOperationResult> {
    return this.completeOperation(input.protocolId, 'local_link', input.correlationId);
  }

  async transferFirmware(input: {
    protocolId: string;
    expectedHash: string;
    firmware: Uint8Array;
    correlationId: string;
  }): Promise<TransportOperationResult> {
    const simulated = this.modules.get(input.protocolId);
    if (!simulated || !simulated.available) {
      this.emitUnavailable(input.protocolId, 'ota');
      return { status: 'unavailable' };
    }
    if (simulated.nextTransferFailure) {
      const reason = simulated.nextTransferFailure;
      simulated.nextTransferFailure = undefined;
      this.emit({
        type: 'ota.transfer_failed',
        protocolId: input.protocolId,
        expectedHash: input.expectedHash,
        reason,
        occurredAt: new Date(),
      });
      return { status: 'failed', reason: 'simulated_failure' };
    }
    simulated.state = {
      ...simulated.state,
      firmwareHash: input.expectedHash,
      observedAt: new Date(),
    };
    this.emitState(input.protocolId, simulated.state);
    return this.completeOperation(input.protocolId, 'ota', input.correlationId);
  }

  private requireModule(protocolId: string): SimulatedModule {
    const simulated = this.modules.get(protocolId);
    if (!simulated)
      throw new Error(`No simulated module is registered with protocolId ${protocolId}.`);
    return simulated;
  }

  private async completeOperation(
    protocolId: string,
    operation: TransportOperation,
    correlationId: string,
  ): Promise<TransportOperationResult> {
    const simulated = this.modules.get(protocolId);
    if (!simulated || !simulated.available) {
      this.emitUnavailable(protocolId, operation);
      return { status: 'unavailable' };
    }
    if (simulated.nextOperationFailure[operation]) {
      delete simulated.nextOperationFailure[operation];
      this.emit({
        type: 'operation.failed',
        protocolId,
        operation,
        correlationId,
        reason: 'simulated_failure',
        occurredAt: new Date(),
      });
      return { status: 'failed', reason: 'simulated_failure' };
    }
    if (!simulated.autoConfirm.has(operation)) return { status: 'pending' };
    this.confirmOperation(protocolId, operation, correlationId);
    return { status: 'confirmed' };
  }

  private emitState(protocolId: string, state: ModuleState): void {
    this.emit({ type: 'module.state', protocolId, state, occurredAt: new Date() });
  }

  private emitUnavailable(
    protocolId: string,
    operation: TransportOperation | 'state' | 'firmware_hash',
  ): void {
    this.emit({ type: 'module.unavailable', protocolId, operation, occurredAt: new Date() });
  }

  private emit(event: TransportEvent): void {
    for (const listener of this.listeners) listener(event);
  }
}

function cloneCapability(capability: ModuleCapability): ModuleCapability {
  return {
    id: capability.id,
    ...(capability.configuration
      ? {
          configuration: capability.configuration.map((parameter) => ({
            ...parameter,
            ...(parameter.enum ? { enum: [...parameter.enum] } : {}),
          })),
        }
      : {}),
    ...(capability.events ? { events: [...capability.events] } : {}),
    ...(capability.actions
      ? {
          actions: capability.actions.map((action) => ({
            name: action.name,
            ...(action.parameters
              ? {
                  parameters: action.parameters.map((parameter) => ({
                    ...parameter,
                    ...(parameter.enum ? { enum: [...parameter.enum] } : {}),
                  })),
                }
              : {}),
          })),
        }
      : {}),
  };
}
