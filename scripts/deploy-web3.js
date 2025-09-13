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
    const web3 = new Web3(rpcUrl);
    
    // Get the private key from environment
    const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('Private key not found in environment variables');
    }
    
    // Add the private key to the wallet
    const account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey);
    web3.eth.accounts.wallet.add(account);
    
    console.log(`Using account: ${account.address}`);
    
    // Check account balance
    const balance = await web3.eth.getBalance(account.address);
    console.log(`Account balance: ${web3.utils.fromWei(balance, 'ether')} ETH`);
    
    if (web3.utils.toBN(balance).isZero()) {
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
    
    // Estimate gas
    const gasEstimate = await contract.deploy({
      data: '0x' + bytecode
    }).estimateGas({ from: account.address });
    
    console.log(`Estimated gas: ${gasEstimate}`);
    
    // Deploy the contract
    console.log('Deploying contract...');
    const deployTx = contract.deploy({
      data: '0x' + bytecode
    });
    
    const deployedContract = await deployTx.send({
      from: account.address,
      gas: Math.floor(gasEstimate * 1.2), // Add 20% buffer
      gasPrice: await web3.eth.getGasPrice()
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
