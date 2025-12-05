#!/usr/bin/env node

/**
 * Start production server with environment variables loaded from .env
 * This script loads .env files before starting the production server
 */

import { config } from 'dotenv';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Load environment variables from .env file
config({ path: join(rootDir, '.env') });

console.log('🔧 Environment variables loaded from .env file');
console.log('');

// Start the Next.js production server
const child = spawn('npm', ['run', 'start'], {
  stdio: 'inherit',
  shell: true,
  cwd: rootDir,
  env: { ...process.env }
});

child.on('exit', (code) => {
  process.exit(code);
});
