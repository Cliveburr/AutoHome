import { randomUUID } from 'node:crypto';
import { ObjectId, type Collection, type WithId } from 'mongodb';
import { type AuditService } from './audit.js';
import { type AuthenticatedSession } from './authentication.js';
import { type Database } from './database.js';
import {
  type ModuleCapability,
  type ModuleState,
  type ModuleTransport,
  type ParameterDeclaration,
  type ParameterValue,
  type TransportEvent,
  type TransportModule,
  type TransportOperationResult,
} from './transport.js';

export type ModuleInventoryStatus = 'descoberto' | 'cadastrado';
export type ModuleAvailability = 'online' | 'offline';
export type SynchronizationStatus = 'pendente' | 'confirmada' | 'falhou';

interface ModuleDocument {
  protocolId: string;
  family: string;
  capabilities: ModuleCapability[];
  transport: TransportModule['transport'];
  status: ModuleInventoryStatus;
  availability: ModuleAvailability;
  name?: string;
  roomId?: ObjectId;
  localLinks?: LocalLinkDocument[];
  discoveredAt: Date;
  lastSeenAt: Date;
  lastObservedAt: Date;
  adoptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ModuleStateDocument {
  moduleId: ObjectId;
  values: Record<string, unknown>;
  firmwareHash?: string;
  observedAt: Date;
  updatedAt: Date;
}

interface ModuleConfigurationDocument {
  moduleId: ObjectId;
  capabilityId: string;
  parameterKey: string;
  desired: ParameterValue;
  sent?: { value: ParameterValue; correlationId: string; sentAt: Date };
  confirmed?: { value: ParameterValue; confirmedAt: Date };
  syncStatus: SynchronizationStatus;
  failureReason?: 'module_unavailable' | 'transport_failed';
  updatedAt: Date;
}

interface LocalLinkDocument {
  id: string;
  source: { capabilityId: string; event: string };
  target: {
    protocolId: string;
    capabilityId: string;
    action: string;
    parameters: Record<string, ParameterValue>;
  };
  participantProtocolIds: string[];
  confirmedParticipantProtocolIds: string[];
  correlationId: string;
  syncStatus: SynchronizationStatus;
  failureReason?: 'module_unavailable' | 'transport_failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicModule {
  id: string;
  protocolId: string;
  family: string;
  capabilities: ModuleCapability[];
  transport: TransportModule['transport'];
  status: ModuleInventoryStatus;
  availability: ModuleAvailability;
  name?: string;
  roomId?: string;
  discoveredAt: string;
  lastSeenAt: string;
  lastObservedAt: string;
  adoptedAt?: string;
}

export interface PublicModuleDetail extends PublicModule {
  state?: { values: Record<string, unknown>; firmwareHash?: string; observedAt: string };
  configurations: PublicModuleConfiguration[];
  localLinks: PublicLocalLink[];
}

export interface PublicModuleConfiguration {
  capabilityId: string;
  parameterKey: string;
  desired: ParameterValue;
  sent?: { value: ParameterValue; correlationId: string; sentAt: string };
  confirmed?: { value: ParameterValue; confirmedAt: string };
  syncStatus: SynchronizationStatus;
  failureReason?: 'module_unavailable' | 'transport_failed';
}

export interface PublicLocalLink {
  id: string;
  source: { capabilityId: string; event: string };
  target: {
    protocolId: string;
    capabilityId: string;
    action: string;
    parameters: Record<string, ParameterValue>;
  };
  syncStatus: SynchronizationStatus;
  failureReason?: 'module_unavailable' | 'transport_failed';
}

export interface ModuleFilters {
  protocolId?: string;
  family?: string;
  capability?: string;
  transport?: TransportModule['transport'];
  availability?: ModuleAvailability;
}

export type ModuleAdoptionFailure = 'module_not_found' | 'module_already_adopted';
export type ModuleMutationFailure =
  'module_not_found' | 'room_not_found' | 'configuration_invalid' | 'link_incompatible';
export type ModuleAdoptionResult = { module: PublicModule } | { failure: ModuleAdoptionFailure };
export type ModuleMutationResult<T> = { value: T } | { failure: ModuleMutationFailure };
export type AdoptedModuleOperationResult<T> = { executed: true; value: T } | { executed: false };

export class ModuleInventoryService {
  private readonly modules: Collection<ModuleDocument>;
  private readonly states: Collection<ModuleStateDocument>;
  private readonly configurations: Collection<ModuleConfigurationDocument>;
  private readonly rooms: Collection<{ _id: ObjectId }>;

