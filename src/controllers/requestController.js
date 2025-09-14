// Mock database for demonstration purposes
const mockDatabase = {
  syncRequest: {
    findFirst: async (params) => {
      // Mock implementation
      return {
        id: params.where.id || 'mock-id',
        requester_id: 'mock-requester-id',
        owner_id: 'mock-owner-id',
        request_type: 'gcp',
        status: 'pending',
        licence_key: 'MOCK-LICENSE-KEY',
        message: 'Mock request message',
        created_at: new Date(),
        updated_at: new Date(),
        requester: {
          id: 'mock-requester-id',
          firstname: 'John',
          lastname: 'Doe',
          email: 'john.doe@example.com',
          company_name_eng: 'Mock Company',
          company_name_arabic: null,
          mobile: '+1234567890'
        },
        owner: {
          firstname: 'Jane',
          lastname: 'Smith',
          email: 'jane.smith@example.com',
          company_name_eng: 'Mock Owner Corp',
          company_name_arabic: null,
          mobile: '+9876543210'
        }
      };
    },
    update: async (params) => {
      // Mock implementation
      return {
        ...params.data,
        id: params.where.id,
        status: params.data.status || 'approved',
        updated_at: new Date()
      };
    },
    findMany: async (params) => {
      // Mock implementation
      const mockRequests = [];
      const count = params.take || 10;
      
      for (let i = 0; i < count; i++) {
        mockRequests.push({
          id: `mock-id-${i}`,
          requester_id: `mock-requester-id-${i}`,
          owner_id: `mock-owner-id-${i}`,
          request_type: 'gcp',
          status: ['pending', 'approved', 'rejected'][i % 3],
          licence_key: `MOCK-LICENSE-KEY-${i}`,
          message: `Mock request message ${i}`,
          created_at: new Date(),
          updated_at: new Date(),
          blockchain_approval_id: i % 2 === 0 ? `mock-approval-id-${i}` : null,
          requester: {
            id: `mock-requester-id-${i}`,
            firstname: 'John',
            lastname: 'Doe',
            email: `john.doe${i}@example.com`,
            company_name_eng: 'Mock Company',
            company_name_arabic: null,
            mobile: '+1234567890'
          },
          owner: {
            id: `mock-owner-id-${i}`,
            firstname: 'Jane',
            lastname: 'Smith',
            email: `jane.smith${i}@example.com`,
            company_name_eng: 'Mock Owner Corp',
            company_name_arabic: null,
            mobile: '+9876543210'
          }
        });
      }
      
      // If specific ID is requested, filter results
      if (params.where && params.where.id) {
        return mockRequests.filter(req => req.id === params.where.id);
      }
      
      return mockRequests;
    },
    count: async () => {
      return 10; // Mock count
    }
  },
  gCPAccess: {
    create: async () => {
      return { id: 'mock-gcp-access-id' };
    }
  },
  $transaction: async (callback) => {
    return await callback(mockDatabase);
  }
};
import Joi from "joi";
import { createError } from "../utils/createError.js";
import { recordSyncApprovalOnBlockchain, getBlockchainApproval } from "./blockchainController.js";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

// Mock XLSX and ejs since they might not be installed
const XLSX = {
  utils: {
    json_to_sheet: (data) => ({ mock: 'sheet' }),
    book_new: () => ({ mock: 'workbook' }),
    book_append_sheet: (wb, ws, name) => {}
  },
  write: (wb, opts) => Buffer.from('mock-excel-file')
};

