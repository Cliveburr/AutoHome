import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { type AppConfig } from '../src/config.js';
import { InMemoryModuleTransport, type TransportEvent } from '../src/transport.js';

const fixtureFirmwareDirectory = mkdtempSync(join(tmpdir(), 'autohome-central-transport-'));

afterAll(() => {
  rmSync(fixtureFirmwareDirectory, { force: true, recursive: true });
});

describe('InMemoryModuleTransport', () => {
  it('simulates discovery, state and hash queries, commands and configuration confirmation', async () => {
    const transport = new InMemoryModuleTransport();
    const events: TransportEvent[] = [];
    transport.subscribe((event) => events.push(event));

    transport.registerModule({
      protocolId: 'gen1-switch-1',
      family: 'gen1',
      capabilities: [{ id: 'switch' }],
      state: { switch: false },
      firmwareHash: 'old-hash',
    });

    await expect(transport.requestState('gen1-switch-1')).resolves.toMatchObject({
      values: { switch: false },
      firmwareHash: 'old-hash',
    });
    await expect(transport.requestFirmwareHash('gen1-switch-1')).resolves.toBe('old-hash');
    await expect(
      transport.sendCommand({
        protocolId: 'gen1-switch-1',
        action: 'set',
        parameters: { value: true },
        correlationId: 'command-1',
      }),
    ).resolves.toEqual({ status: 'confirmed' });
    await expect(
      transport.distributeConfiguration({
        protocolId: 'gen1-switch-1',
        configuration: { inverted: false },
        correlationId: 'configuration-1',
      }),
    ).resolves.toEqual({ status: 'confirmed' });

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'module.discovered',
          module: expect.objectContaining({ protocolId: 'gen1-switch-1' }),
        }),
        expect.objectContaining({ type: 'module.state', protocolId: 'gen1-switch-1' }),
        expect.objectContaining({
          type: 'operation.confirmed',
          operation: 'command',
          correlationId: 'command-1',
        }),
        expect.objectContaining({
          type: 'operation.confirmed',
          operation: 'configuration',
          correlationId: 'configuration-1',
        }),
      ]),
    );
  });

  it('simulates unavailability and an isolated OTA transfer failure', async () => {
    const transport = new InMemoryModuleTransport();
    const events: TransportEvent[] = [];
    transport.subscribe((event) => events.push(event));
    transport.registerModule({
      protocolId: 'gen1-relay-1',
      family: 'gen1',
      capabilities: [{ id: 'relay' }],
    });

    transport.setAvailability('gen1-relay-1', false);
    await expect(transport.requestState('gen1-relay-1')).resolves.toBeUndefined();
    await expect(
      transport.sendCommand({
        protocolId: 'gen1-relay-1',
        action: 'toggle',
        parameters: {},
        correlationId: 'command-2',
      }),
    ).resolves.toEqual({ status: 'unavailable' });

    transport.setAvailability('gen1-relay-1', true);
    transport.failNextTransfer('gen1-relay-1', 'simulated link loss');
    await expect(
      transport.transferFirmware({
        protocolId: 'gen1-relay-1',
        expectedHash: 'new-hash',
        firmware: new Uint8Array([1, 2, 3]),
        correlationId: 'ota-1',
      }),
    ).resolves.toEqual({ status: 'failed', reason: 'simulated_failure' });
    await expect(transport.requestFirmwareHash('gen1-relay-1')).resolves.toBeUndefined();

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'module.unavailable', operation: 'state' }),
        expect.objectContaining({ type: 'module.unavailable', operation: 'command' }),
        expect.objectContaining({
          type: 'ota.transfer_failed',
          expectedHash: 'new-hash',
          reason: 'simulated link loss',
        }),
      ]),
    );
  });

  it('updates the simulated firmware hash only after a successful transfer', async () => {
    const transport = new InMemoryModuleTransport();
    transport.registerModule({
      protocolId: 'gen1-sensor-1',
      family: 'gen1',
      capabilities: [{ id: 'sensor' }],
      firmwareHash: 'old-hash',
    });

    await expect(
      transport.transferFirmware({
        protocolId: 'gen1-sensor-1',
        expectedHash: 'new-hash',
        firmware: new Uint8Array([1]),
        correlationId: 'ota-2',
      }),
    ).resolves.toEqual({ status: 'confirmed' });
    await expect(transport.requestFirmwareHash('gen1-sensor-1')).resolves.toBe('new-hash');
  });

  it('keeps a configuration pending until an explicit simulated confirmation and exposes only a safe failure reason', async () => {
    const transport = new InMemoryModuleTransport();
    const events: TransportEvent[] = [];
    transport.subscribe((event) => events.push(event));
    transport.registerModule({
      protocolId: 'gen1-config-1',
      family: 'gen1',
      capabilities: [{ id: 'switch' }],
    });
    transport.setAutoConfirm('gen1-config-1', 'configuration', false);
    await expect(
      transport.distributeConfiguration({
        protocolId: 'gen1-config-1',
        configuration: {},
        correlationId: 'pending-1',
      }),
    ).resolves.toEqual({ status: 'pending' });
    expect(events).not.toContainEqual(
      expect.objectContaining({ type: 'operation.confirmed', correlationId: 'pending-1' }),
    );
    transport.confirmOperation('gen1-config-1', 'configuration', 'pending-1');
    expect(events).toContainEqual(
      expect.objectContaining({ type: 'operation.confirmed', correlationId: 'pending-1' }),
    );
    transport.failNextOperation('gen1-config-1', 'configuration');
    await expect(
      transport.distributeConfiguration({
        protocolId: 'gen1-config-1',
        configuration: {},
        correlationId: 'failed-1',
      }),
    ).resolves.toEqual({ status: 'failed', reason: 'simulated_failure' });
  });
});

describe('development simulated module insertion', () => {
  const config: AppConfig = {
    mongodbUri: 'mongodb://unused-in-tests',
    sessionSecret: 'development-transport-test-secret',
    nodeEnv: 'development',
    httpPort: 3000,
    firmwareGen1Dir: fixtureFirmwareDirectory,
    otaMaxConcurrency: 1,
  };

  it('is available only in development and emits discovery logs through the transport', async () => {
    const transport = new InMemoryModuleTransport();
    const app = buildApp({ config, simulatedTransport: transport });
    await app.ready();

    const create = await app.inject({
      method: 'POST',
      url: '/api/v1/development/simulated-modules',
      payload: {
        protocolId: 'gen1-lamp-1',
        family: 'gen1',
        capabilities: [{ id: 'dimmer' }],
        state: { brightness: 30 },
      },
    });
    expect(create.statusCode).toBe(201);
    expect(create.json()).toEqual({
      module: expect.objectContaining({ protocolId: 'gen1-lamp-1', transport: 'simulated' }),
    });
    await expect(transport.requestState('gen1-lamp-1')).resolves.toMatchObject({
      values: { brightness: 30 },
    });

    await app.close();

    const productionApp = buildApp({ config: { ...config, nodeEnv: 'production' } });
    const unavailableOutsideDevelopment = await productionApp.inject({
      method: 'POST',
      url: '/api/v1/development/simulated-modules',
      payload: {},
    });
    expect(unavailableOutsideDevelopment.statusCode).toBe(404);
    await productionApp.close();
  });
});
