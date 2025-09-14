import Web3BlockchainService from '../services/web3BlockchainService.js';

/**
 * Helper function to safely convert BigInt values to regular numbers
 * @param {any} value - The value to convert
 * @returns {number} The converted number
 */
const safeNumberConversion = (value) => {
  if (typeof value === 'bigint') {
    return Number(value);
  } else if (typeof value === 'string' && value.includes('n')) {
    return Number(value.replace('n', ''));
  } else if (value !== null && value !== undefined) {
    return Number(value);
  }
  return 0;
};

/**
 * Record a sync approval on the blockchain
 * 
 * @param {Object} syncRequest - The sync request to approve
 * @param {string} action - The action to take (approve/reject)
 * @returns {Promise<Object>} Result of the blockchain operation
 */
export const recordSyncApprovalOnBlockchain = async (syncRequest, action) => {
    try {
    // Only record approvals, not rejections
        if (action !== 'approve') {
            return {
                success: true,
                recorded: false,
        message: 'Action was not an approval, no blockchain record needed'
      };
    }
    
    console.log('Sending REAL blockchain transaction for approval:', {
      approvalId: syncRequest.id,
      requestId: syncRequest.id,
      requesterId: syncRequest.requester_id,
      ownerId: syncRequest.owner_id,
      requestType: syncRequest.request_type,
      licenceKey: syncRequest.licence_key
    });
    
    // Initialize blockchain service
    const blockchainService = new Web3BlockchainService();
    
    // Record the approval on the blockchain
    const result = await blockchainService.recordSyncApproval({
      approvalId: syncRequest.id,
            requestId: syncRequest.id,
            requesterId: syncRequest.requester_id,
            ownerId: syncRequest.owner_id,
            requestType: syncRequest.request_type,
            licenceKey: syncRequest.licence_key || ''
    });
        
        if (result.success) {
            return {
                success: true,
                recorded: true,
        blockchain_data: result
            };
        } else {
            console.error('Failed to record on blockchain:', result.error);
            return {
                success: false,
        error: `Failed to record on blockchain: ${result.error}`,
        details: result.details
            };
        }
    } catch (error) {
    console.error('Error recording approval on blockchain:', error);
        return {
            success: false,
      error: `Failed to record approval on blockchain: ${error.message}`
        };
    }
};

/**
 * Get approval details from the blockchain
 * 
 * @param {string} approvalId - The ID of the approval to retrieve
 * @returns {Promise<Object>} Approval details from the blockchain
 */
export const getBlockchainApproval = async (approvalId) => {
  try {
    // Initialize blockchain service
    const blockchainService = new Web3BlockchainService();
    
    // Get the approval from the blockchain
    const result = await blockchainService.getApproval(approvalId);
    
    return result;
  } catch (error) {
    console.error('Error getting approval from blockchain:', error);
    return {
      success: false,
      error: `Failed to get approval from blockchain: ${error.message}`
    };
  }
};

/**
 * Get transaction details from the blockchain
 * 
 * @param {string} transactionHash - The transaction hash to look up
 * @returns {Promise<Object>} Transaction details from the blockchain
 */
export const getBlockchainTransaction = async (transactionHash) => {
  try {
    // Initialize blockchain service
    const blockchainService = new Web3BlockchainService();
    
    // If in mock mode (but not Ganache), return mock data
    if (blockchainService.mockMode && !blockchainService.isGanache) {
      console.log('Using mock mode for transaction lookup:', transactionHash);
      
      return {
        success: true,
        data: {
          transactionHash: transactionHash,
          blockNumber: 1757836096758,
          from: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
          to: blockchainService.contractAddress || '0x0290FB167208Af455bB137780163b7B7a9a10C16',
          gasUsed: '500000',
          status: true,
          events: [
            {
              event: 'ApprovalRecorded',
              approvalId: '05310f3f8c5dc58a7a80b1efbbc35df1',
              requesterId: 'real-requester-id-1',
              ownerId: 'real-owner-id-1',
              requestType: 'GCP',
              timestamp: Math.floor(Date.now() / 1000) - 3600
            }
          ],
          timestamp: Math.floor(Date.now() / 1000) - 3600,
          confirmations: 12
        }
      };
    }
    
    // For Ganache, use real blockchain data
    if (blockchainService.isGanache) {
      console.log('Using Ganache for real blockchain data lookup:', transactionHash);
    }
    
    // Get transaction from Web3
    const web3 = blockchainService.web3;
    
    // Get transaction
    const tx = await web3.eth.getTransaction(transactionHash);
    if (!tx) {
      return {
        success: false,
        message: 'Transaction not found'
      };
    }
    
    // Get transaction receipt
    const receipt = await web3.eth.getTransactionReceipt(transactionHash);
    
    // Get block info to get timestamp
    const block = await web3.eth.getBlock(tx.blockNumber);
    
    // Format the response
    const response = {
      transactionHash: tx.hash,
      blockNumber: tx.blockNumber,
      from: tx.from,
      to: tx.to,
      gasUsed: receipt ? receipt.gasUsed : null,
      status: receipt ? receipt.status : null,
      timestamp: block ? block.timestamp : null,
      value: web3.utils.fromWei(tx.value, 'ether'),
      confirmations: tx.blockNumber ? await web3.eth.getBlockNumber() - tx.blockNumber : 0
    };
    
    // Try to decode logs if available
    if (receipt && receipt.logs && receipt.logs.length > 0) {
      try {
        // This would require the ABI to properly decode events
        // For now, we'll just include the raw logs
        response.logs = receipt.logs;
      } catch (error) {
        console.warn('Could not decode logs:', error.message);
      }
    }
    
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error getting transaction from blockchain:', error);
    return {
      success: false,
      error: `Failed to get transaction from blockchain: ${error.message}`
    };
  }
};

