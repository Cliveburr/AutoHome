import { type Db, type IndexDescription, MongoClient } from 'mongodb';

const collectionIndexes = new Map<string, readonly IndexDescription[]>([
  ['users', [{ key: { username: 1 }, unique: true }]],
  ['sessions', [{ key: { sessionId: 1 }, unique: true }, { key: { expiresAt: 1 } }]],
  [
    'audit_logs',
    [
      { key: { createdAt: -1 } },
      { key: { actorUserId: 1, createdAt: -1 } },
      { key: { targetId: 1, createdAt: -1 } },
      { key: { action: 1, createdAt: -1 } },
      { key: { result: 1, createdAt: -1 } },
    ],
  ],
  ['areas', [{ key: { position: 1 } }]],
  ['rooms', [{ key: { areaId: 1, position: 1 } }]],
  [
    'modules',
    [
      { key: { protocolId: 1 }, unique: true },
      { key: { family: 1 } },
      { key: { roomId: 1 } },
      { key: { availability: 1 } },
    ],
  ],
  ['module_states', [{ key: { moduleId: 1 }, unique: true }, { key: { lastSeenAt: -1 } }]],
  ['module_configurations', [{ key: { moduleId: 1 } }, { key: { syncStatus: 1 } }]],
  [
    'commands',
    [
      { key: { commandId: 1 }, unique: true },
      { key: { moduleId: 1, createdAt: -1 } },
      { key: { status: 1, createdAt: -1 } },
    ],
  ],
  ['ota_jobs', [{ key: { createdAt: -1 } }, { key: { family: 1 } }, { key: { status: 1 } }]],
  [
    'ota_job_items',
    [
      { key: { otaJobId: 1, moduleId: 1 } },
      { key: { status: 1 } },
    ],
  ],
]);

export class Database {
  private constructor(
    private readonly client: MongoClient,
    readonly db: Db,
  ) {}

  static async connect(uri: string): Promise<Database> {
    const client = new MongoClient(uri);

    try {
      await client.connect();
      const database = new Database(client, client.db());
      await database.createIndexes();
      return database;
    } catch (error) {
      await client.close();
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.db.command({ ping: 1 });
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.client.close();
  }

  private async createIndexes(): Promise<void> {
    await Promise.all(
      [...collectionIndexes].map(async ([name, indexes]) => {
        await this.db.collection(name).createIndexes([...indexes]);
      }),
    );
  }
}
