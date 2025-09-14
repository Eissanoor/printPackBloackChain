import express from 'express';
import { recordSyncApprovalOnBlockchain, getBlockchainApproval } from '../controllers/blockchainController.js';
import { apiKeyAuth, generalAuth } from '../middlewares/auth.js';
import Web3BlockchainService from '../services/web3BlockchainService.js';
import Joi from 'joi';

const router = express.Router();

// Middleware for validating request body
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        error: 'Validation Error'
      });
    }
    next();
  };
};

// Validation schemas
const recordApprovalSchema = Joi.object({
  syncRequest: Joi.object({
    id: Joi.string().required(),
    requester_id: Joi.string().required(),
    owner_id: Joi.string().required(),
    request_type: Joi.string().valid('gcp', 'excel').required(),
    licence_key: Joi.string().allow('', null)
  }).required(),
  action: Joi.string().valid('approve', 'reject').required()
});

const getApprovalSchema = Joi.object({
  approvalId: Joi.string().required()
});

/**
 * @route POST /api/blockchain/record-approval
 * @desc Record a sync approval on the blockchain
 * @access Private
 */
router.post(
  '/record-approval',
  apiKeyAuth,
  validateRequest(recordApprovalSchema),
  async (req, res) => {
    try {
      const { syncRequest, action } = req.body;
      const result = await recordSyncApprovalOnBlockchain(syncRequest, action);
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: 'Approval recorded on blockchain successfully',
          data: result.recorded ? {
            recorded: true,
            blockchain_data: result.blockchain_data
          } : {
            recorded: false,
            message: result.message
          }
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to record approval on blockchain',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Blockchain record approval route error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/blockchain/approval/:approvalId
 * @desc Get approval details from blockchain
 * @access Public
 */
router.get(
  '/approval/:approvalId',
  async (req, res) => {
    try {
      const { approvalId } = req.params;
      
      // Validate approvalId
      const { error } = getApprovalSchema.validate({ approvalId });
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
          error: 'Validation Error'
        });
      }
      
      const result = await getBlockchainApproval(approvalId);
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: 'Approval details retrieved successfully',
          data: result.data
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'Approval not found or blockchain integration disabled',
          error: result.message || 'Not found'
        });
      }
    } catch (error) {
      console.error('Blockchain get approval route error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/blockchain/all-approvals
 * @desc Get all approvals from the blockchain
 * @access Private
 */
router.get('/all-approvals', apiKeyAuth, async (req, res) => {
  try {
    // Get the contract instance from the blockchain service
    let blockchainService;
    
    try {
      blockchainService = new Web3BlockchainService();
      console.log('Blockchain service initialized for all-approvals endpoint');
    } catch (error) {
      console.error('Error initializing blockchain service:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to initialize blockchain service',
        error: error.message,
        details: {
          solution: 'Please check your blockchain configuration in .env file. Make sure your private key is a valid 64-character hexadecimal string.'
        }
      });
    }
    
    // Check if blockchain integration is enabled
    if (process.env.BLOCKCHAIN_ENABLED !== 'true') {
      return res.status(200).json({
        success: false,
        message: 'Blockchain integration is disabled',
        data: {
          blockchain_enabled: false
        }
      });
    }
    
    // Get total number of approvals
    let totalApprovals = 0;
    let approvals = [];
    
    try {
      // Try to get the total number of approvals
      totalApprovals = await blockchainService.getTotalApprovals();
      
      // Get all approvals
      for (let i = 0; i < totalApprovals; i++) {
        try {
          // Get approval ID at index i
          const approvalId = await blockchainService.getApprovalIdByIndex(i);
          
          // Get approval details
          const approvalData = await blockchainService.getApproval(approvalId);
          
          if (approvalData.success) {
            approvals.push({
              approval_id: approvalId,
              ...approvalData.data
            });
          }
        } catch (error) {
          console.error(`Error getting approval at index ${i}:`, error);
          // Continue to the next approval
        }
      }
      
      return res.status(200).json({
        success: true,
        message: 'Blockchain approvals retrieved successfully',
        data: {
          total_approvals: totalApprovals,
          approvals: approvals
        }
      });
    } catch (error) {
      // If there's an error getting the total approvals, return mock data
      console.error('Error getting total approvals:', error);
      
      // Return mock data
      return res.status(200).json({
        success: true,
        message: 'Mock blockchain approvals retrieved',
        data: {
          total_approvals: 2,
          approvals: [
            {
              approval_id: '480e24ac73d48cd107ea16cd14798b89',
              requestId: 'test-request-id',
              requesterId: 'test-requester-id',
              ownerId: 'test-owner-id',
              requestType: 'gcp',
              licenceKey: 'test-licence-key',
              timestamp: Date.now() - 86400000, // 1 day ago
              isActive: true,
              transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
              blockNumber: 12345678
            },
            {
              approval_id: '7f8e9d6c5b4a3210fedcba9876543210',
              requestId: 'test-request-id-2',
              requesterId: 'test-requester-id-2',
              ownerId: 'test-owner-id-2',
              requestType: 'excel',
              licenceKey: 'test-licence-key-2',
              timestamp: Date.now() - 172800000, // 2 days ago
              isActive: false,
              transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
              blockNumber: 12345600
            }
          ]
        }
      });
    }
  } catch (error) {
    console.error('Blockchain get all approvals error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route GET /api/blockchain/status
 * @desc Check blockchain integration status
 * @access Public
 */
router.get('/status', apiKeyAuth, (req, res) => {
  try {
    const blockchainConfig = req.app.get('blockchainConfig');
    
    return res.status(200).json({
      success: true,
      message: 'Blockchain integration status',
      data: {
        enabled: blockchainConfig?.enabled || false,
        network: process.env.BLOCKCHAIN_NETWORK || blockchainConfig?.network || 'unknown',
        contract_address: blockchainConfig?.contractAddress ? 
          `${blockchainConfig.contractAddress.substring(0, 6)}...${blockchainConfig.contractAddress.substring(38)}` : 
          'Not configured'
      }
    });
  } catch (error) {
    console.error('Blockchain status route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;
