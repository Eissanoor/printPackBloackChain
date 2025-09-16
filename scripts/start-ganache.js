import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '..', 'ganache-data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log(`Starting Ganache with persistent data in: ${dataDir}`);

// Determine the correct command for the OS
const isWindows = process.platform === 'win32';
const command = isWindows ? 'npx.cmd' : 'npx';

// Start Ganache with persistence
const ganache = spawn(command, [
  'ganache',
  '--db', dataDir,
  '--deterministic',  // Use deterministic addresses
  '--networkId', '1337',  // Use consistent network ID
  '--chain.chainId', '1337',  // Use consistent chain ID
  '--wallet.totalAccounts', '10',  // Create 10 accounts
  '--wallet.defaultBalance', '1000',  // Each with 1000 ETH
  '--miner.blockTime', '0',  // Instant mining (0) or set to a number of seconds
  '--server.host', '0.0.0.0',  // Listen on all interfaces
  '--server.port', '8545'  // Default port
], {
  stdio: 'inherit',
  shell: isWindows // Use shell on Windows
});

ganache.on('close', (code) => {
  console.log(`Ganache exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  ganache.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  ganache.kill();
  process.exit();
});