  constructor(
    database: Database,
    private readonly audit: AuditService,
    private readonly transport?: ModuleTransport,
  ) {
    this.modules = database.db.collection<ModuleDocument>('modules');
    this.states = database.db.collection<ModuleStateDocument>('module_states');
    this.configurations =
      database.db.collection<ModuleConfigurationDocument>('module_configurations');
    this.rooms = database.db.collection<{ _id: ObjectId }>('rooms');
  }

  async handleTransportEvent(event: TransportEvent): Promise<void> {
    switch (event.type) {
      case 'module.discovered':
        await this.recordDiscovery(event.module, event.occurredAt);
        return;
      case 'module.state':
        await this.recordState(event.protocolId, event.state, event.occurredAt);
        return;
      case 'module.unavailable':
        await this.recordAvailability(event.protocolId, 'offline', event.occurredAt, false);
        if (event.operation === 'configuration')
          await this.failConfiguration(event.protocolId, undefined, 'module_unavailable');
        if (event.operation === 'local_link')
          await this.failLinks(event.protocolId, undefined, 'module_unavailable');
        return;
      case 'operation.confirmed':
        if (event.operation === 'configuration')
          await this.confirmConfiguration(event.protocolId, event.correlationId);
        if (event.operation === 'local_link')
          await this.confirmLinkParticipant(event.protocolId, event.correlationId);
        return;
      case 'operation.failed':
        if (event.operation === 'configuration')
          await this.failConfiguration(event.protocolId, event.correlationId, 'transport_failed');
        if (event.operation === 'local_link')
          await this.failLinks(event.protocolId, event.correlationId, 'transport_failed');
        return;
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
    await this.recordAudit('module.adopted', adopted, actor, originIp, {
      protocolId: adopted.protocolId,
      family: adopted.family,
      capabilityIds: adopted.capabilities.map((capability) => capability.id),
      transport: adopted.transport,
    });
    return { module: this.toPublicModule(adopted) };
  }

  async getDetail(protocolId: string): Promise<PublicModuleDetail | undefined> {
    const module = await this.findAdopted(protocolId);
    if (!module) return undefined;
    const [state, configurations] = await Promise.all([
      this.states.findOne({ moduleId: module._id }),
      this.configurations
        .find({ moduleId: module._id })
        .sort({ capabilityId: 1, parameterKey: 1 })
        .toArray(),
    ]);
    return {
      ...this.toPublicModule(module),
      ...(state ? { state: this.toPublicState(state) } : {}),
      configurations: configurations.map((configuration) =>
        this.toPublicConfiguration(configuration),
      ),
      localLinks: (module.localLinks ?? []).map((link) => this.toPublicLink(link)),
    };
  }

  async updateOrganization(
    protocolId: string,
    update: { name?: string; roomId?: string | null },
    actor: AuthenticatedSession,
    originIp?: string,
  ): Promise<ModuleMutationResult<PublicModule>> {
    const module = await this.findAdopted(protocolId);
    if (!module) return { failure: 'module_not_found' };
    let roomId: ObjectId | undefined;
    if (update.roomId !== undefined && update.roomId !== null) {
      if (!ObjectId.isValid(update.roomId)) return { failure: 'room_not_found' };
      roomId = new ObjectId(update.roomId);
      if (!(await this.rooms.findOne({ _id: roomId }))) return { failure: 'room_not_found' };
    }
    const now = new Date();
    await this.modules.updateOne(
      { _id: module._id },
      {
        $set: {
          ...(update.name !== undefined ? { name: update.name } : {}),
          ...(roomId ? { roomId } : {}),
          updatedAt: now,
        },
        ...(update.roomId === null ? { $unset: { roomId: '' } } : {}),
      },
    );
    const updated = {
      ...module,
      ...(update.name !== undefined ? { name: update.name } : {}),
      ...(roomId ? { roomId } : {}),
      updatedAt: now,
    };
    if (update.roomId === null) delete updated.roomId;
    await this.recordAudit('module.organization_updated', updated, actor, originIp, {
      protocolId,
      ...(update.name !== undefined ? { nameChanged: true } : {}),
      ...(update.roomId !== undefined ? { roomChanged: true } : {}),
    });
    return { value: this.toPublicModule(updated) };
  }

  async setConfiguration(
    protocolId: string,
    input: { capabilityId: string; parameterKey: string; value: unknown },
    actor: AuthenticatedSession,
    originIp?: string,
  ): Promise<ModuleMutationResult<PublicModuleConfiguration>> {
    const module = await this.findAdopted(protocolId);
    if (!module) return { failure: 'module_not_found' };
    const declaration = findConfiguration(module, input.capabilityId, input.parameterKey);
    if (!declaration || !isValidValue(input.value, declaration))
      return { failure: 'configuration_invalid' };
    const value = input.value;
    const correlationId = randomUUID();
    const sentAt = new Date();
    await this.configurations.updateOne(
      { moduleId: module._id, capabilityId: input.capabilityId, parameterKey: input.parameterKey },
      {
        $set: {
          desired: value,
          sent: { value, correlationId, sentAt },
          syncStatus: 'pendente',
          updatedAt: sentAt,
        },
        $unset: { failureReason: '' },
      },
      { upsert: true },
    );
    const result = this.transport
      ? await this.transport.distributeConfiguration({
          protocolId,
          configuration: {
            capabilityId: input.capabilityId,
            parameterKey: input.parameterKey,
            value,
          },
          correlationId,
        })
      : { status: 'pending' as const };
    await this.applyConfigurationResult(protocolId, correlationId, result);
    const configuration = await this.configurations.findOne({
      moduleId: module._id,
      capabilityId: input.capabilityId,
      parameterKey: input.parameterKey,
    });
    await this.recordAudit('module.configuration_requested', module, actor, originIp, {
      protocolId,
      capabilityId: input.capabilityId,
      parameterKey: input.parameterKey,
      correlationId,
      syncStatus: result.status,
    });
    return { value: this.toPublicConfiguration(configuration!) };
  }

  async createLocalLink(
    protocolId: string,
    input: {
      source: { capabilityId: string; event: string };
      target: { protocolId: string; capabilityId: string; action: string; parameters: unknown };
    },
    actor: AuthenticatedSession,
    originIp?: string,
  ): Promise<ModuleMutationResult<PublicLocalLink>> {
    const sourceModule = await this.findAdopted(protocolId);
    const targetModule = await this.findAdopted(input.target.protocolId);
    if (!sourceModule || !targetModule) return { failure: 'module_not_found' };
    const sourceCapability = sourceModule.capabilities.find(
      (capability) => capability.id === input.source.capabilityId,
    );
    const action = targetModule.capabilities
      .find((capability) => capability.id === input.target.capabilityId)
      ?.actions?.find((candidate) => candidate.name === input.target.action);
    if (
      !sourceCapability?.events?.includes(input.source.event) ||
      !action ||
      !isValidParameters(input.target.parameters, action.parameters ?? [])
    ) {
      return { failure: 'link_incompatible' };
    }
    const now = new Date();
    const correlationId = randomUUID();
    const participants = [...new Set([sourceModule.protocolId, targetModule.protocolId])];
    const link: LocalLinkDocument = {
      id: randomUUID(),
      source: { ...input.source },
      target: {
        ...input.target,
        parameters: input.target.parameters as Record<string, ParameterValue>,
      },
      participantProtocolIds: participants,
      confirmedParticipantProtocolIds: [],
      correlationId,
      syncStatus: 'pendente',
      createdAt: now,
      updatedAt: now,
    };
    await this.modules.updateOne(
      { _id: sourceModule._id },
      { $push: { localLinks: link }, $set: { updatedAt: now } },
    );
    for (const participantProtocolId of participants) {
      const result = this.transport
        ? await this.transport.distributeLocalLink({
            protocolId: participantProtocolId,
            link: { id: link.id, source: link.source, target: link.target },
            correlationId,
          })
        : { status: 'pending' as const };
      await this.applyLinkResult(participantProtocolId, correlationId, result);
      if (result.status === 'failed' || result.status === 'unavailable') break;
    }
    const persisted = await this.findAdopted(protocolId);
    const publicLink = persisted?.localLinks?.find((candidate) => candidate.id === link.id);
    await this.recordAudit('module.local_link_requested', sourceModule, actor, originIp, {
      protocolId,
      linkId: link.id,
      sourceCapabilityId: input.source.capabilityId,
      targetProtocolId: input.target.protocolId,
      targetCapabilityId: input.target.capabilityId,
      targetAction: input.target.action,
      correlationId,
    });
    return { value: this.toPublicLink(publicLink!) };
  }

  async resolveAdoptedModule(protocolId: string): Promise<PublicModule | undefined> {
    const module = await this.findAdopted(protocolId);
    return module ? this.toPublicModule(module) : undefined;
  }

  async executeForAdoptedModule<T>(
    protocolId: string,
    operation: (module: PublicModule) => Promise<T>,
  ): Promise<AdoptedModuleOperationResult<T>> {
    const module = await this.resolveAdoptedModule(protocolId);
    return module ? { executed: true, value: await operation(module) } : { executed: false };
  }

  private async recordDiscovery(module: TransportModule, observedAt: Date): Promise<void> {
    await this.modules.updateOne(
      { protocolId: module.protocolId },
      {
        $set: {
          family: module.family,
          capabilities: module.capabilities.map(cloneCapability),
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

  private async recordState(
    protocolId: string,
    state: ModuleState,
    observedAt: Date,
  ): Promise<void> {
    await this.recordAvailability(protocolId, 'online', observedAt, true);
    const module = await this.findAdopted(protocolId);
    if (!module) return;
    await this.states.updateOne(
      { moduleId: module._id },
      {
        $set: {
          values: { ...state.values },
          ...(state.firmwareHash === undefined ? {} : { firmwareHash: state.firmwareHash }),
          observedAt: state.observedAt,
          updatedAt: observedAt,
        },
        ...(state.firmwareHash === undefined ? { $unset: { firmwareHash: '' } } : {}),
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

  private async applyConfigurationResult(
    protocolId: string,
    correlationId: string,
    result: TransportOperationResult,
  ): Promise<void> {
    if (result.status === 'confirmed') return this.confirmConfiguration(protocolId, correlationId);
    if (result.status === 'unavailable')
      return this.failConfiguration(protocolId, correlationId, 'module_unavailable');
    if (result.status === 'failed')
      return this.failConfiguration(protocolId, correlationId, 'transport_failed');
  }

  private async confirmConfiguration(protocolId: string, correlationId: string): Promise<void> {
    const module = await this.findAdopted(protocolId);
    if (!module) return;
    const configurations = await this.configurations
      .find({ moduleId: module._id, 'sent.correlationId': correlationId })
      .toArray();
    await Promise.all(
      configurations.map((configuration) =>
        this.configurations.updateOne(
          { _id: configuration._id, 'sent.correlationId': correlationId },
          {
            $set: {
              confirmed: { value: configuration.sent!.value, confirmedAt: new Date() },
              syncStatus: 'confirmada',
              updatedAt: new Date(),
            },
            $unset: { failureReason: '' },
          },
        ),
      ),
    );
  }

  private async failConfiguration(
    protocolId: string,
    correlationId: string | undefined,
    reason: 'module_unavailable' | 'transport_failed',
  ): Promise<void> {
    const module = await this.findAdopted(protocolId);
    if (!module) return;
    await this.configurations.updateMany(
      { moduleId: module._id, ...(correlationId ? { 'sent.correlationId': correlationId } : {}) },
      { $set: { syncStatus: 'falhou', failureReason: reason, updatedAt: new Date() } },
    );
  }

  private async applyLinkResult(
    protocolId: string,
    correlationId: string,
    result: TransportOperationResult,
  ): Promise<void> {
    if (result.status === 'confirmed')
      return this.confirmLinkParticipant(protocolId, correlationId);
    if (result.status === 'unavailable')
      return this.failLinks(protocolId, correlationId, 'module_unavailable');
    if (result.status === 'failed')
      return this.failLinks(protocolId, correlationId, 'transport_failed');
  }

  private async confirmLinkParticipant(protocolId: string, correlationId: string): Promise<void> {
    const source = await this.modules.findOne({ 'localLinks.correlationId': correlationId });
    if (!source) return;
    const links = (source.localLinks ?? []).map((link) => {
      if (link.correlationId !== correlationId || link.syncStatus !== 'pendente') return link;
      const confirmedParticipantProtocolIds = [
        ...new Set([...link.confirmedParticipantProtocolIds, protocolId]),
      ];
      return {
        ...link,
        confirmedParticipantProtocolIds,
        syncStatus:
          confirmedParticipantProtocolIds.length === link.participantProtocolIds.length
            ? ('confirmada' as const)
            : ('pendente' as const),
        updatedAt: new Date(),
      };
    });
    await this.modules.updateOne(
      { _id: source._id },
      { $set: { localLinks: links, updatedAt: new Date() } },
    );
  }

  private async failLinks(
    protocolId: string,
    correlationId: string | undefined,
    reason: 'module_unavailable' | 'transport_failed',
  ): Promise<void> {
    const source = await this.modules.findOne({
      'localLinks.participantProtocolIds': protocolId,
      ...(correlationId ? { 'localLinks.correlationId': correlationId } : {}),
    });
    if (!source) return;
    const links = (source.localLinks ?? []).map((link) =>
      link.participantProtocolIds.includes(protocolId) &&
      (!correlationId || link.correlationId === correlationId)
        ? { ...link, syncStatus: 'falhou' as const, failureReason: reason, updatedAt: new Date() }
        : link,
    );
    await this.modules.updateOne(
      { _id: source._id },
      { $set: { localLinks: links, updatedAt: new Date() } },
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
        ...(filters.capability ? { 'capabilities.id': filters.capability } : {}),
        ...(filters.transport ? { transport: filters.transport } : {}),
        ...(filters.availability ? { availability: filters.availability } : {}),
      })
      .sort({ protocolId: 1 })
      .toArray();
    return modules.map((module) => this.toPublicModule(module));
  }

  private async findAdopted(protocolId: string): Promise<WithId<ModuleDocument> | undefined> {
    return (await this.modules.findOne({ protocolId, status: 'cadastrado' })) ?? undefined;
  }

  private toPublicModule(module: WithId<ModuleDocument>): PublicModule {
    return {
      id: module._id.toHexString(),
      protocolId: module.protocolId,
      family: module.family,
      capabilities: module.capabilities.map(cloneCapability),
      transport: module.transport,
      status: module.status,
      availability: module.availability,
      ...(module.name ? { name: module.name } : {}),
      ...(module.roomId ? { roomId: module.roomId.toHexString() } : {}),
      discoveredAt: module.discoveredAt.toISOString(),
      lastSeenAt: module.lastSeenAt.toISOString(),
      lastObservedAt: module.lastObservedAt.toISOString(),
      ...(module.adoptedAt ? { adoptedAt: module.adoptedAt.toISOString() } : {}),
    };
  }

  private toPublicState(state: WithId<ModuleStateDocument>): {
    values: Record<string, unknown>;
    firmwareHash?: string;
    observedAt: string;
  } {
    return {
      values: { ...state.values },
      ...(state.firmwareHash ? { firmwareHash: state.firmwareHash } : {}),
      observedAt: state.observedAt.toISOString(),
    };
  }

  private toPublicConfiguration(
    configuration: WithId<ModuleConfigurationDocument>,
  ): PublicModuleConfiguration {
    return {
      capabilityId: configuration.capabilityId,
      parameterKey: configuration.parameterKey,
      desired: configuration.desired,
      ...(configuration.sent
        ? {
            sent: {
              value: configuration.sent.value,
              correlationId: configuration.sent.correlationId,
              sentAt: configuration.sent.sentAt.toISOString(),
            },
          }
        : {}),
      ...(configuration.confirmed
        ? {
            confirmed: {
              value: configuration.confirmed.value,
              confirmedAt: configuration.confirmed.confirmedAt.toISOString(),
            },
          }
        : {}),
      syncStatus: configuration.syncStatus,
      ...(configuration.failureReason ? { failureReason: configuration.failureReason } : {}),
    };
  }

  private toPublicLink(link: LocalLinkDocument): PublicLocalLink {
    return {
      id: link.id,
      source: { ...link.source },
      target: { ...link.target, parameters: { ...link.target.parameters } },
      syncStatus: link.syncStatus,
      ...(link.failureReason ? { failureReason: link.failureReason } : {}),
    };
  }

  private async recordAudit(
    action: string,
    module: WithId<ModuleDocument>,
    actor: AuthenticatedSession,
    originIp: string | undefined,
    details: Record<string, unknown>,
  ): Promise<void> {
    await this.audit.record({
      actorUserId: actor.userId,
      action,
      result: 'success',
      targetType: 'module',
      targetId: module._id.toHexString(),
      originIp,
      sessionId: actor.sessionId,
      details,
    });
  }
}

function cloneCapability(capability: ModuleCapability): ModuleCapability {
  return JSON.parse(JSON.stringify(capability)) as ModuleCapability;
}

function findConfiguration(
  module: ModuleDocument,
  capabilityId: string,
  parameterKey: string,
): ParameterDeclaration | undefined {
  return module.capabilities
    .find((capability) => capability.id === capabilityId)
    ?.configuration?.find((parameter) => parameter.key === parameterKey);
}

function isValidValue(value: unknown, declaration: ParameterDeclaration): value is ParameterValue {
  if (typeof value !== declaration.type) return false;
  if (
    typeof value === 'number' &&
    (!Number.isFinite(value) ||
      (declaration.minimum !== undefined && value < declaration.minimum) ||
      (declaration.maximum !== undefined && value > declaration.maximum))
  )
    return false;
  return declaration.enum === undefined || declaration.enum.includes(value as ParameterValue);
}

function isValidParameters(
  value: unknown,
  declarations: readonly ParameterDeclaration[],
): value is Record<string, ParameterValue> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const parameters = value as Record<string, unknown>;
  if (
    Object.keys(parameters).some(
      (key) => !declarations.some((declaration) => declaration.key === key),
    )
  )
    return false;
  return declarations.every((declaration) =>
    declaration.required === false
      ? parameters[declaration.key] === undefined ||
        isValidValue(parameters[declaration.key], declaration)
      : isValidValue(parameters[declaration.key], declaration),
  );
}
