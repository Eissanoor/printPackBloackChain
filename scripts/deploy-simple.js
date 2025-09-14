import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Web3 from 'web3';
import dotenv from 'dotenv';
import solc from 'solc';

// Load environment variables
dotenv.config();

// Setup __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ganache configuration
const ganacheUrl = 'http://localhost:8545';
const ganacheEnvPath = path.join(__dirname, '../.env.ganache');

// Sample data for seeding
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
 * Compile Solidity contract
 */
function compileContract() {
  console.log('Reading contract source...');
  const contractPath = path.join(__dirname, '../contracts/SimpleApproval.sol');
  const contractSource = fs.readFileSync(contractPath, 'utf8');
  
  console.log('Compiling contract...');
  
  const input = {
    language: 'Solidity',
    sources: {
      'SimpleApproval.sol': {
        content: contractSource
      }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['*']
        }
      }
    }
  };
  
  try {
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    
    if (output.errors) {
      // Log warnings
      const warnings = output.errors.filter(error => error.severity === 'warning');
      if (warnings.length > 0) {
        console.log('Compilation warnings:');
        warnings.forEach(warning => console.log(warning.formattedMessage));
      }
      
      // Check for errors
      const errors = output.errors.filter(error => error.severity === 'error');
      if (errors.length > 0) {
        console.error('Compilation errors:');
        errors.forEach(error => console.error(error.formattedMessage));
        throw new Error('Contract compilation failed');
      }
    }
    
    const contract = output.contracts['SimpleApproval.sol']['SimpleApproval'];
    
    // Save ABI to file for later use
    const abiDir = path.join(__dirname, '../src/abis');
    if (!fs.existsSync(abiDir)) {
      fs.mkdirSync(abiDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(abiDir, 'SimpleApproval.json'),
      JSON.stringify(contract.abi, null, 2)
    );
    
    console.log('Contract compiled successfully');
    return {
      abi: contract.abi,
      bytecode: contract.evm.bytecode.object
    };
  } catch (error) {
    console.error('Error compiling contract:', error);
    throw error;
  }
}

/**
 * Deploy contract to Ganache
 */
async function deployContract() {
  try {
    // Compile the contract first
    const { abi, bytecode } = compileContract();
    
    console.log('Connecting to Ganache...');
    const web3 = new Web3(ganacheUrl);
    
    // Get accounts
    const accounts = await web3.eth.getAccounts();
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts available in Ganache');
    }
    
    const deployerAccount = accounts[0];
    console.log(`Using account ${deployerAccount} for deployment`);
    
    // Check account balance
    const balance = await web3.eth.getBalance(deployerAccount);
    const balanceInEth = web3.utils.fromWei(balance, 'ether');
    console.log(`Account balance: ${balanceInEth} ETH`);
    
    // Deploy the contract
    console.log('Deploying contract...');
    const contract = new web3.eth.Contract(abi);
    const deployTx = contract.deploy({
      data: '0x' + bytecode
    });
    
    const gas = await deployTx.estimateGas();
    console.log(`Estimated gas for deployment: ${gas}`);
    
    // Convert BigInt to Number for calculation
    const gasValue = typeof gas === 'bigint' ? Number(gas) : Number(gas);
    const gasWithBuffer = Math.round(gasValue * 1.2); // Add 20% buffer
    
    console.log(`Using gas limit with buffer: ${gasWithBuffer}`);
    
    const deployedContract = await deployTx.send({
      from: deployerAccount,
      gas: gasWithBuffer
    });
    
    console.log(`Contract deployed at address: ${deployedContract.options.address}`);
    
    // Create Ganache environment file
    createGanacheEnv(deployerAccount, deployedContract.options.address);
    
    // Return the deployed contract instance
    return {
      web3,
      contract: deployedContract,
      account: deployerAccount
    };
  } catch (error) {
    console.error('Error deploying contract:', error);
    throw error;
  }
}

/**
 * Create Ganache environment file
 */
function createGanacheEnv(account, contractAddress) {
  console.log('Creating Ganache environment file...');
  
  // Get the private key for the first Ganache account (deterministic mode)
  const privateKey = '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d';
  
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
  
  // Also update the main .env file to use the Ganache configuration
  fs.writeFileSync(path.join(__dirname, '../.env'), envContent);
  console.log('.env file updated with Ganache configuration');
}

/**
 * Seed the contract with sample data
 */
async function seedContract(web3, contract, account) {
  console.log('Seeding contract with sample data...');
  
  for (const approval of sampleApprovals) {
    try {
      console.log(`Recording approval: ${approval.approvalId}`);
      
      // Call the recordApproval function
      const tx = await contract.methods.recordApproval(
        approval.approvalId,
        approval.requestId,
        approval.requesterId,
        approval.ownerId,
        approval.requestType,
        approval.licenceKey
      ).send({
        from: account,
        gas: 500000 // Set a high gas limit for safety
      });
      
      console.log(`Approval recorded successfully, transaction hash: ${tx.transactionHash}`);
    } catch (error) {
      console.error(`Error recording approval ${approval.approvalId}:`, error.message);
      
      // Print more detailed error information
      if (error.receipt) {
        // Convert BigInt to string in the receipt
        const formattedReceipt = JSON.parse(JSON.stringify(error.receipt, (key, value) => 
          typeof value === 'bigint' ? value.toString() : value
        ));
        console.error('Transaction receipt:', JSON.stringify(formattedReceipt, null, 2));
      }
    }
  }
  
  // Verify the data was recorded
  try {
    const totalApprovals = await contract.methods.getTotalApprovals().call();
    console.log(`Total approvals recorded: ${totalApprovals}`);
    
    for (let i = 0; i < totalApprovals; i++) {
      const approvalId = await contract.methods.getApprovalIdByIndex(i).call();
      console.log(`Approval ${i+1}: ${approvalId}`);
      
      const approval = await contract.methods.getApproval(approvalId).call();
      
      // Convert BigInt to string for JSON serialization
      const formattedApproval = Object.fromEntries(
        Object.entries(approval).map(([key, value]) => {
          return [key, typeof value === 'bigint' ? value.toString() : value];
        })
      );
      
      console.log(`Details: ${JSON.stringify(formattedApproval, null, 2)}`);
    }
  } catch (error) {
    console.error('Error verifying data:', error.message);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Starting deployment and seeding process...');
  
  try {
    // Deploy contract
    const { web3, contract, account } = await deployContract();
    
    // Seed contract with data
    await seedContract(web3, contract, account);
    
    console.log('Deployment and seeding complete!');
    console.log('\nGanache environment setup complete!');
    console.log('To use Ganache:');
    console.log('1. Keep Ganache running in a separate terminal');
    console.log('2. Your API is now configured to use the local Ganache blockchain');
    console.log('3. You can start your API server with: npm start');
  } catch (error) {
    console.error('Error in deployment and seeding process:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);
