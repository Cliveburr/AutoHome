import { randomUUID } from 'node:crypto';
import { Database } from '../src/database.js';

interface IsolatedTestTarget {
  readonly uri: URL;
  readonly databaseName: string;
}

const isolatedTargets = new WeakMap<Database, IsolatedTestTarget>();
const localMongoHosts = new Set(['localhost', '127.0.0.1', '[::1]']);

function createIsolatedTestTarget(suite: string): IsolatedTestTarget {
  if (!/^[a-z0-9-]+$/.test(suite)) {
    throw new Error(`Test suite name must use lowercase letters, digits, or hyphens: ${suite}`);
  }

  const configuredUri = process.env.MONGODB_URI;
  if (!configuredUri) {
    throw new Error('MONGODB_URI must be configured in api/.env to run integration tests.');
  }

  const uri = new URL(configuredUri);
  if (uri.protocol !== 'mongodb:' || !localMongoHosts.has(uri.hostname)) {
    throw new Error('Integration tests require the configured local MongoDB instance.');
  }

  const configuredDatabase = decodeURIComponent(uri.pathname.replace(/^\//, ''));
  if (!configuredDatabase) {
    throw new Error('MONGODB_URI must include the configured application database name.');
  }

  const runId = Buffer.from(randomUUID().replaceAll('-', ''), 'hex').toString('base64url');
  const databaseName = `${configuredDatabase}-test-${suite}-${runId}`;
  if (Buffer.byteLength(databaseName) > 63) {
    throw new Error("The isolated test database name exceeds MongoDB's 63-byte limit.");
  }
  uri.pathname = `/${databaseName}`;
  return { uri, databaseName };
}

function assertIsolatedTestTarget(database: Database, target: IsolatedTestTarget): void {
  if (
    target.uri.protocol !== 'mongodb:' ||
    !localMongoHosts.has(target.uri.hostname) ||
    database.db.databaseName !== target.databaseName
  ) {
    throw new Error(
      "Refusing to drop a MongoDB database that is not this run's isolated local test database.",
    );
  }
}

export async function connectIsolatedTestDatabase(suite: string): Promise<Database> {
  const target = createIsolatedTestTarget(suite);
  const database = await Database.connect(target.uri.toString());

  try {
    assertIsolatedTestTarget(database, target);
    isolatedTargets.set(database, target);
    return database;
  } catch (error) {
    await database.close();
    throw error;
  }
}

export async function dropIsolatedTestDatabase(database: Database): Promise<void> {
  const target = isolatedTargets.get(database);
  if (!target) {
    throw new Error(
      'Refusing to drop a MongoDB database not created by the isolated test harness.',
    );
  }

  assertIsolatedTestTarget(database, target);
  await database.db.dropDatabase();
}