/**
 * Get recent transactions from the blockchain
 * 
 * @param {number} limit - Maximum number of transactions to return
 * @param {number} fromBlock - Starting block number (optional)
 * @returns {Promise<Object>} List of recent transactions
 */
export const getRecentBlockchainTransactions = async (limit = 10, fromBlock = null) => {
  try {
    // Initialize blockchain service
    const blockchainService = new Web3BlockchainService();
    
    // Get Web3 instance
    const web3 = blockchainService.web3;
    
    // Get current block number
    const currentBlockNumber = await web3.eth.getBlockNumber();
    console.log('Current block number:', currentBlockNumber);
    
    // Convert to regular numbers to avoid BigInt issues
    const currentBlockNumberInt = Number(currentBlockNumber);
    
    // Determine starting block number
    const startBlockNumber = fromBlock || Math.max(0, currentBlockNumberInt - 100); // Look at last 100 blocks by default
    console.log('Starting from block:', startBlockNumber);
    
    // Array to store transactions
    const transactions = [];
    
    // Track the number of blocks we've processed
    let blocksProcessed = 0;
    const maxBlocksToProcess = 100; // Limit to prevent excessive processing
    
    // Process blocks in reverse order (newest first)
    for (let blockNumber = currentBlockNumberInt; 
         blockNumber >= startBlockNumber && transactions.length < limit && blocksProcessed < maxBlocksToProcess; 
         blockNumber--) {
      
      try {
        console.log(`Processing block ${blockNumber}`);
        blocksProcessed++;
        
        // Get block with transactions
        const block = await web3.eth.getBlock(blockNumber, true);
        
        if (!block) {
          console.log(`Block ${blockNumber} not found`);
          continue;
        }
        
        // Check if there are transactions in this block
        if (block.transactions && block.transactions.length > 0) {
          console.log(`Found ${block.transactions.length} transactions in block ${blockNumber}`);
          
          // Process each transaction in the block
          for (const tx of block.transactions) {
            // Check if this transaction is to our contract
            if (tx.to && tx.to.toLowerCase() === blockchainService.contractAddress?.toLowerCase()) {
              console.log(`Found transaction to our contract: ${tx.hash}`);
              
              try {
                // Get transaction receipt
                const receipt = await web3.eth.getTransactionReceipt(tx.hash);
                
                // Format transaction data
                const txData = {
                  transactionHash: tx.hash,
                  blockNumber: safeNumberConversion(tx.blockNumber),
                  from: tx.from,
                  to: tx.to,
                  gasUsed: receipt ? safeNumberConversion(receipt.gasUsed) : null,
                  status: receipt ? receipt.status : null,
                  timestamp: safeNumberConversion(block.timestamp),
                  value: web3.utils.fromWei(tx.value, 'ether'),
                  confirmations: safeNumberConversion(currentBlockNumberInt - safeNumberConversion(tx.blockNumber))
                };
                
                // Add to transactions array
                transactions.push(txData);
                
                // Check if we've reached the limit
                if (transactions.length >= limit) {
                  break;
                }
              } catch (txError) {
                console.error(`Error processing transaction ${tx.hash}:`, txError);
                // Continue to next transaction
              }
            }
          }
        }
      } catch (blockError) {
        console.error(`Error processing block ${blockNumber}:`, blockError);
        // Continue to next block
      }
    }
    
    console.log(`Processed ${blocksProcessed} blocks, found ${transactions.length} transactions`);
    
    return {
      success: true,
      data: {
        transactions,
        total: transactions.length,
        from_block: startBlockNumber,
        to_block: currentBlockNumberInt,
        blocks_processed: blocksProcessed
      }
    };
  } catch (error) {
    console.error('Error getting recent transactions from blockchain:', error);
    return {
      success: false,
      error: `Failed to get recent transactions from blockchain: ${error.message}`
    };
  }
};

