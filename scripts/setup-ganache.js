/**
 * Script to set up Ganache with the contract deployed
 * This provides a free local blockchain for development
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get current file path (ES module equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to store Ganache configuration
const ganacheEnvPath = path.join(__dirname, '..', '.env.ganache');

/**
 * Start Ganache server
 */
async function startGanache() {
  console.log('Starting Ganache server...');
  
  return new Promise((resolve, reject) => {
    // Start Ganache with predefined accounts
    const ganache = spawn('npx', ['ganache', '--deterministic'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let output = '';
    
    ganache.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      console.log(chunk);
      
      // Check if Ganache is ready
      if (chunk.includes('Listening on')) {
        console.log('Ganache server started successfully!');
        
        // Extract the first private key
        const privateKeyMatch = output.match(/Private Keys\s+\(\d+\)\s+===============\s+(0x[a-f0-9]+)/i);
        const privateKey = privateKeyMatch ? privateKeyMatch[1] : '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
        
        resolve({
          process: ganache,
          privateKey
        });
      }
    });
    
    ganache.stderr.on('data', (data) => {
      console.error(`Ganache error: ${data}`);
    });
    
    ganache.on('error', (error) => {
      console.error('Failed to start Ganache:', error);
      reject(error);
    });
    
    ganache.on('close', (code) => {
      if (code !== 0) {
        console.error(`Ganache process exited with code ${code}`);
        reject(new Error(`Ganache process exited with code ${code}`));
      }
    });
  });
}

/**
 * Deploy contract to Ganache
 */
async function deployContract(privateKey) {
  console.log('Deploying contract to Ganache...');
  
  return new Promise((resolve, reject) => {
    // Run the deploy script
    const deploy = spawn('node', ['scripts/deploy-web3.js', '--network', 'ganache'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        BLOCKCHAIN_RPC_URL: 'http://localhost:8545',
        BLOCKCHAIN_PRIVATE_KEY: privateKey,
        BLOCKCHAIN_NETWORK: 'ganache'
      }
    });
    
    let output = '';
    
    deploy.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      console.log(chunk);
      
      // Check if deployment is successful
      if (chunk.includes('Contract deployed at:')) {
        // Extract contract address
        const addressMatch = chunk.match(/Contract deployed at:\s+([0-9a-fA-Fx]+)/);
        const contractAddress = addressMatch ? addressMatch[1] : null;
        
        if (contractAddress) {
          console.log(`Contract deployed successfully at ${contractAddress}`);
          resolve(contractAddress);
        } else {
          reject(new Error('Failed to extract contract address from output'));
        }
      }
    });
    
    deploy.stderr.on('data', (data) => {
      console.error(`Deployment error: ${data}`);
    });
    
    deploy.on('error', (error) => {
      console.error('Failed to deploy contract:', error);
      reject(error);
    });
    
    deploy.on('close', (code) => {
      if (code !== 0) {
        console.error(`Deployment process exited with code ${code}`);
        reject(new Error(`Deployment process exited with code ${code}`));
      } else if (!output.includes('Contract deployed at:')) {
        // If we get here without finding the contract address, use a default one
        // This is a common address for the first contract deployed on Ganache
        const defaultAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
        console.log(`Using default contract address: ${defaultAddress}`);
        resolve(defaultAddress);
      }
    });
  });
}

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

# Network Configuration
BLOCKCHAIN_NETWORK=ganache

# API Key for authentication
API_KEY=print-pack-blockchain-api-key
`;

  fs.writeFileSync(ganacheEnvPath, envContent);
  console.log(`Ganache environment file created at ${ganacheEnvPath}`);
  console.log('\nTo use Ganache for development:');
  console.log('1. Copy the contents of .env.ganache to your .env file');
  console.log('2. Start your API server with npm start');
  console.log('3. You can now use the API with the local Ganache blockchain');
  console.log('\nIMPORTANT: Keep this terminal window open to keep Ganache running!');
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Setting up Ganache with contract deployment...');
    
    // Start Ganache
    const { process: ganacheProcess, privateKey } = await startGanache();
    
    // Deploy contract
    const contractAddress = await deployContract(privateKey);
    
    // Create environment file
    createGanacheEnv(privateKey, contractAddress);
    
    // Keep Ganache running
    console.log('\nGanache is running. Press Ctrl+C to stop.');
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log('Stopping Ganache...');
      ganacheProcess.kill();
      process.exit();
    });
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
