/**
 * Utility script to validate a private key format
 * Run with: node scripts/validate-private-key.js YOUR_PRIVATE_KEY
 */

// Function to validate private key
function validatePrivateKey(key) {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'Private key must be a non-empty string' };
  }
  
  // Remove 0x prefix if present
  const cleanKey = key.startsWith('0x') ? key.substring(2) : key;
  
  // Check if it's a valid hex string of correct length (64 characters = 32 bytes)
  if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
    return { 
      valid: false, 
      error: 'Private key must be a 64-character hexadecimal string',
      details: {
        length: cleanKey.length,
        expected: 64,
        containsNonHex: /[^0-9a-fA-F]/.test(cleanKey)
      }
    };
  }
  
  // Return with 0x prefix
  return { 
    valid: true, 
    formattedKey: '0x' + cleanKey,
    message: 'Private key is valid'
  };
}

// Main function
function main() {
  // Get private key from command line argument
  const privateKey = process.argv[2];
  
  if (!privateKey) {
    console.error('Please provide a private key as a command line argument');
    console.error('Usage: node scripts/validate-private-key.js YOUR_PRIVATE_KEY');
    process.exit(1);
  }
  
  // Validate the private key
  const result = validatePrivateKey(privateKey);
  
  if (result.valid) {
    console.log('✅ Private key is valid!');
    console.log('Formatted key (with 0x prefix):', result.formattedKey);
    console.log('You can use this private key in your .env file');
  } else {
    console.error('❌ Invalid private key:', result.error);
    
    if (result.details) {
      console.error('Details:');
      console.error(`- Length: ${result.details.length} characters (should be 64)`);
      console.error(`- Contains non-hexadecimal characters: ${result.details.containsNonHex ? 'Yes' : 'No'}`);
    }
    
    console.error('\nA valid private key:');
    console.error('- Is 64 hexadecimal characters (0-9, a-f, A-F)');
    console.error('- May optionally start with "0x"');
    console.error('- Example format: 1a2b3c4d5e6f...890 (64 characters total)');
    console.error('\nPlease check your private key and try again');
  }
}

// Run the script
main();
