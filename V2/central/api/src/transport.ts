export type TransportOperation = 'command' | 'configuration' | 'ota';

export interface TransportModule {
  protocolId: string;
  family: string;
  capabilities: readonly string[];
  transport: 'simulated';
}

export interface ModuleState {
  values: Readonly<Record<string, unknown>>;
  firmwareHash?: string;
  observedAt: Date;
}

export type TransportEvent =
  | { type: 'module.discovered'; module: TransportModule; occurredAt: Date }
  | { type: 'module.state'; protocolId: string; state: ModuleState; occurredAt: Date }
  | {
      type: 'operation.confirmed';
      protocolId: string;
      operation: TransportOperation;
      correlationId: string;
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
  { status: 'confirmed' } | { status: 'unavailable' } | { status: 'failed'; reason: string };

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
}

/**
 * Development and test adapter. It deliberately models central-facing events,
 * not packets or wire serialization from the protocol that is still pending.
 */
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
    capabilities: readonly string[];
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
      capabilities: [...input.capabilities],
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
    });
    this.emit({ type: 'module.discovered', module, occurredAt: new Date() });
    return module;
  }

  setAvailability(protocolId: string, available: boolean): void {
    const simulated = this.requireModule(protocolId);
    simulated.available = available;
  }

  setState(protocolId: string, values: Readonly<Record<string, unknown>>): void {
    const simulated = this.requireModule(protocolId);
    simulated.state = { ...simulated.state, values: { ...values }, observedAt: new Date() };
    if (simulated.available) {
      this.emitState(protocolId, simulated.state);
    }
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
    return this.confirmOperation(input.protocolId, 'command', input.correlationId);
  }

  async distributeConfiguration(input: {
    protocolId: string;
    configuration: Readonly<Record<string, unknown>>;
    correlationId: string;
  }): Promise<TransportOperationResult> {
    return this.confirmOperation(input.protocolId, 'configuration', input.correlationId);
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
      return { status: 'failed', reason };
    }

    simulated.state = {
      ...simulated.state,
      firmwareHash: input.expectedHash,
      observedAt: new Date(),
    };
    this.emitState(input.protocolId, simulated.state);
    return this.confirmOperation(input.protocolId, 'ota', input.correlationId);
  }

  private requireModule(protocolId: string): SimulatedModule {
    const simulated = this.modules.get(protocolId);
    if (!simulated) {
      throw new Error(`No simulated module is registered with protocolId ${protocolId}.`);
    }
    return simulated;
  }

  private async confirmOperation(
    protocolId: string,
    operation: TransportOperation,
    correlationId: string,
  ): Promise<TransportOperationResult> {
    const simulated = this.modules.get(protocolId);
    if (!simulated || !simulated.available) {
      this.emitUnavailable(protocolId, operation);
      return { status: 'unavailable' };
    }

    this.emit({
      type: 'operation.confirmed',
      protocolId,
      operation,
      correlationId,
      occurredAt: new Date(),
    });
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
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
