import { randomUUID } from 'node:crypto';
import { type Collection } from 'mongodb';
import { type AuditService } from './audit.js';
import { type AuthenticatedSession } from './authentication.js';
import { type Database } from './database.js';
import { type FirmwareRepository } from './firmware.js';
import { type ModuleInventoryService, type PublicModule } from './modules.js';
import { type ModuleTransport, type TransportEvent } from './transport.js';

export type OtaItemStatus =
  | 'aguardando'
  | 'enviando'
  | 'validando'
  | 'reiniciando'
  | 'confirmado'
  | 'falhou'
  | 'indisponivel';
export type OtaJobStatus = 'aguardando' | 'em_andamento' | 'confirmado' | 'concluido_com_falhas';
type OtaScope = 'module' | 'family' | 'all';

interface OtaJobDocument {
  jobId: string;
  scope: OtaScope;
  family?: string;
  sourceJobId?: string;
  requestedByUserId: string;
  status: OtaJobStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface OtaJobItemDocument {
  itemId: string;
  otaJobId: string;
  moduleId: string;
  protocolId: string;
  family: string;
  expectedFirmwareSha256: string;
  correlationId: string;
  status: OtaItemStatus;
  reason?: string;
  queuedAt: Date;
  sendingAt?: Date;
  validatingAt?: Date;
  restartingAt?: Date;
  completedAt?: Date;
  updatedAt: Date;
}

export interface PublicOtaItem {
  id: string;
  moduleId: string;
  protocolId: string;
  family: string;
  expectedFirmwareSha256: string;
  status: OtaItemStatus;
  reason?: string;
  queuedAt: string;
  sendingAt?: string;
  validatingAt?: string;
  restartingAt?: string;
  completedAt?: string;
}

export interface PublicOtaJob {
  id: string;
  scope: OtaScope;
  family?: string;
  sourceJobId?: string;
  status: OtaJobStatus;
  createdAt: string;
  updatedAt: string;
  summary: Record<OtaItemStatus, number>;
  items: PublicOtaItem[];
}

export type OtaJobFailure = 'module_not_found' | 'family_not_found' | 'job_not_found';
export type OtaJobResult = { job: PublicOtaJob } | { failure: OtaJobFailure };

const terminalStatuses = new Set<OtaItemStatus>(['confirmado', 'falhou', 'indisponivel']);

/** Persisted OTA queue. It deliberately has no recovery loop after a process restart. */
export class OtaService {
  private readonly jobs: Collection<OtaJobDocument>;
  private readonly items: Collection<OtaJobItemDocument>;
  private readonly active = new Set<string>();
  private draining = false;

  constructor(
    database: Database,
    private readonly firmware: FirmwareRepository,
    private readonly modules: ModuleInventoryService,
    private readonly transport: ModuleTransport | undefined,
    private readonly audit: AuditService,
    private readonly maxConcurrency: number,
  ) {
    this.jobs = database.db.collection<OtaJobDocument>('ota_jobs');
    this.items = database.db.collection<OtaJobItemDocument>('ota_job_items');
  }

  async create(
    input: { scope: OtaScope; protocolId?: string; family?: string },
    actor: AuthenticatedSession,
    originIp?: string,
  ): Promise<OtaJobResult> {
    const selected = await this.select(input);
    if ('failure' in selected) return selected;
    return this.persistJob(input.scope, input.family, selected.items, actor, originIp);
  }

  async retry(
    jobId: string,
    actor: AuthenticatedSession,
    originIp?: string,
  ): Promise<OtaJobResult> {
    const job = await this.jobs.findOne({ jobId });
    if (!job) return { failure: 'job_not_found' };
    const previous = await this.items
      .find({ otaJobId: jobId, status: { $ne: 'confirmado' } })
      .toArray();
    const modules = await Promise.all(
      previous.map((item) => this.modules.resolveAdoptedModule(item.protocolId)),
    );
    const eligible = previous.flatMap((item, index) => {
      const module = modules[index];
      return module ? [{ module, expectedFirmwareSha256: item.expectedFirmwareSha256 }] : [];
    });
    return this.persistJob(job.scope, job.family, eligible, actor, originIp, jobId);
  }

  async get(jobId: string): Promise<PublicOtaJob | undefined> {
    const job = await this.jobs.findOne({ jobId });
    if (!job) return undefined;
    const items = await this.items
      .find({ otaJobId: jobId })
      .sort({ queuedAt: 1, itemId: 1 })
      .toArray();
    const summary = emptySummary();
    for (const item of items) summary[item.status] += 1;
    return {
      ...this.toPublicJob(job),
      summary,
      items: items.map((item) => this.toPublicItem(item)),
    };
  }

