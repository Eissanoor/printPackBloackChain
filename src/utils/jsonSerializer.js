/**
 * Custom JSON serializer to handle BigInt values
 * 
 * This utility provides methods to safely serialize and deserialize JSON data
 * that may contain BigInt values, which are not natively supported by JSON.stringify
 */

/**
 * Custom replacer function for JSON.stringify that converts BigInt to strings
 * @param {string} key - The key in the object being stringified
 * @param {any} value - The value being stringified
 * @returns {any} The processed value
 */
export const bigIntReplacer = (key, value) => {
  // Check if the value is a BigInt
  if (typeof value === 'bigint') {
    // Convert BigInt to string with a marker
    return value.toString();
  }
  return value;
};

/**
 * Safely stringify an object that may contain BigInt values
 * @param {Object} obj - The object to stringify
 * @returns {string} JSON string
 */
export const safeStringify = (obj) => {
  return JSON.stringify(obj, bigIntReplacer);
};

/**
 * Custom JSON middleware for Express
 * Replaces the default Express JSON.stringify with our BigInt-safe version
 */
export const bigIntJsonMiddleware = (req, res, next) => {
  // Save the original res.json method
  const originalJson = res.json;
  
  // Override res.json to use our safe stringify
  res.json = function(body) {
    try {
      // Use the original json method but with our custom stringify
      return originalJson.call(this, body);
    } catch (error) {
      // If there's an error (like "Do not know how to serialize a BigInt")
      if (error.message && error.message.includes('BigInt')) {
        console.warn('Caught BigInt serialization error, using custom serializer');
        
        // Set the content type header
        res.setHeader('Content-Type', 'application/json');
        
        // Send the response using our safe stringify
        return res.send(safeStringify(body));
      }
      
      // For other errors, just throw them
      throw error;
    }
  };
  
  next();
};
