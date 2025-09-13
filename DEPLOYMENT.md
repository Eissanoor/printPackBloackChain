# Print & Pack Blockchain Integration Deployment Guide

This document provides step-by-step instructions for deploying the Print & Pack Blockchain Integration.

## Prerequisites

- Node.js v14+ and npm
- Access to an Ethereum-compatible blockchain network
- Ethereum account with sufficient funds for contract deployment and transactions
- Access to the Print & Pack application codebase

## Deployment Steps

### 1. Deploy the Smart Contract

#### Option 1: Using Remix IDE (Easiest)

1. Go to [Remix IDE](https://remix.ethereum.org/)
2. Create a new file named `PrintPackSyncApproval.sol`
3. Copy the content from `contracts/PrintPackSyncApproval.sol` into the file
4. Compile the contract (Solidity compiler v0.8.0+)
5. Deploy the contract to your chosen network (Ethereum Mainnet, Testnet, or other compatible networks)
6. Save the deployed contract address

#### Option 2: Using Hardhat/Truffle (Advanced)

1. Set up a Hardhat or Truffle project
2. Add the contract to the project
3. Configure the deployment network
4. Deploy using the framework's deployment commands
5. Save the deployed contract address

### 2. Set Up Environment Variables

1. Create a `.env` file in the project root with the following variables:
   ```
   BLOCKCHAIN_RPC_URL=https://your-rpc-url
   BLOCKCHAIN_PRIVATE_KEY=your-private-key
   CONTRACT_ADDRESS=your-deployed-contract-address
   BLOCKCHAIN_ENABLED=true
   ```

2. Replace placeholders with your actual values:
   - `BLOCKCHAIN_RPC_URL`: The RPC URL for your blockchain network
   - `BLOCKCHAIN_PRIVATE_KEY`: Your Ethereum account private key (without the '0x' prefix)
   - `CONTRACT_ADDRESS`: The address of the deployed PrintPackSyncApproval contract
   - `BLOCKCHAIN_ENABLED`: Set to 'true' to enable blockchain integration

### 3. Install Dependencies

```bash
npm install
```

### 4. Test the Integration

```bash
npm test
```

Ensure that the test runs successfully and can interact with your deployed contract.

### 5. Integrate with Print & Pack Application

#### Option 1: As a Standalone Service

1. Deploy this project as a separate microservice
2. Configure the Print & Pack application to call this service's API endpoints when approving sync requests

#### Option 2: Integrated Directly

1. Copy the following directories to your Print & Pack project:
   - `src/services/blockchainService.js`
   - `src/controllers/blockchainController.js`
   - `src/utils/idGenerator.js`
   - `src/config/blockchain.config.js`

2. Update the `approveSyncRequest` controller in your Print & Pack project to include the blockchain integration code

### 6. Production Deployment

For production deployment, consider the following:

1. **Security**:
   - Store private keys securely using a vault service or environment variables
   - Implement proper access controls
   - Consider using a dedicated account with limited funds

2. **Monitoring**:
   - Set up logging for blockchain transactions
   - Monitor gas costs and transaction success rates
   - Implement alerts for failed transactions

3. **Scaling**:
   - Consider using a queue for blockchain transactions to handle high load
   - Implement retry mechanisms for failed transactions

4. **Backup**:
   - Keep a backup of the contract address and ABI
   - Document the deployment process for future reference

## Verification

After deployment, verify the integration by:

1. Approving a sync request through the Print & Pack application
2. Checking that the approval is recorded on the blockchain
3. Verifying that the transaction reference is included in the response and email notification

## Troubleshooting

### Common Issues

1. **Transaction Failures**:
   - Check gas price and limit
   - Verify account balance
   - Check network congestion

2. **Contract Interaction Errors**:
   - Verify contract address
   - Check ABI matches the deployed contract
   - Ensure function parameters match expected types

3. **Connection Issues**:
   - Verify RPC URL is correct and accessible
   - Check network status
   - Try alternative RPC providers

### Support

For additional support, contact the Print & Pack development team.
