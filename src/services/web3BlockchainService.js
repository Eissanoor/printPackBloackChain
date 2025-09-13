import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load contract ABI from the file
const abiPath = path.join(__dirname, '../abis/PrintPackSyncApproval.json');
let contractABI;

try {
  if (fs.existsSync(abiPath)) {
    contractABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
  } else {
    // Fallback ABI if file doesn't exist yet
    contractABI = [
      {
        "inputs": [
          { "internalType": "string", "name": "approvalId", "type": "string" },
          { "internalType": "string", "name": "requestId", "type": "string" },
          { "internalType": "string", "name": "requesterId", "type": "string" },
          { "internalType": "string", "name": "ownerId", "type": "string" },
          { "internalType": "string", "name": "requestType", "type": "string" },
          { "internalType": "string", "name": "licenceKey", "type": "string" }
        ],
        "name": "recordApproval",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
  }
} catch (error) {
  console.error('Error loading contract ABI:', error);
}

/**
 * Mock implementation of Web3BlockchainService for development
 * This is a temporary solution until web3 package installation issues are resolved
 */
class Web3BlockchainService {
  constructor() {
    // Read environment variables
    this.rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545';
    this.privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    
    console.log('Web3BlockchainService initialized in mock mode');
    console.log('RPC URL:', this.rpcUrl);
    console.log('Contract Address:', this.contractAddress);
  }
  
  /**
   * Record a sync approval on the blockchain
   * 
   * @param {Object} approvalData - Data for the approval
   * @returns {Promise<Object>} Transaction result
   */
  async recordSyncApproval(approvalData) {
    try {
      console.log('Mock recordSyncApproval called with data:', approvalData);
      
      // Generate a mock transaction hash
      const mockTxHash = '0x' + Buffer.from(JSON.stringify(approvalData)).toString('hex').substring(0, 64);
      
      return {
        success: true,
        transactionHash: mockTxHash,
        blockNumber: Date.now(),
        approvalId: approvalData.approvalId
      };
    } catch (error) {
      console.error('Mock recordSyncApproval error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Deactivate a sync approval on the blockchain
   * 
   * @param {string} approvalId - ID of the approval to deactivate
   * @returns {Promise<Object>} Transaction result
   */
  async deactivateApproval(approvalId) {
    try {
      console.log('Mock deactivateApproval called with ID:', approvalId);
      
      // Generate a mock transaction hash
      const mockTxHash = '0x' + Buffer.from(approvalId).toString('hex').substring(0, 64);
      
      return {
        success: true,
        transactionHash: mockTxHash,
        blockNumber: Date.now(),
        approvalId
      };
    } catch (error) {
      console.error('Mock deactivateApproval error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get approval details from the blockchain
   * 
   * @param {string} approvalId - ID of the approval to retrieve
   * @returns {Promise<Object>} Approval details
   */
  async getApproval(approvalId) {
    try {
      console.log('Mock getApproval called with ID:', approvalId);
      
      // For testing purposes, if the ID starts with 'test-', return test data
      if (approvalId === '480e24ac73d48cd107ea16cd14798b89') {
        return {
          success: true,
          data: {
            requestId: 'test-request-id',
            requesterId: 'test-requester-id',
            ownerId: 'test-owner-id',
            requestType: 'gcp',
            licenceKey: 'test-licence-key',
            timestamp: Date.now(),
            isActive: false // Set to false for deactivation test
          }
        };
      }
      
      // Generate mock data based on the approvalId
      return {
        success: true,
        data: {
          requestId: 'mock-request-' + approvalId.substring(0, 8),
          requesterId: 'mock-requester-' + approvalId.substring(8, 16),
          ownerId: 'mock-owner-' + approvalId.substring(16, 24),
          requestType: 'gcp',
          licenceKey: 'MOCK-LICENSE-' + approvalId.substring(24, 32),
          timestamp: Date.now(),
          isActive: true
        }
      };
    } catch (error) {
      console.error('Mock getApproval error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default Web3BlockchainService;