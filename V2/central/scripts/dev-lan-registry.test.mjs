import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectRegistry, isPortInUse, removeStaleRegistry } from './dev-lan-registry.mjs';

test('identifies missing, invalid, and stale registries without touching the real runtime', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'autohome-dev-lan-'));
  const registryPath = join(directory, 'dev-lan.json');
  try {
    assert.equal((await inspectRegistry(registryPath)).state, 'missing');
    await writeFile(registryPath, '{invalid', 'utf8');
    assert.equal((await inspectRegistry(registryPath)).state, 'invalid');
    await writeFile(registryPath, JSON.stringify({ workers: [{ pid: 999999 }] }), 'utf8');
    assert.equal((await inspectRegistry(registryPath)).state, 'stale');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('protects a registry only when its live worker has the expected token and command line', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'autohome-dev-lan-'));
  const registryPath = join(directory, 'dev-lan.json');
  const token = 'expected-token';
  try {
    await writeFile(
      registryPath,
      JSON.stringify({ token, workers: [{ name: 'api', pid: 1234 }] }),
      'utf8',
    );
    const inspection = await inspectRegistry(registryPath, {
      isAlive: (pid) => pid === 1234,
      readCommandLine: () => `node dev-lan-worker.mjs @autohome/api ${token}`,
    });
    assert.equal(inspection.state, 'active');
    assert.deepEqual(
      inspection.workers.map(({ pid }) => pid),
      [1234],
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('removes a live PID registry with a divergent token or command line as stale', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'autohome-dev-lan-'));
  const registryPath = join(directory, 'dev-lan.json');
  const token = 'expected-token';
  try {
    for (const commandLine of [
      'node dev-lan-worker.mjs @autohome/api another-token',
      `node unrelated-worker.mjs @autohome/api ${token}`,
    ]) {
      await writeFile(
        registryPath,
        JSON.stringify({ token, workers: [{ name: 'api', pid: 1234 }] }),
        'utf8',
      );
      const inspection = await inspectRegistry(registryPath, {
        isAlive: (pid) => pid === 1234,
        readCommandLine: () => commandLine,
      });

      assert.equal(inspection.state, 'stale');
      await removeStaleRegistry(registryPath);
      assert.equal((await inspectRegistry(registryPath)).state, 'missing');
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('reports a listening port without requiring the runtime registry', async () => {
  assert.equal(await isPortInUse(1), false);
});
