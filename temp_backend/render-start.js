const path = require('path');
const { spawn } = require('child_process');

const backendDir = path.join(
  __dirname,
  '..',
  'BACKEND PARA VER SE É UTIL PARA RESOLVER O PROBLEMA DO PIX',
  'backend'
);

const entry = path.join(backendDir, 'index.js');
const child = spawn(process.execPath, [entry], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_PATH: [process.env.NODE_PATH, backendDir].filter(Boolean).join(path.delimiter)
  },
  cwd: backendDir
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code || 0);
  }
});
