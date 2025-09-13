import dotenv from 'dotenv';
import BlockchainService from './services/blockchainService.js';
import blockchainConfig from './config/blockchain.config.js';

// Load environment variables
dotenv.config();

/**
 * Initialize blockchain integration
 */
const initializeBlockchain = () => {
    try {
        // Check if blockchain integration is enabled
        if (!blockchainConfig.enabled) {
            console.log('Blockchain integration is disabled. Set BLOCKCHAIN_ENABLED=true to enable.');
            return false;
        }
        
        // Check if required configuration is present
        if (!blockchainConfig.rpcUrl || !blockchainConfig.privateKey || !blockchainConfig.contractAddress) {
            console.error('Missing blockchain configuration. Please check your environment variables.');
            return false;
        }
        
        // Create blockchain service instance to test connection
        const blockchainService = new BlockchainService();
        
        console.log('Blockchain integration initialized successfully.');
        console.log(`Contract address: ${blockchainConfig.contractAddress}`);
        console.log(`RPC URL: ${blockchainConfig.rpcUrl}`);
        
        return true;
    } catch (error) {
        console.error('Failed to initialize blockchain integration:', error);
        return false;
    }
};

/**
 * Main function
 */
const main = async () => {
    console.log('Print & Pack Blockchain Integration');
    console.log('==================================');
    
    const blockchainInitialized = initializeBlockchain();
    
    if (blockchainInitialized) {
        console.log('Ready to record product sync approvals on blockchain.');
    } else {
        console.log('Blockchain integration is not available. Product sync approvals will only be recorded in the database.');
    }
};

// Run the main function
main().catch(error => {
    console.error('Error in main function:', error);
});
