import Web3BlockchainService from '../services/web3BlockchainService.js';
import { generateApprovalId, generateTransactionRef } from '../utils/idGenerator.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create blockchain service instance
let blockchainService;

try {
    blockchainService = new Web3BlockchainService();
    console.log('Blockchain service initialized successfully');
} catch (error) {
    console.error('Failed to initialize blockchain service:', error);
    // We'll create the service instance on-demand in the functions below
}

/**
 * Record a sync approval on the blockchain
 * 
 * @param {Object} syncRequest - The sync request object
 * @param {string} action - The action taken (approve, reject)
 * @returns {Promise<Object>} - Result of the blockchain operation
 */
export const recordSyncApprovalOnBlockchain = async (syncRequest, action) => {
    try {
        // Check if blockchain integration is enabled
        if (process.env.BLOCKCHAIN_ENABLED !== 'true') {
            console.log('Blockchain integration is disabled. Skipping blockchain recording.');
            return {
                success: true,
                blockchain_enabled: false,
                message: 'Blockchain integration is disabled'
            };
        }
        
        // Only record approved requests
        if (action !== 'approve') {
            return {
                success: true,
                recorded: false,
                message: 'Only approved requests are recorded on blockchain'
            };
        }
        
        // Initialize blockchain service if not already done
        if (!blockchainService) {
            console.log('Initializing blockchain service on-demand');
            blockchainService = new Web3BlockchainService();
        }
        
        // Generate a unique approval ID
        const timestamp = Date.now();
        const approvalId = generateApprovalId(
            syncRequest.id,
            syncRequest.requester_id,
            syncRequest.owner_id,
            timestamp
        );
        
        // Prepare data for blockchain
        const approvalData = {
            approvalId,
            requestId: syncRequest.id,
            requesterId: syncRequest.requester_id,
            ownerId: syncRequest.owner_id,
            requestType: syncRequest.request_type,
            licenceKey: syncRequest.licence_key || ''
        };
        
        console.log('Sending REAL blockchain transaction for approval:', approvalData);
        
        // Record on blockchain
        const result = await blockchainService.recordSyncApproval(approvalData);
        
        if (result.success) {
            console.log('REAL blockchain transaction successful!');
            console.log('Transaction hash:', result.transactionHash);
            console.log('Block number:', result.blockNumber);
            
            return {
                success: true,
                recorded: true,
                blockchain_data: {
                    approval_id: approvalId,
                    transaction_hash: result.transactionHash,
                    block_number: result.blockNumber,
                    transaction_ref: generateTransactionRef(syncRequest.request_type.toUpperCase())
                }
            };
        } else {
            console.error('Failed to record on REAL blockchain:', result.error);
            return {
                success: false,
                recorded: false,
                error: result.error,
                details: result.details || {}
            };
        }
    } catch (error) {
        console.error('Blockchain controller error:', error);
        return {
            success: false,
            recorded: false,
            error: error.message
        };
    }
};

/**
 * Get approval details from blockchain
 * 
 * @param {string} approvalId - The blockchain approval ID
 * @returns {Promise<Object>} - Approval details
 */
export const getBlockchainApproval = async (approvalId) => {
    try {
        // Check if blockchain integration is enabled
        if (process.env.BLOCKCHAIN_ENABLED !== 'true') {
            return {
                success: false,
                blockchain_enabled: false,
                message: 'Blockchain integration is disabled'
            };
        }
        
        // Initialize blockchain service if not already done
        if (!blockchainService) {
            console.log('Initializing blockchain service on-demand');
            blockchainService = new Web3BlockchainService();
        }
        
        console.log('Getting REAL blockchain approval data for:', approvalId);
        
        const result = await blockchainService.getApproval(approvalId);
        
        if (result.success) {
            console.log('REAL blockchain data retrieved successfully!');
            return result;
        } else {
            console.error('Failed to get approval from REAL blockchain:', result.error);
            return {
                success: false,
                error: result.error,
                details: result.details || {}
            };
        }
    } catch (error) {
        console.error('Get blockchain approval error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};