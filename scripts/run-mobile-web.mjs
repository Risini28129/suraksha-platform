import { spawn } from 'node:child_process';
const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['run', 'start', '-w', '@suraksha/mobile', '--', '--web', '--localhost', '--port', '8083'], {
    stdio: 'inherit', shell: process.platform === 'win32',
    env: { ...process.env, SURAKSHA_WEB_PREVIEW: '1', EXPO_PUBLIC_API_URL: 'http://localhost:8083/v1' },
  });
child.on('exit', (code) => process.exit(code ?? 1));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
