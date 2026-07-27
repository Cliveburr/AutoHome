import { randomUUID } from 'node:crypto';
import { loadEnvFile } from 'node:process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AuditService } from '../src/audit.js';
import { type AuthenticatedSession } from '../src/authentication.js';
import { CommandService } from '../src/commands.js';
import { Database } from '../src/database.js';
import { ModuleInventoryService } from '../src/modules.js';
import { InMemoryModuleTransport } from '../src/transport.js';

loadEnvFile(new URL('../.env', import.meta.url));

function getTestDatabaseUri(): string {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) throw new Error('MONGODB_URI must be configured in api/.env to run tests.');
  const uri = new URL(mongodbUri);
  const configuredDatabase = uri.pathname.replace(/^\//, '') || 'autohome-central';
  uri.pathname = `/${configuredDatabase}-test-commands-${randomUUID().slice(0, 8)}`;
  return uri.toString();
}

const actor: AuthenticatedSession = {
  sessionId: 'command-test-session',
  userId: '0123456789abcdef01234567',
  user: {
    id: '0123456789abcdef01234567',
    username: 'basic',
    role: 'basico',
    active: true,
    passwordChangeRequired: false,
  },
};

describe('commands', () => {
  let database: Database;
  let modules: ModuleInventoryService;
  let commands: CommandService;
  let transport: InMemoryModuleTransport;

  beforeAll(async () => {
    database = await Database.connect(getTestDatabaseUri());
    const audit = new AuditService(database);
    transport = new InMemoryModuleTransport();
    modules = new ModuleInventoryService(database, audit, transport);
    commands = new CommandService(database, modules, audit, transport);
    const module = {
      protocolId: 'gen1-command-relay',
      family: 'gen1',
      capabilities: [
        {
          id: 'relay',
          actions: [
            {
              name: 'set',
              parameters: [
                { key: 'enabled', type: 'boolean' as const, required: true },
                { key: 'level', type: 'number' as const, minimum: 0, maximum: 100 },
              ],
            },
          ],
        },
      ],
      transport: 'simulated' as const,
    };
    await modules.handleTransportEvent({
      type: 'module.discovered',
      module,
      occurredAt: new Date(),
    });
    await modules.adopt(module.protocolId, actor);
    transport.registerModule(module);
  });

  afterAll(async () => {
    await database.db.dropDatabase();
    await database.close();
  });

  it('creates a public command once per requester and idempotency key', async () => {
    const input = {
      protocolId: 'gen1-command-relay',
      capabilityId: 'relay',
      action: 'set',
      parameters: { enabled: true, level: 75 },
    };
    const first = await commands.create(input, 'same-key', actor);
    const repeated = await commands.create(input, 'same-key', actor);

    expect(first).toMatchObject({ created: true, command: { status: 'confirmado' } });
    if (!('command' in first)) throw new Error('Expected a command to be created.');
    expect(repeated).toEqual({ created: false, command: first.command });
    expect(first.command).not.toHaveProperty('_id');
    expect(first.command).not.toHaveProperty('correlationId');
    expect(await database.db.collection('commands').countDocuments()).toBe(1);
    expect(
      await database.db.collection('audit_logs').countDocuments({ action: 'command.requested' }),
    ).toBe(1);

    const otherActor = {
      ...actor,
      userId: 'fedcba987654321001234567',
      user: { ...actor.user, id: 'fedcba987654321001234567' },
    };
    const isolated = await commands.create(input, 'same-key', otherActor);
    expect(isolated).toMatchObject({ created: true });
    expect(await database.db.collection('commands').countDocuments()).toBe(2);
  });

  it('rejects unknown destinations and incomplete, incompatible parameters before persistence', async () => {
    const before = await database.db.collection('commands').countDocuments();
    await expect(
      commands.create(
        {
          protocolId: 'unknown',
          capabilityId: 'relay',
          action: 'set',
          parameters: { enabled: true },
        },
        'unknown-target',
        actor,
      ),
    ).resolves.toEqual({ failure: 'module_not_found' });
    await expect(
      commands.create(
        { protocolId: 'gen1-command-relay', capabilityId: 'relay', action: 'set', parameters: {} },
        'missing-required',
        actor,
      ),
    ).resolves.toEqual({ failure: 'command_invalid' });
    await expect(
      commands.create(
        {
          protocolId: 'gen1-command-relay',
          capabilityId: 'relay',
          action: 'set',
          parameters: { enabled: true, level: 101 },
        },
        'outside-limit',
        actor,
      ),
    ).resolves.toEqual({ failure: 'command_invalid' });
    expect(await database.db.collection('commands').countDocuments()).toBe(before);
  });

  it('persists pending, confirmation, failure and unavailability with correlation protection', async () => {
    transport.setAutoConfirm('gen1-command-relay', 'command', false);
    const pending = await commands.create(
      {
        protocolId: 'gen1-command-relay',
        capabilityId: 'relay',
        action: 'set',
        parameters: { enabled: false },
      },
      'pending-key',
      actor,
    );
    expect(pending).toMatchObject({ command: { status: 'enviado' } });
    const commandId = (pending as { command: { commandId: string } }).command.commandId;
    const stored = await database.db.collection('commands').findOne({ commandId });
    expect(stored).toBeTruthy();

    await commands.handleTransportEvent({
      type: 'operation.confirmed',
      protocolId: 'gen1-command-relay',
      operation: 'command',
      correlationId: 'old-correlation',
      occurredAt: new Date(),
    });
    expect((await commands.get(commandId))?.status).toBe('enviado');
    await commands.handleTransportEvent({
      type: 'operation.confirmed',
      protocolId: 'gen1-command-relay',
      operation: 'command',
      correlationId: stored!.correlationId,
      occurredAt: new Date(),
    });
    expect((await commands.get(commandId))?.status).toBe('confirmado');

    transport.setAutoConfirm('gen1-command-relay', 'command', true);
    transport.failNextOperation('gen1-command-relay', 'command');
    const failed = await commands.create(
      {
        protocolId: 'gen1-command-relay',
        capabilityId: 'relay',
        action: 'set',
        parameters: { enabled: true },
      },
      'failed-key',
      actor,
    );
    expect(failed).toMatchObject({
      command: { status: 'falhou', failureReason: 'transport_failed' },
    });

    transport.setAvailability('gen1-command-relay', false);
    const unavailable = await commands.create(
      {
        protocolId: 'gen1-command-relay',
        capabilityId: 'relay',
        action: 'set',
        parameters: { enabled: true },
      },
      'unavailable-key',
      actor,
    );
    expect(unavailable).toMatchObject({
      command: { status: 'indisponivel', failureReason: 'module_unavailable' },
    });
    const audit = await database.db
      .collection('audit_logs')
      .find({ action: /^command\./ })
      .toArray();
    expect(JSON.stringify(audit)).not.toMatch(/password|cookie|token|secret/i);
  });
});
