/**
 * Create a custom error object with status code
 * 
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @returns {Error} Custom error object
 */
export const createError = (statusCode, message) => {
  const error = new Error(message);
  error.status = statusCode;
  return error;
};
