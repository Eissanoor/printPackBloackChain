import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Web3 from 'web3';

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
      },
      {
        "inputs": [
          { "internalType": "string", "name": "approvalId", "type": "string" }
        ],
        "name": "getApproval",
        "outputs": [
          { "internalType": "string", "name": "requestId", "type": "string" },
          { "internalType": "string", "name": "requesterId", "type": "string" },
          { "internalType": "string", "name": "ownerId", "type": "string" },
          { "internalType": "string", "name": "requestType", "type": "string" },
          { "internalType": "string", "name": "licenceKey", "type": "string" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
          { "internalType": "bool", "name": "isActive", "type": "bool" }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "string", "name": "approvalId", "type": "string" }
        ],
        "name": "deactivateApproval",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getTotalApprovals",
        "outputs": [
          { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "uint256", "name": "index", "type": "uint256" }
        ],
        "name": "getApprovalIdByIndex",
        "outputs": [
          { "internalType": "string", "name": "", "type": "string" }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ];
  }
} catch (error) {
  console.error('Error loading contract ABI:', error);
}

/**
 * Web3BlockchainService for interacting with the blockchain
 */
class Web3BlockchainService {
  /**
   * Validates a private key format
   * @param {string} key - The private key to validate
   * @returns {string} The formatted private key with 0x prefix
   * @throws {Error} If the key is invalid
   */
  static validatePrivateKey(key) {
    if (!key || typeof key !== 'string') {
      throw new Error('Private key must be a non-empty string');
    }
    
    // Remove 0x prefix if present
    const cleanKey = key.startsWith('0x') ? key.substring(2) : key;
    
    // Check if it's a valid hex string of correct length (64 characters = 32 bytes)
    if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
      throw new Error('Private key must be a 64-character hexadecimal string');
    }
    
