import { randomUUID } from 'node:crypto';
import { loadEnvFile } from 'node:process';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AuditService } from '../src/audit.js';
import { type AuthenticatedSession } from '../src/authentication.js';
import { Database } from '../src/database.js';
import { ModuleInventoryService } from '../src/modules.js';
import { InMemoryModuleTransport } from '../src/transport.js';

loadEnvFile(new URL('../.env', import.meta.url));

function getTestDatabaseUri(): string {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error('MONGODB_URI must be configured in api/.env to run integration tests.');
  }

  const uri = new URL(mongodbUri);
  const configuredDatabase = uri.pathname.replace(/^\//, '') || 'autohome-central';
  uri.pathname = `/${configuredDatabase}-test-modules-${randomUUID().slice(0, 8)}`;
  return uri.toString();
}

describe('module discovery inventory', () => {
  let database: Database;
  let modules: ModuleInventoryService;
  const actor: AuthenticatedSession = {
    sessionId: 'module-test-session',
    userId: '0123456789abcdef01234567',
    user: {
      id: '0123456789abcdef01234567',
      username: 'admin',
      role: 'administrador',
      active: true,
      passwordChangeRequired: false,
    },
  };

  beforeAll(async () => {
    database = await Database.connect(getTestDatabaseUri());
    modules = new ModuleInventoryService(database, new AuditService(database));
  });

  afterAll(async () => {
    await database.db.dropDatabase();
    await database.close();
  });

  it('deduplicates observations, updates availability and blocks transport access before adoption', async () => {
    const firstSeen = new Date('2026-07-27T10:00:00.000Z');
    const latestSeen = new Date('2026-07-27T10:05:00.000Z');
    await modules.handleTransportEvent({
      type: 'module.discovered',
      module: {
        protocolId: 'gen1-switch-kitchen',
        family: 'gen1',
        capabilities: [{ id: 'switch' }],
        transport: 'simulated',
      },
      occurredAt: firstSeen,
    });
    await modules.handleTransportEvent({
      type: 'module.discovered',
      module: {
        protocolId: 'gen1-switch-kitchen',
        family: 'gen1',
        capabilities: [{ id: 'switch' }, { id: 'energy' }],
        transport: 'simulated',
      },
      occurredAt: latestSeen,
    });
    await modules.handleTransportEvent({
      type: 'module.unavailable',
      protocolId: 'gen1-switch-kitchen',
      operation: 'state',
      occurredAt: latestSeen,
    });

    const discovered = await modules.listDiscovered({
      family: 'gen1',
      capability: 'energy',
      transport: 'simulated',
      availability: 'offline',
    });
    expect(discovered).toEqual([
      expect.objectContaining({
        protocolId: 'gen1-switch-kitchen',
        capabilities: [{ id: 'switch' }, { id: 'energy' }],
        status: 'descoberto',
        availability: 'offline',
        discoveredAt: firstSeen.toISOString(),
        lastObservedAt: latestSeen.toISOString(),
      }),
    ]);
    expect(await database.db.collection('modules').countDocuments()).toBe(1);

    const sendCommand = vi.fn();
    const blocked = await modules.executeForAdoptedModule('gen1-switch-kitchen', async () =>
      sendCommand(),
    );
    expect(blocked).toEqual({ executed: false });
    expect(sendCommand).not.toHaveBeenCalled();
  });

  it('adopts exactly once and records only safe audit metadata', async () => {
    const [first, second] = await Promise.all([
      modules.adopt('gen1-switch-kitchen', actor, '127.0.0.1'),
      modules.adopt('gen1-switch-kitchen', actor, '127.0.0.1'),
    ]);
    const results = [first, second];
    expect(results.filter((result) => 'module' in result)).toHaveLength(1);
    expect(results).toContainEqual({ failure: 'module_already_adopted' });

    const adopted = await modules.listRegistered({ protocolId: 'gen1-switch-kitchen' });
    expect(adopted).toEqual([
      expect.objectContaining({ status: 'cadastrado', protocolId: 'gen1-switch-kitchen' }),
    ]);
    expect(adopted[0]).not.toHaveProperty('roomId');

    const auditLogs = await database.db
      .collection('audit_logs')
      .find({ action: 'module.adopted' })
      .toArray();
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0]).toMatchObject({
      result: 'success',
      details: expect.objectContaining({ protocolId: 'gen1-switch-kitchen' }),
    });
    expect(JSON.stringify(auditLogs)).not.toContain('password');
  });

  it('persists organization, state, configuration synchronization and compatible local links', async () => {
    const transport = new InMemoryModuleTransport();
    const service = new ModuleInventoryService(database, new AuditService(database), transport);
    transport.subscribe((event) => void service.handleTransportEvent(event));
    const now = new Date('2026-07-27T11:00:00.000Z');
    const source = {
      protocolId: 'gen1-switch-link-source',
      family: 'gen1',
      capabilities: [
        {
          id: 'switch',
          configuration: [{ key: 'debounceMs', type: 'number' as const, minimum: 1, maximum: 100 }],
          events: ['pressed'],
        },
      ],
      transport: 'simulated' as const,
    };
    const target = {
      protocolId: 'gen1-relay-link-target',
      family: 'gen1',
      capabilities: [
        {
          id: 'relay',
          actions: [{ name: 'set', parameters: [{ key: 'enabled', type: 'boolean' as const }] }],
        },
      ],
      transport: 'simulated' as const,
    };
    await service.handleTransportEvent({
      type: 'module.discovered',
      module: source,
      occurredAt: now,
    });
    await service.handleTransportEvent({
      type: 'module.discovered',
      module: target,
      occurredAt: now,
    });
    await service.adopt(source.protocolId, actor);
    await service.adopt(target.protocolId, actor);
    const room = await database.db.collection('rooms').insertOne({ name: 'Teste', position: 0 });

    const organization = await service.updateOrganization(
      source.protocolId,
      { name: 'Interruptor da entrada', roomId: room.insertedId.toHexString() },
      actor,
    );
    expect(organization).toMatchObject({
      value: { name: 'Interruptor da entrada', roomId: room.insertedId.toHexString() },
    });
    await service.handleTransportEvent({
      type: 'module.state',
      protocolId: source.protocolId,
      state: { values: { pressed: false }, observedAt: now },
      occurredAt: now,
    });

    transport.registerModule(source);
    transport.registerModule(target);
    const configured = await service.setConfiguration(
      source.protocolId,
      { capabilityId: 'switch', parameterKey: 'debounceMs', value: 25 },
      actor,
    );
    expect(configured).toMatchObject({
      value: {
        desired: 25,
        sent: { value: 25 },
        confirmed: { value: 25 },
        syncStatus: 'confirmada',
      },
    });
    const invalid = await service.setConfiguration(
      source.protocolId,
      { capabilityId: 'switch', parameterKey: 'debounceMs', value: 101 },
      actor,
    );
    expect(invalid).toEqual({ failure: 'configuration_invalid' });

    transport.setAvailability(source.protocolId, false);
    const unavailable = await service.setConfiguration(
      source.protocolId,
      { capabilityId: 'switch', parameterKey: 'debounceMs', value: 30 },
      actor,
    );
    expect(unavailable).toMatchObject({
      value: {
        desired: 30,
        confirmed: { value: 25 },
        syncStatus: 'falhou',
        failureReason: 'module_unavailable',
      },
    });
    transport.setAvailability(source.protocolId, true);

    const linked = await service.createLocalLink(
      source.protocolId,
      {
        source: { capabilityId: 'switch', event: 'pressed' },
        target: {
          protocolId: target.protocolId,
          capabilityId: 'relay',
          action: 'set',
          parameters: { enabled: true },
        },
      },
      actor,
    );
    expect(linked).toMatchObject({
      value: { syncStatus: 'confirmada', target: { action: 'set' } },
    });
    const incompatible = await service.createLocalLink(
      source.protocolId,
      {
        source: { capabilityId: 'switch', event: 'pressed' },
        target: {
          protocolId: target.protocolId,
          capabilityId: 'relay',
          action: 'set',
          parameters: { enabled: 'yes' },
        },
      },
      actor,
    );
    expect(incompatible).toEqual({ failure: 'link_incompatible' });

    const detail = await service.getDetail(source.protocolId);
    expect(detail).toMatchObject({
      name: 'Interruptor da entrada',
      state: { values: { pressed: false } },
    });
    expect(detail?.configurations[0]).toMatchObject({
      confirmed: { value: 25 },
      syncStatus: 'falhou',
    });
    expect(detail?.localLinks[0]).toMatchObject({ syncStatus: 'confirmada' });
    expect(
      JSON.stringify(
        await database.db
          .collection('audit_logs')
          .find({ action: /^module\./ })
          .toArray(),
      ),
    ).not.toContain('enabled');
  });
});