  async handleTransportEvent(event: TransportEvent): Promise<void> {
    if (event.type === 'operation.confirmed' && event.operation === 'ota') {
      const item = await this.items.findOne({
        correlationId: event.correlationId,
        status: 'enviando',
      });
      if (item) await this.confirmAfterTransfer(item);
      return;
    }
    if (event.type === 'operation.failed' && event.operation === 'ota') {
      const item = await this.items.findOne({
        correlationId: event.correlationId,
        status: 'enviando',
      });
      if (item) await this.finish(item, 'falhou', 'transport_failed');
      return;
    }
    if (event.type === 'ota.transfer_failed') {
      const item = await this.items.findOne({ protocolId: event.protocolId, status: 'enviando' });
      if (item) await this.finish(item, 'falhou', 'transfer_failed');
      return;
    }
    if (event.type === 'module.unavailable' && event.operation === 'ota') {
      const item = await this.items.findOne({ protocolId: event.protocolId, status: 'enviando' });
      if (item) await this.finish(item, 'indisponivel', 'module_unavailable');
    }
  }

  private async select(input: {
    scope: OtaScope;
    protocolId?: string;
    family?: string;
  }): Promise<
    | { items: Array<{ module: PublicModule; expectedFirmwareSha256: string }> }
    | { failure: OtaJobFailure }
  > {
    if (input.scope === 'module' && !input.protocolId) return { failure: 'module_not_found' };
    if (input.scope === 'family' && !input.family) return { failure: 'family_not_found' };
    const selectedModules =
      input.scope === 'module'
        ? await this.modules.resolveAdoptedModule(input.protocolId!)
        : await this.modules.listRegistered(
            input.scope === 'family' ? { family: input.family } : {},
          );
    if (
      !selectedModules ||
      (Array.isArray(selectedModules) && input.scope === 'family' && selectedModules.length === 0)
    )
      return { failure: input.scope === 'module' ? 'module_not_found' : 'family_not_found' };
    const moduleList = Array.isArray(selectedModules) ? selectedModules : [selectedModules];
    const byFamily = new Map<string, string>();
    for (const family of new Set(moduleList.map((module) => module.family))) {
      const artifacts = await this.firmware.listArtifacts(family);
      if (artifacts.length) byFamily.set(family, artifacts.at(-1)!.hash);
    }
    const items: Array<{ module: PublicModule; expectedFirmwareSha256: string }> = [];
    for (const module of moduleList) {
      const expectedFirmwareSha256 = byFamily.get(module.family);
      if (!expectedFirmwareSha256 || !this.transport) continue;
      try {
        const current = await this.transport.requestFirmwareHash(module.protocolId);
        if (current && current !== expectedFirmwareSha256)
          items.push({ module, expectedFirmwareSha256 });
      } catch {
        // An unreachable module is not eligible for a newly requested job.
      }
    }
    return { items };
  }

  private async persistJob(
    scope: OtaScope,
    family: string | undefined,
    selected: Array<{ module: PublicModule; expectedFirmwareSha256: string }>,
    actor: AuthenticatedSession,
    originIp: string | undefined,
    sourceJobId?: string,
  ): Promise<OtaJobResult> {
    const now = new Date();
    const job: OtaJobDocument = {
      jobId: randomUUID(),
      scope,
      ...(family ? { family } : {}),
      ...(sourceJobId ? { sourceJobId } : {}),
      requestedByUserId: actor.userId,
      status: 'aguardando',
      createdAt: now,
      updatedAt: now,
    };
    const items = selected.map(({ module, expectedFirmwareSha256 }): OtaJobItemDocument => ({
      itemId: randomUUID(),
      otaJobId: job.jobId,
      moduleId: module.id,
      protocolId: module.protocolId,
      family: module.family,
      expectedFirmwareSha256,
      correlationId: randomUUID(),
      status: 'aguardando',
      queuedAt: now,
      updatedAt: now,
    }));
    await this.jobs.insertOne(job);
    if (items.length) await this.items.insertMany(items);
    await this.audit.record({
      actorUserId: actor.userId,
      sessionId: actor.sessionId,
      originIp,
      action: sourceJobId ? 'ota.job_retried' : 'ota.job_requested',
      result: 'success',
      targetType: 'ota_job',
      targetId: job.jobId,
      details: {
        scope,
        family,
        sourceJobId,
        itemCount: items.length,
        items: items.map((item) => ({
          moduleId: item.moduleId,
          protocolId: item.protocolId,
          family: item.family,
          firmwareSha256: item.expectedFirmwareSha256,
        })),
      },
    });
    void this.drain();
    return { job: (await this.get(job.jobId))! };
  }

  private async drain(): Promise<void> {
    if (this.draining) return;
    this.draining = true;
    try {
      while (this.active.size < this.maxConcurrency) {
        const item = await this.items.findOneAndUpdate(
          { status: 'aguardando' },
          { $set: { status: 'enviando', sendingAt: new Date(), updatedAt: new Date() } },
          { sort: { queuedAt: 1 }, returnDocument: 'after' },
        );
        if (!item) break;
        this.active.add(item.itemId);
        await this.refreshJob(item.otaJobId);
        void this.transfer(item);
      }
    } finally {
      this.draining = false;
    }
  }

