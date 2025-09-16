import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import solc from 'solc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the contract source file
const contractPath = path.join(__dirname, '..', 'src', 'contracts', 'PrintPackSync.sol');
const outputPath = path.join(__dirname, '..', 'src', 'contracts', 'PrintPackSync.json');

// Read the contract source code
const contractSource = fs.readFileSync(contractPath, 'utf8');

// Prepare input for solc compiler
const input = {
  language: 'Solidity',
  sources: {
    'PrintPackSync.sol': {
      content: contractSource
    }
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['*']
      }
    },
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};

console.log('Compiling contract...');

try {
  // Compile the contract
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  
  // Check for errors
  if (output.errors) {
    output.errors.forEach(error => {
      console.error(error.formattedMessage);
    });
    
    // Only exit if there are severe errors
    if (output.errors.some(error => error.severity === 'error')) {
      console.error('Compilation failed due to errors');
      process.exit(1);
    }
  }
  
  // Get contract data
  const contractOutput = output.contracts['PrintPackSync.sol'].PrintPackSync;
  
  // Create contract JSON
  const contractJson = {
    contractName: 'PrintPackSync',
    abi: contractOutput.abi,
    bytecode: contractOutput.evm.bytecode.object,
    deployedBytecode: contractOutput.evm.deployedBytecode.object,
    compiler: {
      name: 'solc',
      version: solc.version()
    },
    compiledAt: new Date().toISOString()
  };
  
  // Ensure directory exists
  const contractsDir = path.join(__dirname, '..', 'src', 'contracts');
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  
  // Write output to file
  fs.writeFileSync(outputPath, JSON.stringify(contractJson, null, 2));
  
  console.log(`Contract compiled successfully and saved to: ${outputPath}`);
} catch (error) {
  console.error('Compilation error:', error);
  process.exit(1);
}
