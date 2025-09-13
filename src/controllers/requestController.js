import prisma from "../../prismaClient.js";
import Joi from "joi";
import { createError } from "../../utils/createError.js";
import { recordSyncApprovalOnBlockchain } from "./blockchainController.js";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import XLSX from 'xlsx';
import ejs from 'ejs';
import { sendMultipleEmails } from "../../services/emailTemplates.js";

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
    const syncRequest = await prisma.syncRequest.findFirst({
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
    const updatedSyncRequest = await prisma.$transaction(async (tx) => {
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
