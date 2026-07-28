import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const centralDirectory = resolve(scriptDirectory, '..');
const runtimeDirectory = resolve(centralDirectory, '.runtime');
const registryPath = resolve(runtimeDirectory, 'dev-lan.json');
const workerPath = resolve(scriptDirectory, 'dev-lan-worker.mjs');

try {
  await readFile(registryPath, 'utf8');
  console.error(
    'Uma execução de desenvolvimento já foi registrada. Execute npm run dev:stop antes de iniciar outra.',
  );
  process.exitCode = 1;
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

if (!process.exitCode) {
  const token = randomUUID();
  const workers = [
    ['api', '@autohome/api'],
    ['web', '@autohome/web'],
  ].map(([name, workspace]) => ({
    name,
    process: spawn(process.execPath, [workerPath, workspace, token], {
      cwd: centralDirectory,
      stdio: 'inherit',
    }),
  }));

  await mkdir(runtimeDirectory, { recursive: true });
  await writeFile(
    registryPath,
    JSON.stringify({
      token,
      startedAt: new Date().toISOString(),
      workers: workers.map(({ name, process: child }) => ({ name, pid: child.pid })),
    }),
    'utf8',
  );

  let stopping = false;
  const stopWorkers = (exitCode) => {
    if (stopping) return;
    stopping = true;
    for (const { process: child } of workers) {
      if (child.exitCode !== null || !child.pid) continue;
      if (process.platform === 'win32') {
        spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      } else {
        child.kill('SIGTERM');
      }
    }
    process.exitCode = exitCode;
  };

  process.on('SIGINT', () => stopWorkers(0));
  process.on('SIGTERM', () => stopWorkers(0));
  for (const { process: child } of workers) {
    child.on('exit', (code) => {
      if (!stopping) stopWorkers(code ?? 1);
    });
  }

  await Promise.all(
    workers.map(
      ({ process: child }) => new Promise((resolveExit) => child.once('exit', resolveExit)),
    ),
  );
  await rm(registryPath, { force: true });
}
