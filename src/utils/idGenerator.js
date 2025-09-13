import crypto from 'crypto';

/**
 * Generate a unique approval ID for blockchain transactions
 * 
 * @param {string} requestId - The sync request ID
 * @param {string} requesterId - User ID of requester
 * @param {string} ownerId - User ID of owner
 * @param {string} timestamp - Timestamp of the approval
 * @returns {string} A unique approval ID
 */
export const generateApprovalId = (requestId, requesterId, ownerId, timestamp) => {
    const data = `${requestId}-${requesterId}-${ownerId}-${timestamp}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
};

/**
 * Generate a unique transaction reference
 * 
 * @param {string} prefix - Prefix for the transaction reference (e.g., 'GCP', 'EXCEL')
 * @returns {string} A unique transaction reference
 */
export const generateTransactionRef = (prefix = 'TX') => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}_${timestamp}_${random}`;
};
