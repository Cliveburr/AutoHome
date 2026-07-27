import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { access, readdir, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join } from 'node:path';
import { type ModuleInventoryService } from './modules.js';
import { type ModuleTransport } from './transport.js';

export interface FirmwareArtifact {
  hash: string;
}

export interface FirmwareFamilyAvailability {
  family: string;
  artifacts: FirmwareArtifact[];
  modules: Array<{
    protocolId: string;
    status: 'atualizado' | 'atualizacao_disponivel' | 'desconhecido';
  }>;
}

export class FirmwareRepository {
  constructor(private readonly directories: Readonly<Record<string, string>>) {}

  families(): string[] {
    return Object.keys(this.directories).sort();
  }

  async validateDirectories(): Promise<void> {
    await Promise.all(this.families().map((family) => this.validateDirectory(family)));
  }

  async listArtifacts(family: string): Promise<FirmwareArtifact[]> {
    const directory = this.directoryFor(family);
    const entries = await readdir(directory, { withFileTypes: true });
    const hashes = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && extname(entry.name) === '.bin')
        .sort((left, right) => left.name.localeCompare(right.name))
        .map(async (entry) => hashFile(join(directory, entry.name))),
    );

    return [...new Set(hashes)].sort().map((hash) => ({ hash }));
  }

  private async validateDirectory(family: string): Promise<void> {
    const directory = this.directoryFor(family);
    try {
      const metadata = await stat(directory);
      if (!metadata.isDirectory()) {
        throw new Error('is not a directory');
      }
      await access(directory, constants.R_OK);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'cannot be accessed';
      throw new Error(`Firmware directory for family ${family} is invalid: ${reason}`);
    }
  }

  private directoryFor(family: string): string {
    const directory = this.directories[family];
    if (!directory) throw new Error(`No firmware directory is configured for family ${family}.`);
    return directory;
  }
}

export class FirmwareReconciliationService {
  constructor(
    private readonly repository: FirmwareRepository,
    private readonly modules: ModuleInventoryService,
    private readonly transport?: ModuleTransport,
  ) {}

  async reconcile(): Promise<{ families: FirmwareFamilyAvailability[] }> {
    return {
      families: await Promise.all(
        this.repository.families().map((family) => this.reconcileFamily(family)),
      ),
    };
  }

  private async reconcileFamily(family: string): Promise<FirmwareFamilyAvailability> {
    const [artifacts, modules] = await Promise.all([
      this.repository.listArtifacts(family),
      this.modules.listRegistered({ family }),
    ]);
    const localHashes = new Set(artifacts.map((artifact) => artifact.hash));

    return {
      family,
      artifacts,
      modules: await Promise.all(
        modules.map(async (module) => {
          if (localHashes.size === 0 || !this.transport) {
            return { protocolId: module.protocolId, status: 'desconhecido' as const };
          }

          try {
            const firmwareHash = await this.transport.requestFirmwareHash(module.protocolId);
            if (!firmwareHash) {
              return { protocolId: module.protocolId, status: 'desconhecido' as const };
            }
            await this.modules.recordFirmwareHash(module.protocolId, firmwareHash);
            return {
              protocolId: module.protocolId,
              status: localHashes.has(firmwareHash)
                ? ('atualizado' as const)
                : ('atualizacao_disponivel' as const),
            };
          } catch {
            return { protocolId: module.protocolId, status: 'desconhecido' as const };
          }
        }),
      ),
    };
  }
}

async function hashFile(filePath: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest('hex');
}
