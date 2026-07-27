import { createHash, randomUUID } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadEnvFile } from 'node:process';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { AuditService } from '../src/audit.js';
import { type AuthenticatedSession } from '../src/authentication.js';
import { Database } from '../src/database.js';
import { FirmwareReconciliationService, FirmwareRepository } from '../src/firmware.js';
import { ModuleInventoryService } from '../src/modules.js';
import { InMemoryModuleTransport } from '../src/transport.js';
import { connectIsolatedTestDatabase, dropIsolatedTestDatabase } from './test-database.js';

loadEnvFile(new URL('../.env', import.meta.url));

const temporaryDirectories: string[] = [];

async function createFirmwareDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'autohome-central-firmware-'));
  temporaryDirectories.push(directory);
  return directory;
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

const actor: AuthenticatedSession = {
  sessionId: 'firmware-test-session',
  userId: '0123456789abcdef01234567',
  user: {
    id: '0123456789abcdef01234567',
    username: 'firmware-admin',
    role: 'administrador',
    active: true,
    passwordChangeRequired: false,
  },
};

describe('FirmwareRepository', () => {
  afterEach(async () => {
    await Promise.all(
      temporaryDirectories
        .splice(0)
        .map((directory) => rm(directory, { force: true, recursive: true })),
    );
  });

  it('validates configured readable directories and lists only regular .bin hashes', async () => {
    const directory = await createFirmwareDirectory();
    await writeFile(join(directory, 'a.bin'), 'firmware-a');
    await writeFile(join(directory, 'duplicate.bin'), 'firmware-a');
    await writeFile(join(directory, 'b.bin'), 'firmware-b');
    await writeFile(join(directory, 'ignored.BIN'), 'firmware-c');
    await writeFile(join(directory, 'ignored.txt'), 'firmware-d');
    const repository = new FirmwareRepository({ gen1: directory });

    await expect(repository.validateDirectories()).resolves.toBeUndefined();
    await expect(repository.listArtifacts('gen1')).resolves.toEqual(
      [sha256('firmware-a'), sha256('firmware-b')].sort().map((hash) => ({ hash })),
    );
  });

  it('fails explicitly for a missing directory or a configured file', async () => {
    const missing = new FirmwareRepository({ gen1: join(tmpdir(), `missing-${randomUUID()}`) });
    await expect(missing.validateDirectories()).rejects.toThrow(
      'Firmware directory for family gen1',
    );

    const directory = await createFirmwareDirectory();
    const filePath = join(directory, 'not-a-directory');
    await writeFile(filePath, 'not a directory');
    await expect(new FirmwareRepository({ gen1: filePath }).validateDirectories()).rejects.toThrow(
      'Firmware directory for family gen1',
    );
  });

  it('reads only a configured eligible bin by its verified hash', async () => {
    const directory = await createFirmwareDirectory();
    await writeFile(join(directory, 'firmware.bin'), 'firmware-bytes');
    await writeFile(join(directory, 'ignored.txt'), 'not-firmware');
    const repository = new FirmwareRepository({ gen1: directory });

    await expect(repository.readArtifact('gen1', sha256('firmware-bytes'))).resolves.toEqual(
      Buffer.from('firmware-bytes'),
    );
    await expect(repository.readArtifact('gen1', sha256('not-firmware'))).rejects.toThrow(
      'Eligible firmware artifact',
    );
  });
});

describe('FirmwareReconciliationService', () => {
  let database: Database;

  beforeAll(async () => {
    database = await connectIsolatedTestDatabase('firmware');
  });

  afterAll(async () => {
    await dropIsolatedTestDatabase(database);
    await database.close();
  });

  afterEach(async () => {
    await dropIsolatedTestDatabase(database);
    await Promise.all(
      temporaryDirectories
        .splice(0)
        .map((directory) => rm(directory, { force: true, recursive: true })),
    );
  });

  it('compares adopted modules, preserves state values and reports unavailable information as unknown', async () => {
    const directory = await createFirmwareDirectory();
    await writeFile(join(directory, 'gen1.bin'), 'firmware-current');
    const repository = new FirmwareRepository({ gen1: directory });
    const transport = new InMemoryModuleTransport();
    const modules = new ModuleInventoryService(database, new AuditService(database), transport);

    for (const input of [
      { protocolId: 'gen1-current', firmwareHash: sha256('firmware-current') },
      { protocolId: 'gen1-outdated', firmwareHash: sha256('firmware-old') },
      { protocolId: 'gen1-unknown', firmwareHash: undefined },
    ]) {
      const module = transport.registerModule({
        protocolId: input.protocolId,
        family: 'gen1',
        capabilities: [{ id: 'relay' }],
        ...(input.firmwareHash ? { firmwareHash: input.firmwareHash } : {}),
      });
      await modules.handleTransportEvent({
        type: 'module.discovered',
        module,
        occurredAt: new Date(),
      });
      await modules.adopt(input.protocolId, actor);
    }
    await modules.handleTransportEvent({
      type: 'module.state',
      protocolId: 'gen1-current',
      state: { values: { relay: true }, observedAt: new Date() },
      occurredAt: new Date(),
    });

    const reconciliation = new FirmwareReconciliationService(repository, modules, transport);
    await expect(reconciliation.reconcile()).resolves.toEqual({
      families: [
        {
          family: 'gen1',
          artifacts: [{ hash: sha256('firmware-current') }],
          modules: [
            { protocolId: 'gen1-current', status: 'atualizado' },
            { protocolId: 'gen1-outdated', status: 'atualizacao_disponivel' },
            { protocolId: 'gen1-unknown', status: 'desconhecido' },
          ],
        },
      ],
    });
    await expect(modules.getDetail('gen1-current')).resolves.toMatchObject({
      state: { values: { relay: true }, firmwareHash: sha256('firmware-current') },
    });

    await expect(
      new FirmwareReconciliationService(repository, modules).reconcile(),
    ).resolves.toMatchObject({
      families: [
        {
          modules: expect.arrayContaining([{ protocolId: 'gen1-current', status: 'desconhecido' }]),
        },
      ],
    });
  });

  it('does not select or query a firmware hash when the family has no eligible artifact', async () => {
    const directory = await createFirmwareDirectory();
    await writeFile(join(directory, 'notes.txt'), 'not firmware');
    const transport = new InMemoryModuleTransport();
    const modules = new ModuleInventoryService(database, new AuditService(database), transport);
    const module = transport.registerModule({
      protocolId: 'gen1-no-artifact',
      family: 'gen1',
      capabilities: [{ id: 'relay' }],
      firmwareHash: sha256('firmware-current'),
    });
    await modules.handleTransportEvent({
      type: 'module.discovered',
      module,
      occurredAt: new Date(),
    });
    await modules.adopt('gen1-no-artifact', actor);
    const requestFirmwareHash = vi.spyOn(transport, 'requestFirmwareHash');
    const reconciliation = new FirmwareReconciliationService(
      new FirmwareRepository({ gen1: directory }),
      modules,
      transport,
    );

    await expect(reconciliation.reconcile()).resolves.toEqual({
      families: [
        {
          family: 'gen1',
          artifacts: [],
          modules: [{ protocolId: 'gen1-no-artifact', status: 'desconhecido' }],
        },
      ],
    });
    expect(requestFirmwareHash).not.toHaveBeenCalled();
  });
});
