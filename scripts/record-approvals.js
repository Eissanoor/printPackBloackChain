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
 * Record approvals on the blockchain
 */
async function recordApprovals() {
  try {
    console.log('Loading contract ABI...');
    const abiPath = path.join(__dirname, '../src/abis/PrintPackSyncApproval.json');
    const contractABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    
    console.log('Connecting to Ganache...');
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545';
    const web3 = new Web3(rpcUrl);
    
    // Get the contract address from .env
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error('CONTRACT_ADDRESS not found in .env file');
    }
    
    console.log(`Using contract at address: ${contractAddress}`);
    
    // Create contract instance
    const contract = new web3.eth.Contract(contractABI, contractAddress);
    
    // Get accounts
    const accounts = await web3.eth.getAccounts();
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts available in Ganache');
    }
    
    const account = accounts[0];
    console.log(`Using account: ${account}`);
    
    // Check account balance
    const balance = await web3.eth.getBalance(account);
    const balanceInEth = web3.utils.fromWei(balance, 'ether');
    console.log(`Account balance: ${balanceInEth} ETH`);
    
    // Record approvals
    console.log('Recording approvals...');
    
    for (const approval of sampleApprovals) {
      try {
        console.log(`Recording approval: ${approval.approvalId}`);
        
        // Call the recordApproval function with a higher gas limit
        const tx = await contract.methods.recordApproval(
          approval.approvalId,
          approval.requestId,
          approval.requesterId,
          approval.ownerId,
          approval.requestType,
          approval.licenceKey
        ).send({
          from: account,
          gas: 3000000 // Use a much higher gas limit
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
    
    console.log('Recording approvals complete!');
  } catch (error) {
    console.error('Error recording approvals:', error);
  }
}

// Run the main function
recordApprovals().catch(console.error);
