import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import blockchainRoutes from './routes/blockchainRoutes.js';

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

// Make blockchain config available to routes
app.set('blockchainConfig', {
  enabled: process.env.BLOCKCHAIN_ENABLED === 'true',
  rpcUrl: process.env.BLOCKCHAIN_RPC_URL,
  contractAddress: process.env.CONTRACT_ADDRESS
});

// Routes
app.use('/api/blockchain', blockchainRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Print & Pack Blockchain Integration API',
    version: '1.0.0',
    endpoints: {
      blockchain: '/api/blockchain'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
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
  console.log('- GET /api/blockchain/status - Check blockchain integration status');
});

export default app;
