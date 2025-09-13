import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Simple API key authentication middleware
 * For production, consider using JWT or OAuth
 */
export const apiKeyAuth = (req, res, next) => {
  try {
    // Get API key from header
    const apiKey = req.headers['x-api-key'];
    
    // Check if API key is provided
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key is required',
        error: 'Unauthorized'
      });
    }
    
    // Check if API key is valid
    // In production, store API keys securely in a database
    const validApiKey = process.env.API_KEY || 'print-pack-blockchain-api-key';
    
    if (apiKey !== validApiKey) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key',
        error: 'Unauthorized'
      });
    }
    
    // API key is valid, proceed
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

/**
 * Mock authentication middleware for testing
 * This simulates the existing auth middleware from the Print & Pack system
 */
export const generalAuth = (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    // Check if token is provided
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required',
        error: 'Unauthorized'
      });
    }
    
    // In a real implementation, verify the token
    // For testing, we'll just set a mock user
    req.user = {
      userId: 'test-user-id',
      email: 'test@example.com',
      role: 'admin'
    };
    
    // Token is valid, proceed
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};
