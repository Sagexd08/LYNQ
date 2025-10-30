#!/usr/bin/env node


import { execSync } from 'node:child_process';

const args = process.argv.slice(2);
const networkIdx = args.indexOf('--network');
const network = networkIdx >= 0 ? args[networkIdx + 1] : 'testnet';

try {
  console.log(`[Flow] Deploying contracts to ${network}...`);
  execSync(`flow deploy --network ${network}`, { stdio: 'inherit' });
  console.log('[Flow] Deployment finished.');
} catch {
  console.error('[Flow] Deployment failed');
  process.exit(1);
}


