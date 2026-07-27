import { type Collection, type WithId } from 'mongodb';
import { type AuditService } from './audit.js';
import { type AuthenticatedSession } from './authentication.js';
import { type Database } from './database.js';
import { type TransportEvent, type TransportModule } from './transport.js';

export type ModuleInventoryStatus = 'descoberto' | 'cadastrado';
export type ModuleAvailability = 'online' | 'offline';

interface ModuleDocument {
  protocolId: string;
  family: string;
  capabilities: string[];
  transport: TransportModule['transport'];
  status: ModuleInventoryStatus;
  availability: ModuleAvailability;
  discoveredAt: Date;
  lastSeenAt: Date;
  lastObservedAt: Date;
  adoptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicModule {
  id: string;
  protocolId: string;
  family: string;
  capabilities: string[];
  transport: TransportModule['transport'];
  status: ModuleInventoryStatus;
  availability: ModuleAvailability;
  discoveredAt: string;
  lastSeenAt: string;
  lastObservedAt: string;
  adoptedAt?: string;
}

export interface ModuleFilters {
  protocolId?: string;
  family?: string;
  capability?: string;
  transport?: TransportModule['transport'];
  availability?: ModuleAvailability;
}

export type ModuleAdoptionFailure = 'module_not_found' | 'module_already_adopted';

export type ModuleAdoptionResult = { module: PublicModule } | { failure: ModuleAdoptionFailure };

export type AdoptedModuleOperationResult<T> = { executed: true; value: T } | { executed: false };

export class ModuleInventoryService {
  private readonly modules: Collection<ModuleDocument>;

  constructor(
    database: Database,
    private readonly audit: AuditService,
  ) {
    this.modules = database.db.collection<ModuleDocument>('modules');
  }

  async handleTransportEvent(event: TransportEvent): Promise<void> {
    switch (event.type) {
      case 'module.discovered':
        await this.recordDiscovery(event.module, event.occurredAt);
        return;
      case 'module.state':
        await this.recordAvailability(event.protocolId, 'online', event.occurredAt, true);
        return;
      case 'module.unavailable':
        await this.recordAvailability(event.protocolId, 'offline', event.occurredAt, false);
        return;
      case 'operation.confirmed':
      case 'ota.transfer_failed':
        return;
    }
  }

  async listDiscovered(filters: ModuleFilters = {}): Promise<PublicModule[]> {
    return this.listByStatus('descoberto', filters);
  }

  async listRegistered(filters: ModuleFilters = {}): Promise<PublicModule[]> {
    return this.listByStatus('cadastrado', filters);
  }

  async adopt(
    protocolId: string,
    actor: AuthenticatedSession,
    originIp?: string,
  ): Promise<ModuleAdoptionResult> {
    const adoptedAt = new Date();
    const adopted = await this.modules.findOneAndUpdate(
      { protocolId, status: 'descoberto' },
      { $set: { status: 'cadastrado', adoptedAt, updatedAt: adoptedAt } },
      { returnDocument: 'after' },
    );

    if (!adopted) {
      const existing = await this.modules.findOne({ protocolId });
      return { failure: existing ? 'module_already_adopted' : 'module_not_found' };
    }

    await this.audit.record({
      actorUserId: actor.userId,
      action: 'module.adopted',
      result: 'success',
      targetType: 'module',
      targetId: adopted._id.toHexString(),
      originIp,
      sessionId: actor.sessionId,
      details: {
        protocolId: adopted.protocolId,
        family: adopted.family,
        capabilities: adopted.capabilities,
        transport: adopted.transport,
        availability: adopted.availability,
      },
    });

    return { module: this.toPublicModule(adopted) };
  }

  async resolveAdoptedModule(protocolId: string): Promise<PublicModule | undefined> {
    const module = await this.modules.findOne({ protocolId, status: 'cadastrado' });
    return module ? this.toPublicModule(module) : undefined;
  }

  async executeForAdoptedModule<T>(
    protocolId: string,
    operation: (module: PublicModule) => Promise<T>,
  ): Promise<AdoptedModuleOperationResult<T>> {
    const module = await this.resolveAdoptedModule(protocolId);
    if (!module) return { executed: false };

    return { executed: true, value: await operation(module) };
  }

  private async recordDiscovery(module: TransportModule, observedAt: Date): Promise<void> {
    await this.modules.updateOne(
      { protocolId: module.protocolId },
      {
        $set: {
          family: module.family,
          capabilities: [...module.capabilities],
          transport: module.transport,
          availability: 'online',
          lastSeenAt: observedAt,
          lastObservedAt: observedAt,
          updatedAt: observedAt,
        },
        $setOnInsert: {
          protocolId: module.protocolId,
          status: 'descoberto',
          discoveredAt: observedAt,
          createdAt: observedAt,
        },
      },
      { upsert: true },
    );
  }

  private async recordAvailability(
    protocolId: string,
    availability: ModuleAvailability,
    observedAt: Date,
    receivedState: boolean,
  ): Promise<void> {
    await this.modules.updateOne(
      { protocolId },
      {
        $set: {
          availability,
          lastObservedAt: observedAt,
          ...(receivedState ? { lastSeenAt: observedAt } : {}),
          updatedAt: observedAt,
        },
      },
    );
  }

  private async listByStatus(
    status: ModuleInventoryStatus,
    filters: ModuleFilters,
  ): Promise<PublicModule[]> {
    const modules = await this.modules
      .find({
        status,
        ...(filters.protocolId ? { protocolId: filters.protocolId } : {}),
        ...(filters.family ? { family: filters.family } : {}),
        ...(filters.capability ? { capabilities: filters.capability } : {}),
        ...(filters.transport ? { transport: filters.transport } : {}),
        ...(filters.availability ? { availability: filters.availability } : {}),
      })
      .sort({ protocolId: 1 })
      .toArray();
    return modules.map((module) => this.toPublicModule(module));
  }

  private toPublicModule(module: WithId<ModuleDocument>): PublicModule {
    return {
      id: module._id.toHexString(),
      protocolId: module.protocolId,
      family: module.family,
      capabilities: [...module.capabilities],
      transport: module.transport,
      status: module.status,
      availability: module.availability,
      discoveredAt: module.discoveredAt.toISOString(),
      lastSeenAt: module.lastSeenAt.toISOString(),
      lastObservedAt: module.lastObservedAt.toISOString(),
      ...(module.adoptedAt ? { adoptedAt: module.adoptedAt.toISOString() } : {}),
    };
  }
}