/**
 * Get all transactions related to a specific approval ID
 * 
 * @param {string} approvalId - The approval ID to look up transactions for
 * @returns {Promise<Object>} All transactions related to the approval
 */
export const getApprovalTransactions = async (approvalId) => {
  try {
    // Initialize blockchain service
    const blockchainService = new Web3BlockchainService();
    
    // If in mock mode (but not Ganache), return mock data
    if (blockchainService.mockMode && !blockchainService.isGanache) {
      console.log('Using mock mode for approval transactions lookup:', approvalId);
      
      // Return mock transactions for this approval
      return {
        success: true,
        data: {
          approvalId: approvalId,
          transactions: [
            {
              type: "record",
              transactionHash: "0x7b22617070726f76616c5f6964223a2230353331306633663863356463353861376138306231656662626333356466",
              blockNumber: 1757836096758,
              from: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
              to: blockchainService.contractAddress || "0x0290FB167208Af455bB137780163b7B7a9a10C16",
              gasUsed: "500000",
              status: true,
              timestamp: Math.floor(Date.now() / 1000) - 86400,
              event: "ApprovalRecorded"
            },
            {
              type: "update",
              transactionHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
              blockNumber: 1757836096800,
              from: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
              to: blockchainService.contractAddress || "0x0290FB167208Af455bB137780163b7B7a9a10C16",
              gasUsed: "300000",
              status: true,
              timestamp: Math.floor(Date.now() / 1000) - 3600,
              event: "ApprovalUpdated"
            }
          ],
          total_transactions: 2
        }
      };
    }
    
    // For Ganache, use real blockchain data
    if (blockchainService.isGanache) {
      console.log('Using Ganache for real blockchain transactions lookup:', approvalId);
    }
    
    // For real blockchain, we need to search for events related to this approval ID
    try {
      const web3 = blockchainService.web3;
      const contract = blockchainService.contract;
      
      // First get the approval to verify it exists
      let approvalResult;
      try {
        approvalResult = await blockchainService.getApproval(approvalId);
        if (!approvalResult.success) {
          // If the approval is not found, but we're in mock mode, create a mock response
          if (blockchainService.mockMode) {
            console.log('Approval not found but in mock mode, creating mock transaction data');
            return {
              success: true,
              data: {
                approvalId: approvalId,
                transactions: [
                  {
                    type: "record",
                    transactionHash: "0x" + Buffer.from(approvalId).toString('hex').substring(0, 64),
                    blockNumber: Math.floor(Date.now() / 1000) - 3600,
                    from: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
                    to: blockchainService.contractAddress || "0x0290FB167208Af455bB137780163b7B7a9a10C16",
                    gasUsed: "500000",
                    status: true,
                    timestamp: Math.floor(Date.now() / 1000) - 3600,
                    event: "ApprovalRecorded",
                    note: "Mock data created for non-existent approval"
                  }
                ],
                total_transactions: 1,
                note: "Mock data - actual approval not found on blockchain"
              }
            };
          }
          
          return {
            success: false,
            message: 'Approval not found',
            error: approvalResult.error
          };
        }
      } catch (approvalError) {
        console.error('Error retrieving approval:', approvalError);
        
        // If we're in mock mode, create a mock response
        if (blockchainService.mockMode) {
          console.log('Error retrieving approval but in mock mode, creating mock transaction data');
          return {
            success: true,
            data: {
              approvalId: approvalId,
              transactions: [
                {
                  type: "record",
                  transactionHash: "0x" + Buffer.from(approvalId).toString('hex').substring(0, 64),
                  blockNumber: Math.floor(Date.now() / 1000) - 3600,
                  from: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
                  to: blockchainService.contractAddress || "0x0290FB167208Af455bB137780163b7B7a9a10C16",
                  gasUsed: "500000",
                  status: true,
                  timestamp: Math.floor(Date.now() / 1000) - 3600,
                  event: "ApprovalRecorded",
                  note: "Mock data created due to error retrieving approval"
                }
              ],
              total_transactions: 1,
              note: "Mock data - error retrieving approval: " + approvalError.message
            }
          };
        }
        
        return {
          success: false,
          message: 'Error retrieving approval',
          error: approvalError.message
        };
      }
      
      // Now search for events related to this approval ID
      // This is a simplified approach - in a production environment, you would
      // need to handle pagination and filter by specific event types
      let events = [];
      try {
        events = await contract.getPastEvents('allEvents', {
          fromBlock: 0,
          toBlock: 'latest'
        });
        
        // Filter events manually since the filter option might not work as expected
        events = events.filter(event => {
          if (event.returnValues && event.returnValues.approvalId) {
            return event.returnValues.approvalId === approvalId;
          }
          return false;
        });
      } catch (eventsError) {
        console.error('Error getting past events:', eventsError);
        // Continue with empty events array
      }
      
      // Process each event to get transaction details
      const transactions = [];
      for (const event of events) {
        try {
          // Get transaction details
          const tx = await web3.eth.getTransaction(event.transactionHash);
          const receipt = await web3.eth.getTransactionReceipt(event.transactionHash);
          const block = await web3.eth.getBlock(event.blockNumber);
          
          // Determine event type
          let eventType = "unknown";
          if (event.event === "ApprovalRecorded") {
            eventType = "record";
          } else if (event.event === "ApprovalDeactivated") {
            eventType = "deactivate";
          }
          
          // Add to transactions array
          transactions.push({
            type: eventType,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            from: tx ? tx.from : null,
            to: tx ? tx.to : null,
            gasUsed: receipt ? receipt.gasUsed : null,
            status: receipt ? receipt.status : null,
            timestamp: block ? block.timestamp : null,
            event: event.event
          });
        } catch (txError) {
          console.error(`Error processing transaction for event ${event.event}:`, txError);
          // Add minimal transaction info if we can't get full details
          transactions.push({
            type: "unknown",
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            event: event.event,
            error: "Could not retrieve full transaction details"
          });
        }
      }
      
      // If no transactions found, create a fallback transaction based on approval data
      if (transactions.length === 0) {
        console.log('No events found for approval ID, creating fallback transaction data');
        transactions.push({
          type: "record",
          transactionHash: approvalResult.data.transactionHash || "unknown",
          blockNumber: approvalResult.data.blockNumber || 0,
          from: "unknown",
          to: blockchainService.contractAddress || "unknown",
          status: true,
          timestamp: approvalResult.data.timestamp || Math.floor(Date.now() / 1000),
          event: "ApprovalRecorded",
          note: "Reconstructed from approval data"
        });
      }
      
      return {
        success: true,
        data: {
          approvalId: approvalId,
          transactions: transactions,
          total_transactions: transactions.length
        }
      };
    } catch (error) {
      console.error('Error searching for approval events:', error);
      
      // Check if this is an ABI error
      const isAbiError = error.message && (
        error.message.includes("Returned values aren't valid") ||
        error.message.includes("ABI") ||
        error.message.includes("Out of Gas")
      );
      
      if (isAbiError) {
        console.log('ABI error detected, using alternative approach');
        
        // If we have transaction hash in the approval data, use that
        if (approvalResult.data && approvalResult.data.transactionHash) {
          try {
            const tx = await web3.eth.getTransaction(approvalResult.data.transactionHash);
            const receipt = await web3.eth.getTransactionReceipt(approvalResult.data.transactionHash);
            const block = tx.blockNumber ? await web3.eth.getBlock(tx.blockNumber) : null;
            
            return {
              success: true,
              data: {
                approvalId: approvalId,
                transactions: [
                  {
                    type: "record",
                    transactionHash: approvalResult.data.transactionHash,
                    blockNumber: tx.blockNumber || approvalResult.data.blockNumber || 0,
                    from: tx.from || "unknown",
                    to: tx.to || blockchainService.contractAddress || "unknown",
                    gasUsed: receipt ? receipt.gasUsed : null,
                    status: receipt ? receipt.status : true,
                    timestamp: block ? block.timestamp : (approvalResult.data.timestamp || Math.floor(Date.now() / 1000)),
                    event: "ApprovalRecorded"
                  }
                ],
                total_transactions: 1,
                note: "Transaction details retrieved directly"
              }
            };
          } catch (txError) {
            console.error('Error getting transaction details directly:', txError);
          }
        }
      }
      
      // If we can't search for events, return a fallback with the approval data
      return {
        success: true,
        data: {
          approvalId: approvalId,
          transactions: [
            {
              type: "record",
              transactionHash: approvalResult.data.transactionHash || "unknown",
              blockNumber: approvalResult.data.blockNumber || 0,
              status: true,
              event: "ApprovalRecorded",
              note: "Reconstructed from approval data due to event retrieval error"
            }
          ],
          total_transactions: 1,
          note: "Limited transaction data available due to blockchain query error: " + error.message
        }
      };
    }
  } catch (error) {
    console.error('Error getting approval transactions:', error);
        return {
            success: false,
      error: `Failed to get approval transactions: ${error.message}`
        };
    }
};