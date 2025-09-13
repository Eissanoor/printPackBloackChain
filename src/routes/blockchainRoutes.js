import express from 'express';
import { recordSyncApprovalOnBlockchain, getBlockchainApproval } from '../controllers/blockchainController.js';
import { apiKeyAuth, generalAuth } from '../middlewares/auth.js';
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
