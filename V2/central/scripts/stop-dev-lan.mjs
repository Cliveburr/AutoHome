import { readFile, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const registryPath = resolve(scriptDirectory, '..', '.runtime', 'dev-lan.json');

let registry;
try {
  registry = JSON.parse(await readFile(registryPath, 'utf8'));
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('Nenhuma execução LAN registrada.');
    process.exit(0);
  }
  throw error;
}

if (!Array.isArray(registry.workers) || typeof registry.token !== 'string') {
  throw new Error('Registro LAN inválido; nenhum processo foi encerrado.');
}

function commandLineFor(pid) {
  if (process.platform !== 'win32') return '';
  return execFileSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-Command',
      `(Get-CimInstance Win32_Process -Filter \"ProcessId = ${pid}\").CommandLine`,
    ],
    {
      encoding: 'utf8',
    },
  ).trim();
}

const failures = [];
for (const worker of registry.workers) {
  const pid = Number(worker.pid);
  if (!Number.isSafeInteger(pid) || pid < 1) {
    failures.push(`PID inválido para ${worker.name ?? 'worker'}`);
    continue;
  }

  const commandLine = commandLineFor(pid);
  if (!commandLine) continue;
  if (!commandLine.includes('dev-lan-worker.mjs') || !commandLine.includes(registry.token)) {
    failures.push(`O PID ${pid} não corresponde à execução LAN registrada; ele não foi encerrado.`);
    continue;
  }

  const result =
    process.platform === 'win32'
      ? spawnSync('taskkill.exe', ['/PID', String(pid), '/T', '/F'], { encoding: 'utf8' })
      : spawnSync('kill', ['-TERM', String(pid)], { encoding: 'utf8' });
  if (result.status !== 0) failures.push(`Não foi possível encerrar o PID ${pid}.`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  await rm(registryPath, { force: true });
  console.log('Execução LAN encerrada.');
}
