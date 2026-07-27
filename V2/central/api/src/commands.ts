import { randomUUID } from 'node:crypto';
import { ObjectId, type Collection, type WithId } from 'mongodb';
import { type AuditService } from './audit.js';
import { type AuthenticatedSession } from './authentication.js';
import { type Database } from './database.js';
import { type ModuleInventoryService, type PublicModule } from './modules.js';
import {
  type ModuleActionDeclaration,
  type ParameterDeclaration,
  type ParameterValue,
  type ModuleTransport,
  type TransportEvent,
  type TransportOperationResult,
} from './transport.js';

export type CommandStatus = 'aguardando' | 'enviado' | 'confirmado' | 'falhou' | 'indisponivel';
export type CommandFailure = 'module_not_found' | 'command_invalid';

interface CommandDocument {
  commandId: string;
  moduleId: ObjectId;
  protocolId: string;
  capabilityId: string;
  action: string;
  parameters: Record<string, ParameterValue>;
  correlationId: string;
  idempotencyKey: string;
  requesterUserId: ObjectId;
  status: CommandStatus;
  createdAt: Date;
  sentAt?: Date;
  completedAt?: Date;
  failureReason?: 'transport_failed' | 'module_unavailable';
}

export interface PublicCommand {
  commandId: string;
  protocolId: string;
  capabilityId: string;
  action: string;
  parameters: Record<string, ParameterValue>;
  status: CommandStatus;
  createdAt: string;
  sentAt?: string;
  completedAt?: string;
  failureReason?: 'transport_failed' | 'module_unavailable';
}

export type CommandRequestResult =
  { command: PublicCommand; created: boolean } | { failure: CommandFailure };

export class CommandService {
  private readonly commands: Collection<CommandDocument>;

  constructor(
    database: Database,
    private readonly modules: ModuleInventoryService,
    private readonly audit: AuditService,
    private readonly transport?: ModuleTransport,
  ) {
    this.commands = database.db.collection<CommandDocument>('commands');
  }

  async create(
    input: { protocolId: string; capabilityId: string; action: string; parameters: unknown },
    idempotencyKey: string,
    actor: AuthenticatedSession,
    originIp?: string,
  ): Promise<CommandRequestResult> {
    const existing = await this.findByRequesterAndKey(actor.userId, idempotencyKey);
    if (existing) return { command: this.toPublic(existing), created: false };

    const module = await this.modules.resolveAdoptedModule(input.protocolId);
    if (!module) return { failure: 'module_not_found' };
    const action = findAction(module, input.capabilityId, input.action);
    if (!action || !isValidParameters(input.parameters, action.parameters ?? [])) {
      return { failure: 'command_invalid' };
    }

    const now = new Date();
    const document: CommandDocument = {
      commandId: randomUUID(),
      moduleId: new ObjectId(module.id),
      protocolId: module.protocolId,
      capabilityId: input.capabilityId,
      action: input.action,
      parameters: { ...(input.parameters as Record<string, ParameterValue>) },
      correlationId: randomUUID(),
      idempotencyKey,
      requesterUserId: new ObjectId(actor.userId),
      status: 'aguardando',
      createdAt: now,
    };

    try {
      await this.commands.insertOne(document);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        const duplicate = await this.findByRequesterAndKey(actor.userId, idempotencyKey);
        if (duplicate) return { command: this.toPublic(duplicate), created: false };
      }
      throw error;
    }

    await this.audit.record({
      actorUserId: actor.userId,
      action: 'command.requested',
      result: 'success',
      targetType: 'module',
      targetId: module.id,
      originIp,
      sessionId: actor.sessionId,
      details: {
        commandId: document.commandId,
        protocolId: document.protocolId,
        capabilityId: document.capabilityId,
        action: document.action,
        correlationId: document.correlationId,
      },
    });

