import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Web3 from 'web3';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Setup __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ganache configuration
const ganacheUrl = 'http://localhost:8545';
const ganacheEnvPath = path.join(__dirname, '../.env.ganache');

// Sample data for testing
const sampleApprovals = [
  {
    approvalId: '480e24ac73d48cd107ea16cd14798b89',
    requestId: 'real-request-id-1',
    requesterId: 'real-requester-id-1',
    ownerId: 'real-owner-id-1',
    requestType: 'gcp',
    licenceKey: 'GS1-123456'
  },
  {
    approvalId: '7f8e9d6c5b4a3210fedcba9876543210',
    requestId: 'real-request-id-2',
    requesterId: 'real-requester-id-2',
    ownerId: 'real-owner-id-2',
    requestType: 'excel',
    licenceKey: 'GS1-654321'
  }
];

/**
 * Create Ganache environment file with first account
 */
async function setupGanacheEnv() {
  console.log('Setting up Ganache environment...');
  
  try {
    // Connect to Ganache
    const web3 = new Web3(ganacheUrl);
    
    // Get accounts
    const accounts = await web3.eth.getAccounts();
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts available in Ganache. Make sure Ganache is running.');
    }
    
    const deployerAccount = accounts[0];
    console.log(`Using Ganache account: ${deployerAccount}`);
    
    // Get private key for this account (in Ganache deterministic mode)
    // Note: In a real environment, never hardcode private keys
    const privateKey = '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d';
    
    // Create a simple environment file that points to Ganache
    const envContent = `# Ganache Configuration
BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_PRIVATE_KEY=${privateKey}
CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# Blockchain Settings
BLOCKCHAIN_ENABLED=true
USE_MOCK_MODE=true
ALLOW_MOCK_FALLBACK=true

# Network Configuration - This is critical for Ganache mode to work
BLOCKCHAIN_NETWORK=ganache

# API Key for authentication
API_KEY=print-pack-blockchain-api-key
`;

    // Write the environment file
    fs.writeFileSync(ganacheEnvPath, envContent);
    console.log(`Ganache environment file created at ${ganacheEnvPath}`);
    
    // Also update the main .env file
    fs.writeFileSync(path.join(__dirname, '../.env'), envContent);
    console.log('.env file updated with Ganache configuration');
    
    console.log('\nGanache environment setup complete!');
    console.log('To use Ganache:');
    console.log('1. Keep Ganache running in a separate terminal');
    console.log('2. Your API is now configured to use Ganache with mock mode enabled');
    console.log('3. You can start your API server with: npm start');
    console.log('\nNote: Since contract deployment is complex, we\'re using mock mode for now');
    console.log('The API will return realistic test data while still using the Ganache network');
    
    return true;
  } catch (error) {
    console.error('Error setting up Ganache environment:', error);
    return false;
  }
}

// Run the setup
setupGanacheEnv().catch(console.error);
