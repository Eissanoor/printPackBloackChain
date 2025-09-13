import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if ganache-accounts.json exists
const accountsPath = path.join(__dirname, '../ganache-accounts.json');
const envPath = path.join(__dirname, '../.env.local');

try {
  if (fs.existsSync(accountsPath)) {
    // Read the accounts file
    const accountsData = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
    
    // Create .env.local file with Ganache account
    const envContent = `# Local Blockchain Configuration
BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_PRIVATE_KEY=${accountsData.privateKey}
CONTRACT_ADDRESS=
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_NETWORK=local
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log(`Created .env.local file with Ganache account: ${accountsData.firstAccount}`);
    console.log(`Private key: ${accountsData.privateKey}`);
    console.log(`\nTo use this configuration, run:`);
    console.log(`cp .env.local .env`);
    console.log(`npm run deploy:local`);
  } else {
    console.error('ganache-accounts.json not found. Please run "npm run ganache" first.');
  }
} catch (error) {
  console.error('Error setting up local environment:', error);
}
