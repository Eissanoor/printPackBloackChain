import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Web3 from 'web3';
import solc from 'solc';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Set up file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contractPath = path.resolve(__dirname, '../contracts/PrintPackSyncApproval.sol');
const contractSource = fs.readFileSync(contractPath, 'utf8');

async function compileContract() {
  console.log('Compiling contract...');
  
  // Prepare input for solc compiler
  const input = {
    language: 'Solidity',
    sources: {
      'PrintPackSyncApproval.sol': {
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

  // Compile the contract
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  
  // Check for errors
  if (output.errors) {
    output.errors.forEach(error => {
      console.error(error.formattedMessage);
    });
    
    if (output.errors.some(error => error.severity === 'error')) {
      throw new Error('Compilation failed');
    }
  }
  
  // Get contract data
  const contractOutput = output.contracts['PrintPackSyncApproval.sol']['PrintPackSyncApproval'];
  
  return {
    abi: contractOutput.abi,
    bytecode: contractOutput.evm.bytecode.object
  };
}

async function deployContract() {
  try {
    // Connect to the blockchain
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545';
    
    // Initialize Web3 with provider
    const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
    
    // Get the private key from environment
    const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('Private key not found in environment variables');
    }
    
    // Add the private key to the wallet (ensure it has 0x prefix)
    const privateKeyWithPrefix = privateKey.startsWith('0x') ? privateKey : '0x' + privateKey;
    const account = web3.eth.accounts.privateKeyToAccount(privateKeyWithPrefix);
    web3.eth.accounts.wallet.add(account);
    
    console.log(`Using account: ${account.address}`);
    
    // Check account balance
    const balance = await web3.eth.getBalance(account.address);
    // Convert Wei to ETH
    const balanceInEth = Number(balance) / 1e18;
    console.log(`Account balance: ${balanceInEth} ETH`);
    
    // Check if balance is zero (in Web3.js v4, we can compare directly)
    if (balance === '0' || balance === 0 || balance === '0x0') {
      throw new Error('Account has no ETH. Please fund your account before deploying.');
    }
    
    // Compile the contract
    const { abi, bytecode } = await compileContract();
    
    // Save ABI to a file
    const abiDir = path.resolve(__dirname, '../src/abis');
    if (!fs.existsSync(abiDir)) {
      fs.mkdirSync(abiDir, { recursive: true });
    }
    fs.writeFileSync(path.join(abiDir, 'PrintPackSyncApproval.json'), JSON.stringify(abi, null, 2));
    console.log('ABI saved to src/abis/PrintPackSyncApproval.json');
    
    // Create contract instance
    const contract = new web3.eth.Contract(abi);
    
    // Prepare the contract deployment data
    const deployData = contract.deploy({
      data: bytecode.startsWith('0x') ? bytecode : '0x' + bytecode
    });
    
    // Get gas price
    const gasPrice = await web3.eth.getGasPrice();
    console.log(`Current gas price: ${gasPrice.toString()} wei`);
    
    // Estimate gas
    console.log('Estimating gas...');
    let gasEstimate;
    try {
      gasEstimate = await deployData.estimateGas({ from: account.address });
      console.log(`Estimated gas: ${gasEstimate}`);
    } catch (error) {
      console.warn('Gas estimation failed, using default:', error.message);
      gasEstimate = 3000000; // Default gas limit
      console.log(`Using default gas: ${gasEstimate}`);
    }
    
    // Deploy the contract
    console.log('Deploying contract...');
    
    // Add 20% buffer to gas estimate
    // Convert to number first to avoid BigInt mixing issues
    const gasEstimateNum = Number(gasEstimate);
    const gasLimit = Math.floor(gasEstimateNum * 1.2);
    
    // Create and send the deployment transaction
    const deployedContract = await deployData.send({
      from: account.address,
      gas: gasLimit,
      gasPrice: gasPrice
    });
    
    console.log(`Contract deployed at: ${deployedContract.options.address}`);
    
    // Update .env file with contract address
    const envPath = path.resolve(__dirname, '../.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('CONTRACT_ADDRESS=')) {
      envContent = envContent.replace(/CONTRACT_ADDRESS=.*/, `CONTRACT_ADDRESS=${deployedContract.options.address}`);
    } else {
      envContent += `\nCONTRACT_ADDRESS=${deployedContract.options.address}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('Updated CONTRACT_ADDRESS in .env file');
    
    return {
      address: deployedContract.options.address,
      abi
    };
  } catch (error) {
    console.error('Deployment failed:', error);
    throw error;
  }
}

// Run the deployment
deployContract()
  .then(() => {
    console.log('Deployment completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });
