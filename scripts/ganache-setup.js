/**
 * Simplified script to set up Ganache environment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get current file path (ES module equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to store Ganache configuration
const ganacheEnvPath = path.join(__dirname, '..', '.env.ganache');

// Default Ganache private key (first account)
const defaultPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

// Default contract address (common first deployment address on Ganache)
const defaultContractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

/**
 * Create Ganache environment file
 */
function createGanacheEnv(privateKey, contractAddress) {
  console.log('Creating Ganache environment file...');
  
  const envContent = `# Ganache Configuration
BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_PRIVATE_KEY=${privateKey}
CONTRACT_ADDRESS=${contractAddress}

# Blockchain Settings
BLOCKCHAIN_ENABLED=true
USE_MOCK_MODE=false
ALLOW_MOCK_FALLBACK=false

# Network Configuration - This is critical for Ganache mode to work
BLOCKCHAIN_NETWORK=ganache

# API Key for authentication
API_KEY=print-pack-blockchain-api-key
`;

  fs.writeFileSync(ganacheEnvPath, envContent);
  console.log(`Ganache environment file created at ${ganacheEnvPath}`);
}

/**
 * Copy Ganache environment to .env file
 */
function updateEnvFile() {
  try {
    const envContent = fs.readFileSync(ganacheEnvPath, 'utf8');
    fs.writeFileSync(path.join(__dirname, '..', '.env'), envContent);
    console.log('.env file updated with Ganache configuration');
  } catch (error) {
    console.error('Error updating .env file:', error);
  }
}

/**
 * Main function
 */
function main() {
  console.log('Setting up Ganache environment...');
  
  try {
    // Create environment file
    createGanacheEnv(defaultPrivateKey, defaultContractAddress);
    
    // Copy to .env
    updateEnvFile();
    
    console.log('\nGanache environment setup complete!');
    console.log('\nTo use Ganache:');
    console.log('1. In a separate terminal, run: npx ganache --deterministic');
    console.log('2. Your API is now configured to use the local Ganache blockchain');
    console.log('3. You can start your API server with: npm start');
    
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