    // Return with 0x prefix
    return '0x' + cleanKey;
  }

  constructor() {
    // Read environment variables
    this.rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545';
    this.privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    
    // Check if we're using Ganache
    this.isGanache = process.env.BLOCKCHAIN_NETWORK === 'ganache';
    
    // For Ganache, use real data mode
    if (this.isGanache) {
      console.log('GANACHE REAL MODE ENABLED: Using Ganache for real blockchain data.');
      console.log('This will store and retrieve real data from your local Ganache blockchain.');
      
      // Use real data mode for Ganache
      this.mockMode = false;
      this.realConnection = true;
      this.readOnlyMode = false;
      // Continue with initialization to connect to Ganache
    } else {
      // Check if mock mode is explicitly enabled (only for non-Ganache)
      this.mockMode = process.env.USE_MOCK_MODE === 'true';
      this.readOnlyMode = false;
      
      // If mock mode is enabled, log it
      if (this.mockMode) {
        console.log('MOCK MODE ENABLED: Using mock blockchain service for all operations.');
        console.log('This will simulate blockchain operations without requiring real ETH.');
        return; // Skip real blockchain initialization
      }
    }
    
    try {
      // Initialize Web3
      this.web3 = new Web3(this.rpcUrl);
      
      // Create contract instance
      this.contract = new this.web3.eth.Contract(
        contractABI,
        this.contractAddress
      );
      
      // For non-Ganache networks, initialize account from private key
      if (!this.isGanache) {
        if (this.privateKey) {
          try {
            // Validate and format the private key
            const formattedKey = Web3BlockchainService.validatePrivateKey(this.privateKey);
              
            console.log('Attempting to create account with private key (first 4 chars):', formattedKey.substring(0, 6) + '...');
            this.account = this.web3.eth.accounts.privateKeyToAccount(formattedKey);
            this.web3.eth.accounts.wallet.add(this.account);
            console.log('Successfully created account:', this.account.address);
          } catch (error) {
            console.error('Error creating account from private key:', error.message);
            console.error('Your private key:', this.privateKey ? 
              `${this.privateKey.substring(0, 6)}...${this.privateKey.substring(this.privateKey.length - 4)}` : 
              'Not provided');
            throw new Error(`Invalid private key format: ${error.message}`);
          }
        } else {
          console.warn('No private key provided. Initializing in read-only mode.');
          this.readOnlyMode = true;
        }
      } else {
        // For Ganache, we'll initialize the account when needed
        console.log('Ganache account will be initialized when needed');
      }
      
      console.log('Web3BlockchainService initialized successfully');
      console.log('RPC URL:', this.rpcUrl);
      console.log('Contract Address:', this.contractAddress);
      console.log('Using REAL blockchain mode - all transactions will be sent to the blockchain');
    } catch (error) {
      console.error('Error initializing Web3BlockchainService:', error);
      
      // Check if error is related to private key
      if (error.message && error.message.includes('Private Key')) {
        console.warn('WARNING: Invalid private key format. Initializing in read-only mode.');
        console.warn('Write operations like recordSyncApproval will not work.');
        
        // Continue with initialization but mark as read-only
        this.readOnlyMode = true;
        
        // Try to initialize Web3 and contract again without account
        try {
          this.web3 = new Web3(this.rpcUrl);
          this.contract = new this.web3.eth.Contract(
            contractABI,
            this.contractAddress
          );
          console.log('Web3BlockchainService initialized in READ-ONLY mode');
    console.log('RPC URL:', this.rpcUrl);
    console.log('Contract Address:', this.contractAddress);
        } catch (innerError) {
          console.error('Failed to initialize even in read-only mode:', innerError);
          this.mockMode = true;
        }
      } 
      // Fall back to mock mode if explicitly allowed
      else if (process.env.ALLOW_MOCK_FALLBACK === 'true') {
        this.mockMode = true;
        console.log('Web3BlockchainService initialized in mock mode due to error');
      } else {
        // Re-throw the error to prevent the service from starting
        console.error('REAL blockchain mode required but failed to initialize');
        throw new Error('Failed to initialize blockchain connection: ' + error.message);
      }
    }
  }
  
  /**
   * Initialize Ganache account (called when needed)
   * @returns {Promise<Object>} The account object
   */
  async initGanacheAccount() {
    if (!this.isGanache) {
      return this.account;
    }
    
    try {
      // Get accounts from Ganache
      const accounts = await this.web3.eth.getAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available in Ganache');
      }
      
      // Use the first account
      const firstAccount = accounts[0];
      console.log('Using Ganache account:', firstAccount);
      
      // Check balance
      const balance = await this.web3.eth.getBalance(firstAccount);
      const balanceInEth = this.web3.utils.fromWei(balance, 'ether');
      console.log(`Account balance: ${balanceInEth} ETH`);
      
      // Set the account
      this.account = { address: firstAccount };
      
      return this.account;
    } catch (error) {
      console.error('Error initializing Ganache account:', error);
      throw error;
    }
  }
  
  /**
   * Record a sync approval on the blockchain
   * 
   * @param {Object} approvalData - Data for the approval
   * @returns {Promise<Object>} Transaction result
   */
  async recordSyncApproval(approvalData) {
    try {
      // Check if we're in mock mode or read-only mode
      if (this.mockMode) {
        console.warn('WARNING: Using mock mode for recordSyncApproval. This will NOT record data on the real blockchain.');
        return this._mockRecordSyncApproval(approvalData);
      }
      
      // Check if we're in read-only mode
      if (this.readOnlyMode) {
        console.error('ERROR: Cannot record approval in read-only mode. Private key is invalid or not provided.');
        return {
          success: false,
          error: 'Cannot record approval in read-only mode. Private key is invalid or not provided.',
          details: {
            reason: 'Invalid private key format',
            solution: 'Please provide a valid private key in the .env file. The private key should be a 64-character hexadecimal string, with or without the 0x prefix.'
          }
        };
      }
      
      // For Ganache, make sure we have an account
      if (this.isGanache && !this.account) {
        await this.initGanacheAccount();
      }
      
      // Validate required blockchain connection parameters
      if (!this.web3) {
        throw new Error('Web3 instance not initialized');
      }
      
      if (!this.contract) {
        throw new Error('Contract instance not initialized');
      }
      
      if (!this.account) {
        throw new Error('No account available. Please check your private key configuration.');
      }
      
      console.log('Recording REAL sync approval on blockchain:', approvalData);
      
      // Prepare transaction
      const tx = this.contract.methods.recordApproval(
        approvalData.approvalId,
        approvalData.requestId,
        approvalData.requesterId,
        approvalData.ownerId,
        approvalData.requestType,
        approvalData.licenceKey || ''
      );
      
      // Get gas estimate
      const gasEstimate = await tx.estimateGas({ from: this.account.address });
      
      // Convert gas estimate to a regular number to avoid BigInt issues
      let gasValue;
      if (typeof gasEstimate === 'bigint') {
        // Convert BigInt to Number safely
        gasValue = Number(gasEstimate);
      } else {
        gasValue = Number(gasEstimate);
      }
      
      // Add 20% buffer and ensure it's a valid number
      const gasWithBuffer = Math.round(gasValue * 1.2);
      
      console.log('Gas estimate:', gasValue, 'Gas with buffer:', gasWithBuffer);
      
      // Send transaction
      const receipt = await tx.send({
        from: this.account.address,
        gas: gasWithBuffer
      });
      
      console.log('REAL blockchain transaction successful:', receipt.transactionHash);
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        approvalId: approvalData.approvalId
      };
    } catch (error) {
      console.error('REAL blockchain record sync approval error:', error);
      
      // Check for insufficient funds error
      if (error.message && error.message.includes('insufficient funds')) {
        console.error('ACCOUNT HAS NO FUNDS! You need ETH in your account to pay for gas fees.');
        
        // For Ganache, try to use a different account
        if (this.isGanache) {
          try {
            console.log('Trying to use another Ganache account...');
            await this.initGanacheAccount();
            
            // Try the transaction again with the new account
            return this.recordSyncApproval(approvalData);
          } catch (retryError) {
            console.error('Failed to retry with Ganache account:', retryError);
          }
        }
        
        try {
          // Get account balance
          const balance = await this.web3.eth.getBalance(this.account.address);
          const balanceInEth = this.web3.utils.fromWei(balance, 'ether');
          
          // Try to get gas price
          const gasPrice = await this.web3.eth.getGasPrice();
          const gasPriceGwei = this.web3.utils.fromWei(gasPrice, 'gwei');
          
          return {
            success: false,
            error: `Insufficient funds to pay for transaction gas fees`,
            details: {
              explanation: "Even storing data on the blockchain requires ETH to pay for gas fees",
              account: this.account.address,
              balance: `${balanceInEth} ETH`,
              gasPrice: `${gasPriceGwei} Gwei`,
              solution: "You need to fund your account with ETH to pay for gas fees. For Sepolia testnet, you can get free test ETH from a faucet like https://sepoliafaucet.com/"
            }
          };
        } catch (balanceError) {
          return {
            success: false,
            error: `Insufficient funds to pay for transaction gas fees`,
            details: {
              account: this.account?.address || 'Unknown',
              solution: "You need to fund your account with ETH to pay for gas fees. For Sepolia testnet, you can get free test ETH from a faucet like https://sepoliafaucet.com/"
            }
          };
        }
      }
      
      // Only fall back to mock mode if explicitly allowed
      if (process.env.ALLOW_MOCK_FALLBACK === 'true') {
        console.warn('WARNING: Falling back to mock mode due to blockchain error. This will NOT record data on the real blockchain.');
        return this._mockRecordSyncApproval(approvalData);
      }
      
      // Otherwise, return the error
      return {
        success: false,
        error: `Failed to record on blockchain: ${error.message}`,
        details: {
          rpcUrl: this.rpcUrl,
          contractAddress: this.contractAddress,
          approvalData: approvalData
        }
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
      // Check if we're in mock mode
      if (this.mockMode) {
        console.warn('WARNING: Using mock mode for deactivateApproval. This will NOT record data on the real blockchain.');
        return this._mockDeactivateApproval(approvalId);
      }
      
      // For Ganache, make sure we have an account
      if (this.isGanache && !this.account) {
        await this.initGanacheAccount();
      }
      
      console.log('Deactivating approval on blockchain:', approvalId);
      
      // Prepare transaction
      const tx = this.contract.methods.deactivateApproval(approvalId);
      
      // Get gas estimate
      const gasEstimate = await tx.estimateGas({ from: this.account.address });
      
      // Convert gas estimate to a regular number to avoid BigInt issues
      let gasValue;
      if (typeof gasEstimate === 'bigint') {
        // Convert BigInt to Number safely
        gasValue = Number(gasEstimate);
      } else {
        gasValue = Number(gasEstimate);
      }
      
      // Add 20% buffer and ensure it's a valid number
      const gasWithBuffer = Math.round(gasValue * 1.2);
      
      console.log('Gas estimate:', gasValue, 'Gas with buffer:', gasWithBuffer);
      
      // Send transaction
      const receipt = await tx.send({
        from: this.account.address,
        gas: gasWithBuffer
      });
      
      console.log('REAL blockchain transaction successful:', receipt.transactionHash);
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        approvalId
      };
    } catch (error) {
      console.error('REAL blockchain deactivate approval error:', error);
      
      // Do not fall back to mock mode - we want real data only
      return {
        success: false,
        error: `Failed to deactivate approval on blockchain: ${error.message}`,
        details: {
          rpcUrl: this.rpcUrl,
          contractAddress: this.contractAddress,
          approvalId: approvalId
        }
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
      // Check if we're in mock mode (should only happen if ALLOW_MOCK_FALLBACK is true)
      if (this.mockMode) {
        console.warn('WARNING: Using mock mode for getApproval. This will NOT retrieve real data from the blockchain.');
        return this._mockGetApproval(approvalId);
      }
      
      // Validate required blockchain connection parameters
      if (!this.web3) {
        throw new Error('Web3 instance not initialized');
      }
      
      if (!this.contract) {
        throw new Error('Contract instance not initialized');
      }
      
      console.log('Getting REAL approval from blockchain:', approvalId);
      
      // Try to get approval data using direct call
      let result;
      let formattedData;
      
      try {
        // Call contract method
        result = await this.contract.methods.getApproval(approvalId).call();
        
        console.log('REAL blockchain data retrieved successfully for approval:', approvalId);
        
        // Log the raw result for debugging
        console.log('Raw blockchain result:', JSON.stringify(result, null, 2));
        
        // Format the result
        formattedData = {
          requestId: result[0],
          requesterId: result[1],
          ownerId: result[2],
          requestType: result[3],
          licenceKey: result[4],
          timestamp: parseInt(result[5]),
          isActive: result[6],
          transactionHash: null,
          blockNumber: null
        };
      } catch (callError) {
        console.error('Error calling getApproval directly:', callError);
        
        // If we get an ABI error, try to check if the approval exists by looking at events
        if (callError.message && callError.message.includes("Returned values aren't valid")) {
          console.log('ABI error detected, trying alternative approach using events');
          
          // Fall back to mock mode if explicitly allowed
          if (process.env.ALLOW_MOCK_FALLBACK === 'true') {
            console.warn('WARNING: Falling back to mock mode due to ABI error. This will NOT retrieve real data from the blockchain.');
            return this._mockGetApproval(approvalId);
          }
          
          throw new Error(`ABI error when retrieving approval: ${callError.message}. Check that your contract ABI matches the deployed contract.`);
        } else {
          // For other errors, just rethrow
          throw callError;
        }
      }
      
      // Try to find transaction hash and block number for this approval
      try {
        // Get events without using filter to avoid ABI errors
        const events = await this.contract.getPastEvents('ApprovalRecorded', {
          fromBlock: 0,
          toBlock: 'latest'
        });
        
        // Filter events manually
        const matchingEvents = events.filter(event => {
          try {
            return event.returnValues && 
                  event.returnValues.approvalId && 
                  event.returnValues.approvalId === approvalId;
          } catch (e) {
            return false;
          }
        });
        
        if (matchingEvents && matchingEvents.length > 0) {
          formattedData.transactionHash = matchingEvents[0].transactionHash;
          formattedData.blockNumber = matchingEvents[0].blockNumber;
          console.log(`Found transaction details: hash=${formattedData.transactionHash}, block=${formattedData.blockNumber}`);
        } else {
          console.log('No matching events found for this approval ID');
          
          // Try searching all events without filtering
          console.log('Searching all events for this approval ID');
          const allEvents = await this.contract.getPastEvents('allEvents', {
            fromBlock: 0,
            toBlock: 'latest'
          });
          
          console.log(`Found ${allEvents.length} total events`);
          
          // Look for any event that might contain our approval ID
          for (const event of allEvents) {
            if (event.returnValues) {
              const values = Object.values(event.returnValues);
              if (values.includes(approvalId)) {
                formattedData.transactionHash = event.transactionHash;
                formattedData.blockNumber = event.blockNumber;
                console.log(`Found transaction in event ${event.event}: hash=${formattedData.transactionHash}`);
                break;
              }
            }
          }
        }
      } catch (eventError) {
        console.warn('Could not retrieve transaction details for approval:', eventError);
      }
      
      console.log('Formatted blockchain data:', JSON.stringify(formattedData, null, 2));
      
      return {
        success: true,
        data: formattedData
      };
    } catch (error) {
      console.error('REAL blockchain get approval error:', error);
      
      // Check if we should fall back to mock mode
      if (process.env.ALLOW_MOCK_FALLBACK === 'true') {
        console.warn('WARNING: Falling back to mock mode due to error. This will NOT retrieve real data from the blockchain.');
        return this._mockGetApproval(approvalId);
      }
      
      return {
        success: false,
        error: `Failed to get approval from blockchain: ${error.message}`,
        details: {
          rpcUrl: this.rpcUrl,
          contractAddress: this.contractAddress,
          approvalId: approvalId,
          solution: 'Ensure your blockchain connection is properly configured and the contract is deployed'
        }
      };
    }
  }
  
  /**
   * Get total number of approvals from the blockchain
   * 
   * @returns {Promise<number>} Total number of approvals
   */
  async getTotalApprovals() {
    try {
      // Check if we're in mock mode
      if (this.mockMode) {
        console.warn('WARNING: Using mock mode for getTotalApprovals. This will NOT retrieve real data from the blockchain.');
        return this._mockGetTotalApprovals();
      }
      
      console.log('Getting REAL total approvals from blockchain');
      
      // Call contract method
      const result = await this.contract.methods.getTotalApprovals().call();
      console.log('REAL blockchain returned total approvals:', result);
      
      return parseInt(result);
    } catch (error) {
      console.error('REAL blockchain get total approvals error:', error);
      
      // Do not fall back to mock mode - we want real data only
      throw new Error(`Failed to get total approvals from blockchain: ${error.message}`);
    }
  }
  
  /**
   * Get approval ID by index from the blockchain
   * 
   * @param {number} index - Index in the approvals array
   * @returns {Promise<string>} Approval ID
   */
  async getApprovalIdByIndex(index) {
    try {
      // Check if we're in mock mode
      if (this.mockMode) {
        console.warn('WARNING: Using mock mode for getApprovalIdByIndex. This will NOT retrieve real data from the blockchain.');
        return this._mockGetApprovalIdByIndex(index);
      }
      
      console.log('Getting REAL approval ID by index from blockchain:', index);
      
      // Call contract method
      const result = await this.contract.methods.getApprovalIdByIndex(index).call();
      console.log(`REAL blockchain returned approval ID at index ${index}:`, result);
      
      return result;
    } catch (error) {
      console.error('REAL blockchain get approval ID by index error:', error);
      
      // Do not fall back to mock mode - we want real data only
      throw new Error(`Failed to get approval ID by index from blockchain: ${error.message}`);
    }
  }
  
  // Mock implementations for fallback
  
  _mockRecordSyncApproval(approvalData) {
    console.log('Mock recordSyncApproval called with data:', approvalData);
    
    // Generate a mock transaction hash
    const mockTxHash = '0x' + Buffer.from(JSON.stringify(approvalData)).toString('hex').substring(0, 64);
    
    return {
      success: true,
      transactionHash: mockTxHash,
      blockNumber: Date.now(),
      approvalId: approvalData.approvalId
    };
  }
  
  _mockDeactivateApproval(approvalId) {
    console.log('Mock deactivateApproval called with ID:', approvalId);
    
    // Generate a mock transaction hash
    const mockTxHash = '0x' + Buffer.from(approvalId).toString('hex').substring(0, 64);
    
    return {
      success: true,
      transactionHash: mockTxHash,
      blockNumber: Date.now(),
      approvalId
    };
  }
  
  _mockGetApproval(approvalId) {
    console.log('Mock getApproval called with ID:', approvalId);
    
    // Predefined realistic data for specific IDs
    const mockData = {
      '480e24ac73d48cd107ea16cd14798b89': {
        requestId: 'real-request-id-1',
        requesterId: 'real-requester-id-1',
        ownerId: 'real-owner-id-1',
        requestType: 'gcp',
        licenceKey: 'GS1-123456',
        timestamp: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
        isActive: true,
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        blockNumber: 12345678
      },
      '7f8e9d6c5b4a3210fedcba9876543210': {
        requestId: 'real-request-id-2',
        requesterId: 'real-requester-id-2',
        ownerId: 'real-owner-id-2',
        requestType: 'excel',
        licenceKey: 'GS1-654321',
        timestamp: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
        isActive: false,
        transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: 12345679
      }
    };
    
    // If we have predefined data for this ID, return it
    if (mockData[approvalId]) {
      return {
        success: true,
        data: mockData[approvalId]
      };
    }
      
      // Generate mock data based on the approvalId
      return {
        success: true,
        data: {
        requestId: 'real-request-' + approvalId.substring(0, 8),
        requesterId: 'real-requester-' + approvalId.substring(8, 16),
        ownerId: 'real-owner-' + approvalId.substring(16, 24),
        requestType: Math.random() > 0.5 ? 'gcp' : 'excel',
        licenceKey: 'GS1-' + Math.floor(Math.random() * 1000000).toString(),
        timestamp: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 2592000), // Up to 30 days ago
        isActive: Math.random() > 0.2, // 80% chance of being active
        transactionHash: '0x' + Buffer.from(approvalId).toString('hex').substring(0, 64),
        blockNumber: 12345600 + Math.floor(Math.random() * 1000)
      }
    };
  }
  
  _mockGetTotalApprovals() {
    console.log('Mock getTotalApprovals called');
    return 2; // Return 2 mock approvals
  }
  
  _mockGetApprovalIdByIndex(index) {
    console.log('Mock getApprovalIdByIndex called with index:', index);
    
    // Return different approval IDs based on index
    if (index === 0) {
      return '480e24ac73d48cd107ea16cd14798b89';
    } else {
      return '7f8e9d6c5b4a3210fedcba9876543210';
    }
  }
}

export default Web3BlockchainService;