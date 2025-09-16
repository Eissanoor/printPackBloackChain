import Web3 from 'web3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Contract source and ABI paths
const contractPath = path.join(__dirname, '..', 'src', 'contracts', 'PrintPackSync.json');

// Check if contract exists
if (!fs.existsSync(contractPath)) {
  console.error(`Contract file not found at: ${contractPath}`);
  process.exit(1);
}

// Read contract data
const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const { abi, bytecode } = contractData;

// Connect to local blockchain
const web3 = new Web3(process.env.WEB3_PROVIDER_URL || 'http://localhost:8545');

// Address storage path
const addressPath = path.join(__dirname, '..', 'src', 'contracts', 'contract-address.json');

async function deployContract() {
  try {
    console.log('Connecting to blockchain...');
    
    // Get accounts
    const accounts = await web3.eth.getAccounts();
    console.log(`Found ${accounts.length} accounts`);
    
    // Check if contract is already deployed
    if (fs.existsSync(addressPath)) {
      const addressData = JSON.parse(fs.readFileSync(addressPath, 'utf8'));
      
      // Check if contract exists at the stored address
      try {
        const code = await web3.eth.getCode(addressData.address);
        if (code !== '0x') {
          console.log(`Contract already deployed at: ${addressData.address}`);
          return addressData.address;
        } else {
          console.log('Stored contract address has no code, redeploying...');
        }
      } catch (error) {
        console.log('Error checking contract code, redeploying...');
      }
    }
    
    console.log('Deploying PrintPackSync contract...');
    
    // Create contract instance
    const PrintPackSync = new web3.eth.Contract(abi);
    
    // Deploy contract
    const deployTx = PrintPackSync.deploy({
      data: bytecode,
      arguments: []
    });
    
    // Estimate gas
    const gas = await deployTx.estimateGas({ from: accounts[0] });
    
    // Send transaction
    const contract = await deployTx.send({
      from: accounts[0],
      gas: Math.floor(gas * 1.2) // Add 20% buffer
    });
    
    const contractAddress = contract.options.address;
    console.log(`Contract deployed at: ${contractAddress}`);
    
    // Save contract address
    const addressData = {
      address: contractAddress,
      network: await web3.eth.net.getId(),
      deployer: accounts[0],
      deployedAt: new Date().toISOString()
    };
    
    // Ensure directory exists
    const contractsDir = path.join(__dirname, '..', 'src', 'contracts');
    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir, { recursive: true });
    }
    
    fs.writeFileSync(addressPath, JSON.stringify(addressData, null, 2));
    console.log('Contract address saved to:', addressPath);
    
    return contractAddress;
  } catch (error) {
    console.error('Error deploying contract:', error);
    process.exit(1);
  }
}

// Execute deployment
deployContract()
  .then(() => {
    console.log('Deployment completed successfully');
    // Don't exit process if this script is imported
    if (require.main === module) {
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });

export default deployContract;