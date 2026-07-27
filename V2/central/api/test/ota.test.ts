import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadEnvFile } from 'node:process';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { AuditService } from '../src/audit.js';
import { type AuthenticatedSession } from '../src/authentication.js';
import { Database } from '../src/database.js';
import { FirmwareRepository } from '../src/firmware.js';
import { ModuleInventoryService } from '../src/modules.js';
import { OtaService } from '../src/ota.js';
import {
  type ModuleState,
  type ModuleTransport,
  type TransportEvent,
  type TransportOperationResult,
} from '../src/transport.js';
import { connectIsolatedTestDatabase, dropIsolatedTestDatabase } from './test-database.js';

loadEnvFile(new URL('../.env', import.meta.url));

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

const actor: AuthenticatedSession = {
  sessionId: 'ota-test-session',
  userId: '0123456789abcdef01234567',
  user: {
    id: '0123456789abcdef01234567',
    username: 'ota-admin',
    role: 'administrador',
    active: true,
    passwordChangeRequired: false,
  },
};

class ControlledTransport implements ModuleTransport {
  readonly hashes = new Map<string, string | undefined>();
  readonly failures = new Set<string>();
  readonly mismatches = new Set<string>();
  active = 0;
  maxActive = 0;

  subscribe(listener: (event: TransportEvent) => void): () => void {
    void listener;
    return () => undefined;
  }
  async requestState(protocolId: string): Promise<ModuleState | undefined> {
    void protocolId;
    return undefined;
  }
  async requestFirmwareHash(protocolId: string): Promise<string | undefined> {
    return this.hashes.get(protocolId);
  }
  async sendCommand(): Promise<TransportOperationResult> {
    return { status: 'pending' };
  }
  async distributeConfiguration(): Promise<TransportOperationResult> {
    return { status: 'pending' };
  }
  async distributeLocalLink(): Promise<TransportOperationResult> {
    return { status: 'pending' };
  }
  async transferFirmware(input: {
    protocolId: string;
    expectedHash: string;
    firmware: Uint8Array;
    correlationId: string;
  }): Promise<TransportOperationResult> {
    this.active += 1;
    this.maxActive = Math.max(this.maxActive, this.active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    this.active -= 1;
    if (this.failures.has(input.protocolId))
      return { status: 'failed', reason: 'simulated_failure' };
    if (!this.mismatches.has(input.protocolId))
      this.hashes.set(input.protocolId, input.expectedHash);
    return { status: 'confirmed' };
  }
}

describe('OtaService', () => {
  let database: Database;
  let directory: string;

  beforeAll(async () => {
    database = await connectIsolatedTestDatabase('ota');
  });

  afterEach(async () => {
    await dropIsolatedTestDatabase(database);
    if (directory) await rm(directory, { recursive: true, force: true });
  });

  afterAll(async () => {
    await database.close();
  });

  it('persists eligible items, enforces global concurrency, isolates failures and retries only unconfirmed items', async () => {
    directory = await mkdtemp(join(tmpdir(), 'autohome-central-ota-'));
    await writeFile(join(directory, 'current.bin'), 'current-firmware');
    const expected = sha256('current-firmware');
    const transport = new ControlledTransport();
    const audit = new AuditService(database);
    const modules = new ModuleInventoryService(database, audit, transport);
    for (const protocolId of ['gen1-confirmed', 'gen1-failed', 'gen1-mismatch']) {
      transport.hashes.set(protocolId, sha256(`old-${protocolId}`));
      await modules.handleTransportEvent({
        type: 'module.discovered',
        module: {
          protocolId,
          family: 'gen1',
          capabilities: [{ id: 'relay' }],
          transport: 'simulated',
        },
        occurredAt: new Date(),
      });
      await modules.adopt(protocolId, actor);
    }
    transport.failures.add('gen1-failed');
    transport.mismatches.add('gen1-mismatch');
    const ota = new OtaService(
      database,
      new FirmwareRepository({ gen1: directory }),
      modules,
      transport,
      audit,
      1,
    );

    const created = await ota.create({ scope: 'family', family: 'gen1' }, actor);
    expect('job' in created).toBe(true);
    if (!('job' in created)) return;
    const completed = await waitFor(async () => {
      const job = await ota.get(created.job.id);
      return job && isTerminalJob(job.status) && job.items.every((item) => isTerminal(item.status))
        ? job
        : undefined;
    });
    expect(transport.maxActive).toBe(1);
    expect(completed.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          protocolId: 'gen1-confirmed',
          status: 'confirmado',
          expectedFirmwareSha256: expected,
        }),
        expect.objectContaining({ protocolId: 'gen1-failed', status: 'falhou' }),
        expect.objectContaining({
          protocolId: 'gen1-mismatch',
          status: 'falhou',
          reason: 'firmware_hash_mismatch',
        }),
      ]),
    );
    expect(completed.summary.confirmado).toBe(1);
    expect(completed.summary.falhou).toBe(2);
    const logs = await database.db
      .collection('audit_logs')
      .find({ action: 'ota.item_completed' })
      .toArray();
    expect(logs).toHaveLength(3);
    expect(logs.every((log) => log.actorUserId?.toHexString() === actor.userId)).toBe(true);
    expect(logs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          details: expect.objectContaining({ firmwareSha256: expected }),
        }),
      ]),
    );
    expect(JSON.stringify(logs)).toContain(expected);
    expect(JSON.stringify(logs)).not.toContain('passwordHash');
    const retry = await ota.retry(created.job.id, actor);
    expect('job' in retry).toBe(true);
    if (!('job' in retry)) return;
    expect(retry.job.sourceJobId).toBe(created.job.id);
    expect(retry.job.items.map((item) => item.protocolId).sort()).toEqual([
      'gen1-failed',
      'gen1-mismatch',
    ]);
    await waitFor(async () => {
      const job = await ota.get(retry.job.id);
      return job && isTerminalJob(job.status) && job.items.every((item) => isTerminal(item.status))
        ? job
        : undefined;
    });
  });
});

function isTerminal(status: string): boolean {
  return ['confirmado', 'falhou', 'indisponivel'].includes(status);
}

function isTerminalJob(status: string): boolean {
  return ['confirmado', 'concluido_com_falhas'].includes(status);
}

async function waitFor<T>(read: () => Promise<T | undefined>): Promise<T> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const value = await read();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Timed out waiting for OTA job completion.');
}