  private async transfer(item: OtaJobItemDocument): Promise<void> {
    try {
      if (!this.transport) {
        await this.finish(item, 'indisponivel', 'transport_unavailable');
        return;
      }
      const firmware = await this.firmware.readArtifact(item.family, item.expectedFirmwareSha256);
      const result = await this.transport.transferFirmware({
        protocolId: item.protocolId,
        expectedHash: item.expectedFirmwareSha256,
        firmware,
        correlationId: item.correlationId,
      });
      if (result.status === 'confirmed') await this.confirmAfterTransfer(item);
      if (result.status === 'failed') await this.finish(item, 'falhou', 'transport_failed');
      if (result.status === 'unavailable')
        await this.finish(item, 'indisponivel', 'module_unavailable');
    } catch {
      await this.finish(item, 'falhou', 'artifact_unavailable');
    }
  }

  private async confirmAfterTransfer(item: OtaJobItemDocument): Promise<void> {
    const current = await this.items.findOne({ itemId: item.itemId });
    if (!current || terminalStatuses.has(current.status)) return;
    const validatingAt = new Date();
    await this.items.updateOne(
      { itemId: item.itemId, status: { $in: ['enviando', 'validando', 'reiniciando'] } },
      { $set: { status: 'validando', validatingAt, updatedAt: validatingAt } },
    );
    const restartingAt = new Date();
    await this.items.updateOne(
      { itemId: item.itemId, status: 'validando' },
      { $set: { status: 'reiniciando', restartingAt, updatedAt: restartingAt } },
    );
    try {
      const transport = this.transport;
      if (!transport) {
        await this.finish(item, 'indisponivel', 'transport_unavailable');
        return;
      }
      const reported = await transport.requestFirmwareHash(item.protocolId);
      await this.finish(
        item,
        reported === item.expectedFirmwareSha256 ? 'confirmado' : 'falhou',
        reported === item.expectedFirmwareSha256 ? undefined : 'firmware_hash_mismatch',
      );
    } catch {
      await this.finish(item, 'indisponivel', 'module_unavailable');
    }
  }

  private async finish(
    item: OtaJobItemDocument,
    status: Extract<OtaItemStatus, 'confirmado' | 'falhou' | 'indisponivel'>,
    reason?: string,
  ): Promise<void> {
    const completedAt = new Date();
    const updated = await this.items.findOneAndUpdate(
      { itemId: item.itemId, status: { $nin: [...terminalStatuses] } },
      { $set: { status, ...(reason ? { reason } : {}), completedAt, updatedAt: completedAt } },
      { returnDocument: 'after' },
    );
    if (!updated) return;
    this.active.delete(item.itemId);
    const job = await this.jobs.findOne({ jobId: item.otaJobId });
    await this.audit.record({
      ...(job ? { actorUserId: job.requestedByUserId } : {}),
      action: 'ota.item_completed',
      result: status === 'confirmado' ? 'success' : 'failure',
      targetType: 'module',
      targetId: item.moduleId,
      details: {
        jobId: item.otaJobId,
        protocolId: item.protocolId,
        family: item.family,
        firmwareSha256: item.expectedFirmwareSha256,
        status,
        reason,
      },
    });
    await this.refreshJob(item.otaJobId);
    void this.drain();
  }

  private async refreshJob(jobId: string): Promise<void> {
    const items = await this.items.find({ otaJobId: jobId }).toArray();
    const statuses = items.map((item) => item.status);
    const status: OtaJobStatus =
      statuses.length === 0 || statuses.every((value) => value === 'aguardando')
        ? 'aguardando'
        : statuses.some((value) => !terminalStatuses.has(value))
          ? 'em_andamento'
          : statuses.every((value) => value === 'confirmado')
            ? 'confirmado'
            : 'concluido_com_falhas';
    await this.jobs.updateOne({ jobId }, { $set: { status, updatedAt: new Date() } });
  }

  private toPublicJob(job: OtaJobDocument): Omit<PublicOtaJob, 'summary' | 'items'> {
    return {
      id: job.jobId,
      scope: job.scope,
      ...(job.family ? { family: job.family } : {}),
      ...(job.sourceJobId ? { sourceJobId: job.sourceJobId } : {}),
      status: job.status,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }

  private toPublicItem(item: OtaJobItemDocument): PublicOtaItem {
    return {
      id: item.itemId,
      moduleId: item.moduleId,
      protocolId: item.protocolId,
      family: item.family,
      expectedFirmwareSha256: item.expectedFirmwareSha256,
      status: item.status,
      ...(item.reason ? { reason: item.reason } : {}),
      queuedAt: item.queuedAt.toISOString(),
      ...(item.sendingAt ? { sendingAt: item.sendingAt.toISOString() } : {}),
      ...(item.validatingAt ? { validatingAt: item.validatingAt.toISOString() } : {}),
      ...(item.restartingAt ? { restartingAt: item.restartingAt.toISOString() } : {}),
      ...(item.completedAt ? { completedAt: item.completedAt.toISOString() } : {}),
    };
  }
}

function emptySummary(): Record<OtaItemStatus, number> {
  return {
    aguardando: 0,
    enviando: 0,
    validando: 0,
    reiniciando: 0,
    confirmado: 0,
    falhou: 0,
    indisponivel: 0,
  };
}
