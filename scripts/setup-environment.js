import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Create .env file if it doesn't exist
function createEnvFile() {
  const envPath = path.join(rootDir, '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('Creating .env file...');
    
    const envContent = `# Blockchain Configuration
WEB3_PROVIDER_URL=http://localhost:8545
BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
WALLET_ENCRYPTION_PASSWORD=printpack-secure-password

# Node Environment
NODE_ENV=development
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('.env file created successfully');
  } else {
    console.log('.env file already exists');
  }
}

// Create directories if they don't exist
function createDirectories() {
  const dirs = [
    path.join(rootDir, 'ganache-data'),
    path.join(rootDir, 'src', 'contracts')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  console.log('Directories created successfully');
}

// Run setup
async function setup() {
  try {
    console.log('Starting setup process...');
    
    // Create necessary directories
    createDirectories();
    
    // Create .env file
    createEnvFile();
    
    console.log('Setup completed successfully!');
    console.log('\nYou can now run the following commands:');
    console.log('1. npm run ganache        (Start Ganache with persistence)');
    console.log('2. npm run deploy-simple  (Compile and deploy the contract)');
    console.log('3. npm run dev            (Start the application)');
    console.log('\nOr run everything with one command:');
    console.log('npm run real-data-mode');
    
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setup();
