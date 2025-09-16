import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Run a command and return a promise
function runCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command}`);
    
    exec(command, { ...options, cwd: rootDir }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        console.error(`stderr: ${stderr}`);
        reject(error);
        return;
      }
      
      console.log(stdout);
      resolve(stdout);
    });
  });
}

// Start Ganache as a background process
function startGanache() {
  console.log('Starting Ganache...');
  
  const isWindows = process.platform === 'win32';
  
  const ganacheProcess = spawn('node', ['scripts/start-ganache.js'], {
    cwd: rootDir,
    stdio: 'inherit',
    detached: !isWindows, // Only detach on non-Windows platforms
    shell: isWindows // Use shell on Windows
  });
  
  if (!isWindows) {
    // Don't wait for the child process to exit (only on non-Windows)
    ganacheProcess.unref();
  }
  
  return new Promise(resolve => {
    // Give Ganache some time to start up
    setTimeout(() => {
      console.log('Ganache started successfully');
      resolve();
    }, 5000); // Increased timeout for slower systems
  });
}

// Run the entire setup and deployment process
async function runAll() {
  try {
    console.log('Starting complete setup and deployment process...');
    
    // Setup environment
    createDirectories();
    createEnvFile();
    
    // Start Ganache
    await startGanache();
    
    // Compile contract
    await runCommand('npm run compile');
    
    // Deploy contract
    await runCommand('node scripts/deploy-simple.js');
    
    // Start application
    console.log('Starting application...');
    const appProcess = spawn('npm', ['run', 'dev'], {
      cwd: rootDir,
      stdio: 'inherit'
    });
    
    appProcess.on('close', (code) => {
      console.log(`Application exited with code ${code}`);
      process.exit(code);
    });
    
  } catch (error) {
    console.error('Setup and deployment failed:', error);
    process.exit(1);
  }
}

// Run the complete process
runAll();
