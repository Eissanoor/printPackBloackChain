# Print & Pack Blockchain Integration

This project integrates the Print & Pack product sync approval system with blockchain technology to provide an immutable record of product sync approvals.

## Overview

When a product owner approves a sync request from another user, the approval is recorded on the blockchain, providing transparency and traceability for all product sync operations.

## Features

- Records product sync approvals on the blockchain
- Provides transaction references for approved sync requests
- Supports both GCP and Excel sync requests
- Integrates with the existing Print & Pack system
- Uses Web3.js and Ganache for simplified blockchain interaction

## Prerequisites

- Node.js v14+ and npm
- For local development: No additional requirements (uses Ganache)
- For production: Access to an Ethereum-compatible blockchain network

## Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd printPackBlockChain
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   # Blockchain Configuration
   BLOCKCHAIN_RPC_URL=http://localhost:8545
   BLOCKCHAIN_PRIVATE_KEY=your-private-key-with-or-without-0x-prefix
   CONTRACT_ADDRESS=your-deployed-contract-address
   
   # Database Configuration
   DATABASE_URL="DATABASE_URL"
   
   # Blockchain Settings
   BLOCKCHAIN_ENABLED=true
   
   # Mock Fallback Settings (optional)
   ALLOW_MOCK_FALLBACK=false
   ```
   
   > **IMPORTANT**: The private key must be a valid 64-character hexadecimal string (with or without the '0x' prefix). You can validate your private key by running:
   > ```
   > node scripts/validate-private-key.js YOUR_PRIVATE_KEY
   > ```

## Local Development

There are three ways to run the blockchain integration:

### 1. FREE MODE: Using Ganache (Recommended for Development)

This method uses a local Ganache blockchain that runs on your machine. It's completely free and doesn't require any external connections or real ETH.

#### Step-by-Step Instructions:

1. First, set up the Ganache environment:
   ```
   npm run setup-ganache
   ```
   This creates a `.env` file with the correct Ganache settings.

2. In a separate terminal, start Ganache:
   ```
   npx ganache --deterministic
   ```
   This starts a local blockchain with pre-funded accounts.

3. Start your API server:
   ```
   npm start
   ```

#### Important Notes for Ganache Mode:

- Make sure `BLOCKCHAIN_NETWORK=ganache` is in your `.env` file (the setup script adds this)
- Ganache accounts come with 1000 ETH each, so you won't need to get test ETH
- The first account in Ganache will be used automatically for transactions
- Keep the Ganache terminal window open while using the API

#### Troubleshooting:

If you see "insufficient funds" errors:
1. Make sure Ganache is running in a separate terminal
2. Check that your `.env` file has `BLOCKCHAIN_NETWORK=ganache`
3. Try restarting both Ganache and your API server

If you see "Do not know how to serialize a BigInt" errors:
1. This is fixed in the latest version with a custom JSON serializer
2. Make sure you're using the latest version of the code
3. The API automatically converts BigInt values to strings in JSON responses

### 2. Using the Mock Implementation

This method simulates blockchain operations without an actual blockchain.

1. Set up your `.env` file with mock mode enabled:
   ```
   BLOCKCHAIN_RPC_URL=http://localhost:8545
   BLOCKCHAIN_PRIVATE_KEY=your-private-key
   CONTRACT_ADDRESS=your-contract-address
   BLOCKCHAIN_ENABLED=true
   USE_MOCK_MODE=true
   ```

2. Start the API server:
   ```
   npm start
   ```

The mock implementation will:
- Log all blockchain operations to the console
- Generate mock transaction hashes
- Return mock data for blockchain queries
- Work without requiring any real ETH in your account

### 3. Using a Public Testnet (Requires Test ETH)

If you want to use a public testnet (like Sepolia), you'll need test ETH to pay for gas fees:

1. Run the helper script to check your account and get instructions:
   ```
   node scripts/get-test-eth.js
   ```

2. Follow the instructions to get test ETH from a faucet
3. Once your account has ETH, you can use the real blockchain without mock mode


## Production Deployment

To deploy to a public testnet or mainnet:

1. Update your `.env` file with the appropriate RPC URL and a funded private key:
   ```
   BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/your-infura-key
   BLOCKCHAIN_PRIVATE_KEY=your-private-key-with-funds
   ```

2. Deploy the contract:
   ```
   npm run deploy:sepolia
   ```

## Integration with Print & Pack System

The blockchain integration works with the existing Print & Pack system by:

1. When a product owner approves a sync request, the `approveSyncRequest` controller calls the blockchain service
2. The approval details are recorded on the blockchain using the smart contract
3. A transaction reference is generated and included in the response and email notification
4. Users can verify the approval on the blockchain using the transaction reference

## Smart Contract

The `PrintPackSyncApproval` smart contract provides the following functions:

- `recordApproval`: Records a new sync approval on the blockchain
- `deactivateApproval`: Deactivates an existing approval (e.g., if access is revoked)
- `getApproval`: Retrieves details of a recorded approval

## Running the API

1. Ensure you have set up the `.env` file with valid blockchain credentials
2. Start the API server:
   ```
   npm start
   ```
   Or for development with auto-reload:
   ```
   npm run dev
   ```
3. The API will be available at http://localhost:3000

## API Documentation

### Endpoints

#### Blockchain API

1. **Record Approval on Blockchain**
   - `POST /api/blockchain/record-approval`
   - Records a sync approval on the blockchain
   - Requires API key authentication
   - Request body:
     ```json
     {
       "syncRequest": {
         "id": "request-id",
         "requester_id": "requester-user-id",
         "owner_id": "owner-user-id",
         "request_type": "gcp",
         "licence_key": "GS1-12345-ABC"
       },
       "action": "approve"
     }
     ```

2. **Get Approval Details**
   - `GET /api/blockchain/approval/:approvalId`
   - Retrieves details of a recorded approval from the blockchain
   - Requires API key authentication

3. **Check Blockchain Status**
   - `GET /api/blockchain/status`
   - Returns the current status of the blockchain integration
   - Requires API key authentication

#### Integration with Print & Pack System

The existing Print & Pack API endpoints that now include blockchain integration:

1. **Approve/Reject Sync Request**
   - `POST /api/requests/requestAction`
   - Approves or rejects a sync request and records on blockchain if approved
   - Request body:
     ```json
     {
       "request_id": "request-id",
       "action": "approve",
       "message": "Optional message"
     }
     ```

For detailed examples and more information, see the [POSTMAN_EXAMPLES.md](./POSTMAN_EXAMPLES.md) file.

## Testing

### Testing with Mock Implementation

1. Run the test script with the mock implementation:
   ```
   npm test
   ```
   This will use the mock blockchain service and won't require an actual blockchain connection.

2. Test the API using Postman with the examples provided in POSTMAN_EXAMPLES.md

### Testing with Real Blockchain (Optional)

If you want to test with an actual blockchain:

1. Start the local Ganache blockchain:
   ```
   npm run ganache
   ```

2. Deploy the contract:
   ```
   npm run deploy:local
   ```

3. Update the Web3BlockchainService.js file to use the real Web3 implementation

4. Run the test script:
   ```
   npm test
   ```

## Security Considerations

- The private key in the `.env` file should be kept secure and never committed to version control
- Consider using a dedicated account with limited funds for blockchain transactions
- Implement proper access controls to prevent unauthorized use of the blockchain integration

## License

[Specify License]