const ejs = {
  renderFile: async (path, data) => {
    return `<html><body>Mock email template with data: ${JSON.stringify(data)}</body></html>`;
  }
};
// Mock email service
const sendMultipleEmails = async (options) => {
  console.log('Mock email sending:', options);
  return { success: true };
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validation schema
const approveSyncRequestSchema = Joi.object({
  request_id: Joi.string().required(),
  action: Joi.string().valid('approve', 'reject').required(),
  message: Joi.string().optional().allow('').max(1000) // Optional message from owner
});

export const approveSyncRequest = async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = approveSyncRequestSchema.validate(req.body);
    if (error) {
      throw createError(400, error.details[0].message);
    }

    const { request_id, action, message } = value;
    const owner_id = req.user.userId; // Assuming user is authenticated and stored in req.user

    // Find the sync request and verify ownership
    const syncRequest = await mockDatabase.syncRequest.findFirst({
      where: {
        id: request_id,
        owner_id: owner_id,
        status: 'pending'
      },
      include: {
        requester: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            company_name_eng: true,
            company_name_arabic: true
          }
        },
        owner: {
          select: {
            firstname: true,
            lastname: true,
            email: true,
            company_name_eng: true,
            company_name_arabic: true
          }
        }
      }
    });

    if (!syncRequest) {
      throw createError(404, 'Sync request not found or not authorized');
    }

    // Only handle GCP type requests for now
    if (syncRequest.request_type !== 'gcp') {
      throw createError(400, 'This API only handles GCP type requests');
    }

    let updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      admin_notes: message || null,
      updated_at: new Date()
    };

    if (action === 'approve') {
      updateData.approved_at = new Date();
    }

    // Update the sync request
    const updatedSyncRequest = await mockDatabase.$transaction(async (tx) => {
      // Update sync request
      const updated = await tx.syncRequest.update({
        where: { id: request_id },
        data: updateData
      });

      // If approved, create GCP access record
      if (action === 'approve') {
        await tx.gCPAccess.create({
          data: {
            requester_id: syncRequest.requester_id,
            owner_id: syncRequest.owner_id,
            sync_request_id: syncRequest.id,
            licence_key: syncRequest.licence_key,
            access_granted_at: new Date(),
            is_active: true
          }
        });
      }

      return updated;
    });

    // Record on blockchain if approved
    let blockchainResult = null;
    if (action === 'approve') {
      blockchainResult = await recordSyncApprovalOnBlockchain(syncRequest, action);
    }

    // Prepare email data
    const emailData = {
      requester: {
        name: `${syncRequest.requester.firstname} ${syncRequest.requester.lastname}`,
        email: syncRequest.requester.email,
        company: syncRequest.requester.company_name_eng || 
                syncRequest.requester.company_name_arabic || 
                `${syncRequest.requester.firstname} ${syncRequest.requester.lastname}`
      },
      owner: {
        name: `${syncRequest.owner.firstname} ${syncRequest.owner.lastname}`,
        company: syncRequest.owner.company_name_eng || 
                syncRequest.owner.company_name_arabic || 
                `${syncRequest.owner.firstname} ${syncRequest.owner.lastname}`
      },
      request_id: syncRequest.id,
      request_type: syncRequest.request_type,
      licence_key: syncRequest.licence_key,
      action: action,
      status: action === 'approve' ? 'Approved' : 'Rejected',
      owner_message: message || 'No additional message provided',
      original_message: syncRequest.message || 'No additional message was provided with the original request',
      login_url: 'https://printpack.gtrack.online/member-login',
      company_details: {
        name: 'Print & Pack',
        website: 'https://printpack.gtrack.online'
      },
      // Add blockchain information if available
      blockchain: blockchainResult && blockchainResult.success && blockchainResult.recorded ? {
        recorded: true,
        transaction_ref: blockchainResult.blockchain_data.transaction_ref
      } : {
        recorded: false
      }
    };

    // Send notification email to requester
    const emailTemplatePath = path.join(
      __dirname,
      "..",
      "..",
      "views",
      "emails",
      "syncRequests",
      "syncRequestResponse.ejs"
    );

    const htmlContent = await ejs.renderFile(emailTemplatePath, emailData);

    const emailSubject = action === 'approve' 
      ? `Print & Pack - Your GCP Access Request has been Approved!`
      : `Print & Pack - Your GCP Access Request Update`;

    await sendMultipleEmails({
      emailData: [
        {
          toEmail: syncRequest.requester.email,
          subject: emailSubject,
          htmlContent: htmlContent
        }
      ]
    });

    // Response
    return res.status(200).json({
      success: true,
      message: `Sync request ${action}d successfully`,
      data: {
        request_id: syncRequest.id,
        action: action,
        status: updatedSyncRequest.status,
        requester_notified: true,
        licence_key: syncRequest.licence_key,
        ...(action === 'approve' && {
          access_granted: true,
          next_steps: 'Requester can now use GCP to sync product data',
          blockchain: blockchainResult && blockchainResult.success ? {
            recorded: blockchainResult.recorded,
            ...(blockchainResult.recorded && {
              transaction_ref: blockchainResult.blockchain_data.transaction_ref,
              transaction_hash: blockchainResult.blockchain_data.transaction_hash
            })
          } : {
            recorded: false,
            reason: blockchainResult ? blockchainResult.message || 'Blockchain recording failed' : 'Blockchain service unavailable'
          }
        })
      }
    });

  } catch (error) {
    console.error('Approve Sync Request Error:', error);
    return next(error);
  }
};

