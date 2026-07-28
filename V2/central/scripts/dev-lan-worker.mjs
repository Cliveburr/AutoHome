import { spawn, spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [workspace, token] = process.argv.slice(2);
if ((workspace !== '@autohome/api' && workspace !== '@autohome/web') || !token) {
  throw new Error('Worker LAN inválido.');
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const centralDirectory = resolve(scriptDirectory, '..');
const command =
  workspace === '@autohome/api'
    ? {
        args: [
          '--require',
          resolve(centralDirectory, 'scripts', 'tsx-windows-preload.cjs'),
          resolve(centralDirectory, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
          'watch',
          'src/main.ts',
        ],
        cwd: resolve(centralDirectory, 'api'),
        env: { ...process.env, AUTOHOME_HTTP_HOST: '0.0.0.0' },
      }
    : {
        args: [
          resolve(centralDirectory, 'node_modules', 'vite', 'bin', 'vite.js'),
          '--host',
          '0.0.0.0',
          '--port',
          '5173',
        ],
        cwd: resolve(centralDirectory, 'web'),
        env: process.env,
      };

const child = spawn(process.execPath, command.args, {
  cwd: command.cwd,
  env: command.env,
  stdio: 'inherit',
});

let stopping = false;
function stopChild() {
  if (stopping) return;
  stopping = true;
  if (child.exitCode === null && child.pid) {
    if (process.platform === 'win32') {
      spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  }
}

process.on('SIGINT', stopChild);
process.on('SIGTERM', stopChild);
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