    await this.commands.updateOne(
      { commandId: document.commandId, status: 'aguardando' },
      { $set: { status: 'enviado', sentAt: new Date() } },
    );
    const result = this.transport
      ? await this.transport.sendCommand({
          protocolId: document.protocolId,
          action: document.action,
          parameters: document.parameters,
          correlationId: document.correlationId,
        })
      : ({ status: 'pending' } as const);
    await this.applyResult(document.protocolId, document.correlationId, result);
    const persisted = await this.commands.findOne({ commandId: document.commandId });
    return { command: this.toPublic(persisted ?? document), created: true };
  }

  async get(commandId: string): Promise<PublicCommand | undefined> {
    const command = await this.commands.findOne({ commandId });
    return command ? this.toPublic(command) : undefined;
  }

  async handleTransportEvent(event: TransportEvent): Promise<PublicCommand[]> {
    if (event.type === 'operation.confirmed' && event.operation === 'command') {
      const command = await this.complete(event.protocolId, event.correlationId, 'confirmado');
      return command ? [command] : [];
    }
    if (event.type === 'operation.failed' && event.operation === 'command') {
      const command = await this.complete(event.protocolId, event.correlationId, 'falhou');
      return command ? [command] : [];
    }
    if (event.type === 'module.unavailable') {
      return this.completeUnavailable(event.protocolId);
    }
    return [];
  }

  private async applyResult(
    protocolId: string,
    correlationId: string,
    result: TransportOperationResult,
  ): Promise<void> {
    if (result.status === 'confirmed') {
      await this.complete(protocolId, correlationId, 'confirmado');
    } else if (result.status === 'failed') {
      await this.complete(protocolId, correlationId, 'falhou');
    } else if (result.status === 'unavailable') {
      await this.complete(protocolId, correlationId, 'indisponivel');
    }
  }

  private async complete(
    protocolId: string,
    correlationId: string,
    status: Extract<CommandStatus, 'confirmado' | 'falhou' | 'indisponivel'>,
  ): Promise<PublicCommand | undefined> {
    const completedAt = new Date();
    const command = await this.commands.findOneAndUpdate(
      { protocolId, correlationId, status: 'enviado' },
      {
        $set: {
          status,
          completedAt,
          ...(status === 'falhou' ? { failureReason: 'transport_failed' } : {}),
          ...(status === 'indisponivel' ? { failureReason: 'module_unavailable' } : {}),
        },
      },
      { returnDocument: 'after' },
    );
    if (!command) return undefined;
    await this.recordCompletion(command);
    return this.toPublic(command);
  }

  private async completeUnavailable(protocolId: string): Promise<PublicCommand[]> {
    const active = await this.commands.find({ protocolId, status: 'enviado' }).toArray();
    const results = await Promise.all(
      active.map(async (command) =>
        this.complete(command.protocolId, command.correlationId, 'indisponivel'),
      ),
    );
    return results.filter((command): command is PublicCommand => command !== undefined);
  }

  private async recordCompletion(command: WithId<CommandDocument>): Promise<void> {
    const result = command.status === 'confirmado' ? 'success' : 'failure';
    await this.audit.record({
      actorUserId: command.requesterUserId.toHexString(),
      action: command.status === 'confirmado' ? 'command.confirmed' : 'command.failed',
      result,
      targetType: 'module',
      targetId: command.moduleId.toHexString(),
      details: {
        commandId: command.commandId,
        protocolId: command.protocolId,
        capabilityId: command.capabilityId,
        action: command.action,
        correlationId: command.correlationId,
        status: command.status,
        ...(command.failureReason ? { failureReason: command.failureReason } : {}),
      },
    });
  }

  private async findByRequesterAndKey(
    requesterUserId: string,
    idempotencyKey: string,
  ): Promise<WithId<CommandDocument> | undefined> {
    if (!ObjectId.isValid(requesterUserId)) return undefined;
    return (
      (await this.commands.findOne({
        requesterUserId: new ObjectId(requesterUserId),
        idempotencyKey,
      })) ?? undefined
    );
  }

  private toPublic(command: WithId<CommandDocument> | CommandDocument): PublicCommand {
    return {
      commandId: command.commandId,
      protocolId: command.protocolId,
      capabilityId: command.capabilityId,
      action: command.action,
      parameters: { ...command.parameters },
      status: command.status,
      createdAt: command.createdAt.toISOString(),
      ...(command.sentAt ? { sentAt: command.sentAt.toISOString() } : {}),
      ...(command.completedAt ? { completedAt: command.completedAt.toISOString() } : {}),
      ...(command.failureReason ? { failureReason: command.failureReason } : {}),
    };
  }
}

function findAction(
  module: PublicModule,
  capabilityId: string,
  actionName: string,
): ModuleActionDeclaration | undefined {
  return module.capabilities
    .find((capability) => capability.id === capabilityId)
    ?.actions?.find((action) => action.name === actionName);
}

function isValidParameters(
  parameters: unknown,
  declarations: readonly ParameterDeclaration[],
): parameters is Record<string, ParameterValue> {
  if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) return false;
  const values = parameters as Record<string, unknown>;
  if (
    Object.keys(values).some((key) => !declarations.some((declaration) => declaration.key === key))
  ) {
    return false;
  }
  return declarations.every((declaration) => {
    const value = values[declaration.key];
    if (value === undefined) return !declaration.required;
    if (typeof value !== declaration.type) return false;
    if (declaration.type === 'number') {
      if (typeof value !== 'number') return false;
      if (typeof declaration.minimum === 'number' && value < declaration.minimum) return false;
      if (typeof declaration.maximum === 'number' && value > declaration.maximum) return false;
    }
    return !declaration.enum || declaration.enum.includes(value as ParameterValue);
  });
}

function isDuplicateKeyError(error: unknown): error is { code: number } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}
