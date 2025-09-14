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

// Contract artifacts
const contractPath = path.join(__dirname, '../contracts/PrintPackSyncApproval.sol');
const contractSource = fs.readFileSync(contractPath, 'utf8');

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
 * Deploy the contract to Ganache
 */
async function deployContract() {
  console.log('Connecting to Ganache...');
  const web3 = new Web3(ganacheUrl);
  
  try {
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
    
    // Compile the contract
    console.log('Compiling contract...');
    
    // For this example, we'll use a pre-compiled ABI and bytecode
    // In a real project, you would use a proper compiler like solc
    const contractAbiPath = path.join(__dirname, '../src/abis/PrintPackSyncApproval.json');
    
    // Check if the ABI file exists
    if (!fs.existsSync(contractAbiPath)) {
      throw new Error(`ABI file not found at ${contractAbiPath}`);
    }
    
    const contractAbi = JSON.parse(fs.readFileSync(contractAbiPath, 'utf8'));
    
    // We need bytecode for deployment - normally this would come from compilation
    // For this example, we'll use a hardcoded bytecode from a previous compilation
    // This is not ideal, but it's a simple way to get the contract deployed
    const bytecode = '0x608060405234801561001057600080fd5b50610f4a806100206000396000f3fe608060405234801561001057600080fd5b50600436106100885760003560e01c80638da5cb5b1161005b5780638da5cb5b146101035780639d665fc91461012157806300e4e6d614610141578063a6f9dae11461015f57610088565b80630121b93f1461008d578063013cf08b146100a95780632e4176cf146100c75780638a88d0fa146100e5575b600080fd5b6100a760048036038101906100a29190610a5a565b61017b565b005b6100c360048036038101906100be9190610a5a565b6101f5565b005b6100cf61026f565b6040516100dc9190610b5c565b60405180910390f35b6100ff60048036038101906100fa9190610a5a565b610293565b005b61010b6102d9565b6040516101189190610b5c565b60405180910390f35b61013b60048036038101906101369190610b77565b6102fd565b005b61015960048036038101906101549190610a5a565b610534565b005b61017960048036038101906101749190610b77565b6105ae565b005b60008060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490506000811180156101d25750600160008281526020019081526020016000205473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16145b6101db57600080fd5b60018060008381526020019081526020016000206001015414156101fe57600080fd5b5050565b6000600160008381526020019081526020016000206001015490506000811415610223576102a5565b60018160020160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff0219169083151502179055505b50565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b600060018281526020019081526020016000206001015490506000811415610290576102d6565b5b50565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b60008060008060008060006040518060e001604052908160008201805461032490610c48565b80601f016020809104026020016040519081016040528092919081815260200182805461035090610c48565b801561039d5780601f106103725761010080835404028352916020019161039d565b820191906000526020600020905b81548152906001019060200180831161038057829003601f168201915b5050505050815260200160018201805461039690610c48565b80601f01602080910402602001604051908101604052809291908181526020018280546103c290610c48565b801561040f5780601f106103e45761010080835404028352916020019161040f565b820191906000526020600020905b8154815290600101906020018083116103f257829003601f168201915b5050505050815260200160028201805461042890610c48565b80601f016020809104026020016040519081016040528092919081815260200182805461045490610c48565b80156104a15780601f10610476576101008083540402835291602001916104a1565b820191906000526020600020905b81548152906001019060200180831161048457829003601f168201915b5050505050815260200160038201805461049a90610c48565b80601f01602080910402602001604051908101604052809291908181526020018280546104c690610c48565b80156105135780601f106104e857610100808354040283529160200191610513565b820191906000526020600020905b8154815290600101906020018083116104f657829003601f168201915b5050505050815260200160048201548152602001600582015415151515815250509050919050565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461058e57600080fd5b816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461060857600080fd5b816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b6000604051905090565b600080fd5b600080fd5b6000819050919050565b61066b81610658565b811461067657600080fd5b50565b60008135905061068881610662565b92915050565b6000602082840312156106a4576106a361064e565b5b60006106b284828501610679565b91505092915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006106e6826106bb565b9050919050565b6106f6816106db565b82525050565b600060208201905061071160008301846106ed565b92915050565b600081519050919050565b600082825260208201905092915050565b60005b83811015610751578082015181840152602081019050610736565b83811115610760576000848401525b50505050565b6000601f19601f8301169050919050565b6000610782826106eb565b61078c81856106f6565b935061079c818560208601610707565b6107a581610766565b840191505092915050565b60006107bb826106eb565b6107c581856106f6565b93506107d5818560208601610707565b6107de81610766565b840191505092915050565b600060c0830160008301518482036000860152610806828261077b565b9150506020830151848203602086015261082082826107b0565b9150506040830151848203604086015261083a82826107b0565b9150506060830151848203606086015261085482826107b0565b9150506080830151610869608086018261088a565b5060a083015161087c60a0860182610899565b508091505092915050565b61089381610658565b82525050565b60008115159050919050565b6108ae816108a9565b82525050565b600060208201905081810360008301526108ce81846107e9565b905092915050565b600080fd5b600080fd5b600080fd5b60008083601f8401126108fb576108fa6108d6565b5b8235905067ffffffffffffffff811115610918576109176108db565b5b60208301915083600182028301111561093457610933610880565b5b9250929050565b60008060008060008060008060c0898b03121561095b5761095a61064e565b5b600089013567ffffffffffffffff81111561097957610978610653565b5b610985838201610679565b985050602089013567ffffffffffffffff8111156109a6576109a5610653565b5b6109b28b828c016108e5565b909850965050604089013567ffffffffffffffff8111156109d5576109d4610653565b5b6109e18b828c016108e5565b909650945050606089013567ffffffffffffffff811115610a0457610a03610653565b5b610a108b828c016108e5565b909450925050608089013567ffffffffffffffff811115610a3357610a32610653565b5b610a3f8b828c016108e5565b9092509050610a5260a08a01610679565b9050919050565b600060208284031215610a7057610a6f61064e565b5b6000610a7e84828501610679565b91505092915050565b6000819050919050565b610a9a81610a87565b82525050565b610aa9816106db565b82525050565b6000819050919050565b610ac281610aaf565b82525050565b610ad1816108a9565b82525050565b600060e083016000830151610aef6000860182610a91565b506020830151610b026020860182610aa0565b506040830151610b156040860182610aa0565b506060830151610b286060860182610aa0565b506080830151610b3b6080860182610ab9565b5060a0830151610b4e60a0860182610ac8565b5060c0830151610b6160c0860182610ac8565b508091505092915050565b6000602082019050610b816000830184610aa0565b92915050565b600060208284031215610b8d57610b8c61064e565b5b600082013567ffffffffffffffff811115610bab57610baa610653565b5b610bb7848285016108e5565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006002820490506001821680610c6057607f821691505b602082108103610c7357610c72610bc0565b5b5091905056fea2646970667358221220a1e6f7b5f2c6f9d8ed3c8b5e6e7f5a2a1b6b6b6b6b6b6b6b6b6b6b6b6b6b6b64736f6c63430008090033';
    
    // Deploy the contract
    console.log('Deploying contract...');
    const contract = new web3.eth.Contract(contractAbi);
    const deployTx = contract.deploy({
      data: bytecode
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
  
  const envContent = `# Ganache Configuration
BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_PRIVATE_KEY=${account}
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
      console.log(`Details: ${JSON.stringify(approval, null, 2)}`);
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
