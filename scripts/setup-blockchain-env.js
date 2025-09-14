/**
 * Script to set up blockchain environment variables
 * Run this script to ensure your environment variables are properly set
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const envPath = path.join(rootDir, '.env');

// Check if .env file exists
const envExists = fs.existsSync(envPath);

console.log('Checking blockchain environment variables...');

// Create or update .env file
if (!envExists) {
  console.log('No .env file found. Creating one from env.sample...');
  
  // Check if env.sample exists
  const envSamplePath = path.join(rootDir, 'env.sample');
  if (fs.existsSync(envSamplePath)) {
    // Copy env.sample to .env
    fs.copyFileSync(envSamplePath, envPath);
    console.log('Created .env file from env.sample');
  } else {
    // Create minimal .env file
    fs.writeFileSync(envPath, 'BLOCKCHAIN_ENABLED=true\n');
    console.log('Created minimal .env file');
  }
}

// Read current .env file
let envContent = fs.readFileSync(envPath, 'utf8');

// Check if BLOCKCHAIN_ENABLED is set
if (!envContent.includes('BLOCKCHAIN_ENABLED=')) {
  console.log('Adding BLOCKCHAIN_ENABLED=true to .env file');
  envContent += '\nBLOCKCHAIN_ENABLED=true\n';
  fs.writeFileSync(envPath, envContent);
}

// Update BLOCKCHAIN_ENABLED if it's not set to true
if (envContent.includes('BLOCKCHAIN_ENABLED=false')) {
  console.log('Updating BLOCKCHAIN_ENABLED from false to true');
  envContent = envContent.replace('BLOCKCHAIN_ENABLED=false', 'BLOCKCHAIN_ENABLED=true');
  fs.writeFileSync(envPath, envContent);
}

// Reload environment variables
dotenv.config();

// Verify environment variables
console.log('\nCurrent blockchain environment variables:');
console.log('BLOCKCHAIN_ENABLED:', process.env.BLOCKCHAIN_ENABLED || 'Not set (defaults to enabled)');
console.log('BLOCKCHAIN_RPC_URL:', process.env.BLOCKCHAIN_RPC_URL || 'Not set');
console.log('CONTRACT_ADDRESS:', process.env.CONTRACT_ADDRESS || 'Not set');
console.log('BLOCKCHAIN_NETWORK:', process.env.BLOCKCHAIN_NETWORK || 'Not set');

console.log('\nBlockchain integration is now', 
  process.env.BLOCKCHAIN_ENABLED === 'false' ? 'DISABLED' : 'ENABLED');

console.log('\nTo change these settings, edit your .env file or run:');
console.log('echo "BLOCKCHAIN_ENABLED=true" >> .env');
