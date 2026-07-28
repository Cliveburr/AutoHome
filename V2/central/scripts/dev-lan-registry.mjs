import { readFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import net from 'node:net';

export function isProcessAlive(pid) {
  if (!Number.isSafeInteger(pid) || pid < 1) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function commandLineFor(pid) {
  if (process.platform !== 'win32') return '';
  try {
    return execFileSync(
      'powershell.exe',
      [
        '-NoProfile',
        '-Command',
        `(Get-CimInstance Win32_Process -Filter \"ProcessId = ${pid}\").CommandLine`,
      ],
      { encoding: 'utf8' },
    ).trim();
  } catch {
    return '';
  }
}

function expectedWorkspace(name) {
  if (name === 'api') return '@autohome/api';
  if (name === 'web') return '@autohome/web';
  return undefined;
}

export function liveWorkers(
  registry,
  { isAlive = isProcessAlive, readCommandLine = commandLineFor } = {},
) {
  if (!registry || !Array.isArray(registry.workers) || typeof registry.token !== 'string') {
    return [];
  }

  return registry.workers.filter((worker) => {
    const pid = Number(worker.pid);
    const workspace = expectedWorkspace(worker.name);
    if (!isAlive(pid) || !workspace) return false;

    const commandLine = readCommandLine(pid);
    return (
      typeof commandLine === 'string' &&
      commandLine.includes('dev-lan-worker.mjs') &&
      commandLine.includes(workspace) &&
      commandLine.includes(registry.token)
    );
  });
}

export async function inspectRegistry(registryPath, options) {
  let registry;
  try {
    registry = JSON.parse(await readFile(registryPath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return { state: 'missing' };
    if (error instanceof SyntaxError) return { state: 'invalid' };
    throw error;
  }

  const workers = liveWorkers(registry, options);
  return workers.length ? { state: 'active', registry, workers } : { state: 'stale', registry };
}

export function removeStaleRegistry(registryPath) {
  return rm(registryPath, { force: true });
}

export function isPortInUse(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
  });
}