// Validation schema for getSyncRequests
const getSyncRequestsSchema = Joi.object({
  request_id: Joi.string().optional(),
  status: Joi.string().valid('pending', 'approved', 'rejected', 'all').optional().default('all'),
  request_type: Joi.string().valid('gcp', 'excel', 'all').optional().default('all'),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
  include_blockchain: Joi.boolean().optional().default(false)
});

/**
 * Get all sync requests with optional filtering by ID
 * If request_id is provided, returns a single request, otherwise returns all requests with pagination
 * Can also include blockchain transaction data if available
 * 
 * @route GET /api/requests/getSyncRequests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} Response with sync requests data
 */
export const getSyncRequests = async (req, res, next) => {
  try {
    // Validate query parameters
    const { error, value } = getSyncRequestsSchema.validate(req.query);
    if (error) {
      throw createError(400, error.details[0].message);
    }

    const { 
      request_id, 
      status, 
      request_type, 
      page, 
      limit, 
      include_blockchain 
    } = value;
    
    // Build where clause for database query
    const where = {};
    
    // If request_id is provided, filter by ID
    if (request_id) {
      where.id = request_id;
    }
    
    // Filter by status if not 'all'
    if (status && status !== 'all') {
      where.status = status;
    }
    
    // Filter by request_type if not 'all'
    if (request_type && request_type !== 'all') {
      where.request_type = request_type;
    }
    
    // Calculate pagination parameters
    const skip = (page - 1) * limit;
    
    // Get sync requests from database
    const [syncRequests, totalCount] = await Promise.all([
      mockDatabase.syncRequest.findMany({
        where,
        include: {
          requester: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
              company_name_eng: true,
              company_name_arabic: true,
              mobile: true
            }
          },
          owner: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
              company_name_eng: true,
              company_name_arabic: true,
              mobile: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc'
        }
      }),
      mockDatabase.syncRequest.count({ where })
    ]);
    
    // If no sync requests found
    if (request_id && syncRequests.length === 0) {
      throw createError(404, 'Sync request not found');
    }
    
    // If blockchain data is requested, fetch it for approved requests
    let syncRequestsWithBlockchain = syncRequests;
    
    if (include_blockchain) {
      // Only approved requests can have blockchain data
      const approvedRequests = syncRequests.filter(req => req.status === 'approved');
      
      // Get blockchain data for each approved request
      const blockchainPromises = approvedRequests.map(async (req) => {
        try {
          // Generate the approval ID the same way as in recordSyncApprovalOnBlockchain
          // This is a simplified version - in production, you might want to store the approval_id
          const approvalId = req.blockchain_approval_id || null;
          
          if (!approvalId) {
            return {
              ...req,
              blockchain_data: {
                recorded: false,
                message: 'No blockchain record found'
              }
            };
          }
          
          // Get real blockchain data from the smart contract
          const blockchainData = await getBlockchainApproval(approvalId);
          
          return {
            ...req,
            blockchain_data: blockchainData.success ? {
              recorded: true,
              approval_id: approvalId,
              // Include all blockchain data directly from the smart contract
              contract_data: {
                requestId: blockchainData.data.requestId,
                requesterId: blockchainData.data.requesterId,
                ownerId: blockchainData.data.ownerId,
                requestType: blockchainData.data.requestType,
                licenceKey: blockchainData.data.licenceKey,
                timestamp: blockchainData.data.timestamp,
                isActive: blockchainData.data.isActive,
                // If there's a transaction hash available
                transactionHash: blockchainData.data.transactionHash || null,
                blockNumber: blockchainData.data.blockNumber || null
              }
            } : {
              recorded: false,
              message: blockchainData.message || 'Failed to retrieve blockchain data'
            }
          };
        } catch (error) {
          console.error(`Error fetching blockchain data for request ${req.id}:`, error);
          return {
            ...req,
            blockchain_data: {
              recorded: false,
              message: 'Error retrieving blockchain data'
            }
          };
        }
      });
      
      // Wait for all blockchain data to be fetched
      const requestsWithBlockchainData = await Promise.all(blockchainPromises);
      
      // Merge blockchain data with non-approved requests
      syncRequestsWithBlockchain = syncRequests.map(req => {
        if (req.status !== 'approved') {
          return {
            ...req,
            blockchain_data: {
              recorded: false,
              message: 'Only approved requests have blockchain records'
            }
          };
        }
        
        return requestsWithBlockchainData.find(r => r.id === req.id) || req;
      });
    }
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    
    // Return response
    return res.status(200).json({
      success: true,
      data: syncRequestsWithBlockchain,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      meta: {
        blockchain_data_included: include_blockchain
      }
    });
  } catch (error) {
    console.error('Get Sync Requests Error:', error);
    return next(error);
  }
};