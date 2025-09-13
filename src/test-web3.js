import Web3BlockchainService from './services/web3BlockchainService.js';
import { generateApprovalId } from './utils/idGenerator.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Test the Web3 blockchain integration (mock or real)
 */
const testBlockchainIntegration = async () => {
  try {
    console.log('Testing blockchain integration...');
    
    // Check if blockchain is enabled
    if (process.env.BLOCKCHAIN_ENABLED !== 'true') {
      console.error('BLOCKCHAIN_ENABLED is not set to true in .env file');
      console.log('Please set BLOCKCHAIN_ENABLED=true in your .env file');
      return;
    }
    
    console.log('Using contract address:', process.env.CONTRACT_ADDRESS || 'Not set (mock mode will work anyway)');
    
    // Create blockchain service instance
    const blockchainService = new Web3BlockchainService();
    
    // Use a fixed approvalId for testing to match the mock implementation
    const testData = {
      approvalId: '480e24ac73d48cd107ea16cd14798b89', // Fixed ID that matches our mock implementation
      requestId: 'test-request-id',
      requesterId: 'test-requester-id',
      ownerId: 'test-owner-id',
      requestType: 'gcp',
      licenceKey: 'test-licence-key'
    };
    
    console.log('Test data:', testData);
    
    // Record test approval
    console.log('Recording test approval on blockchain...');
    const recordResult = await blockchainService.recordSyncApproval(testData);
    
    if (recordResult.success) {
      console.log('Test approval recorded successfully!');
      console.log('Transaction hash:', recordResult.transactionHash);
      console.log('Block number:', recordResult.blockNumber);
      
      // Get approval details
      console.log('Retrieving approval details...');
      const getResult = await blockchainService.getApproval(testData.approvalId);
      
      if (getResult.success) {
        console.log('Approval details retrieved successfully!');
        console.log('Approval data:', getResult.data);
        
        // Verify data
        console.log('Verifying data...');
        const isValid = 
          getResult.data.requestId === testData.requestId &&
          getResult.data.requesterId === testData.requesterId &&
          getResult.data.ownerId === testData.ownerId &&
          getResult.data.requestType === testData.requestType &&
          getResult.data.licenceKey === testData.licenceKey;
        
        if (isValid) {
          console.log('✅ Test passed! Data verified successfully.');
        } else {
          console.error('❌ Test failed! Data verification failed.');
          console.log('Expected:', testData);
          console.log('Actual:', getResult.data);
        }
        
        // Test deactivation
        console.log('Testing approval deactivation...');
        const deactivateResult = await blockchainService.deactivateApproval(testData.approvalId);
        
        if (deactivateResult.success) {
          console.log('Approval deactivated successfully!');
          
          // Verify deactivation
          const verifyResult = await blockchainService.getApproval(testData.approvalId);
          
          if (verifyResult.success && !verifyResult.data.isActive) {
            console.log('✅ Deactivation test passed! Approval is now inactive.');
          } else {
            console.error('❌ Deactivation test failed! Approval is still active.');
          }
        } else {
          console.error('Failed to deactivate approval:', deactivateResult.error);
        }
      } else {
        console.error('Failed to retrieve approval details:', getResult.error);
      }
    } else {
      console.error('Failed to record test approval:', recordResult.error);
    }
  } catch (error) {
    console.error('Test error:', error);
  }
};

// Run the test
testBlockchainIntegration().catch(error => {
  console.error('Error in test function:', error);
});
