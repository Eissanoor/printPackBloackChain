import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import blockchainRoutes from './routes/blockchainRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import { bigIntJsonMiddleware } from './utils/jsonSerializer.js';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bigIntJsonMiddleware); // Add custom JSON middleware to handle BigInt

// Make blockchain config available to routes
app.set('blockchainConfig', {
  enabled: process.env.BLOCKCHAIN_ENABLED === 'true',
  rpcUrl: process.env.BLOCKCHAIN_RPC_URL,
  contractAddress: process.env.CONTRACT_ADDRESS
});

// Routes
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/requests', requestRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Print & Pack Blockchain Integration API',
    version: '1.0.0',
    endpoints: {
      blockchain: '/api/blockchain',
      requests: '/api/requests'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // Create the error response object
  const errorResponse = {
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  };
  
  try {
    // Try to send the JSON response normally
    res.status(err.status || 500).json(errorResponse);
  } catch (jsonError) {
    // If there's a BigInt serialization error, use our safe stringify
    if (jsonError.message && jsonError.message.includes('BigInt')) {
      console.warn('Caught BigInt serialization error in error handler');
      const { safeStringify } = require('./utils/jsonSerializer.js');
      
      // Set the content type header
      res.setHeader('Content-Type', 'application/json');
      
      // Send the response using our safe stringify
      res.status(err.status || 500).send(safeStringify(errorResponse));
    } else {
      // For other JSON errors, send a simplified response
      res.status(500).send(JSON.stringify({
        success: false,
        message: 'Internal Server Error',
        error: 'Error serializing response'
      }));
    }
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Print & Pack Blockchain API running on port ${PORT}`);
  
  // Log blockchain integration status
  if (process.env.BLOCKCHAIN_ENABLED === 'true') {
    console.log(`Blockchain integration enabled`);
    console.log(`Contract address: ${process.env.CONTRACT_ADDRESS}`);
    console.log(`RPC URL: ${process.env.BLOCKCHAIN_RPC_URL}`);
  } else {
    console.log('Blockchain integration is disabled');
  }
  
  console.log('API Endpoints:');
  console.log('- POST /api/blockchain/record-approval - Record a sync approval');
  console.log('- GET /api/blockchain/approval/:approvalId - Get approval details');
  console.log('- GET /api/blockchain/all-approvals - Get all approvals from the blockchain');
  console.log('- GET /api/blockchain/search-approvals - Search for approvals with various parameters');
  console.log('- GET /api/blockchain/status - Check blockchain integration status');
  console.log('- POST /api/requests/requestAction - Approve or reject a sync request');
  console.log('- GET /api/requests/getSyncRequests - Get all sync requests with optional filtering');
});

export default app;
