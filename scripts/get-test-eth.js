/**
 * Utility script to help users get test ETH for their account
 * Run with: node scripts/get-test-eth.js
 */

const Web3 = require('web3');
require('dotenv').config();

// Function to get account info
async function getAccountInfo() {
  try {
    // Check if we have the necessary environment variables
    if (!process.env.BLOCKCHAIN_RPC_URL) {
      console.error('❌ BLOCKCHAIN_RPC_URL not found in .env file');
      return null;
    }
    
    if (!process.env.BLOCKCHAIN_PRIVATE_KEY) {
      console.error('❌ BLOCKCHAIN_PRIVATE_KEY not found in .env file');
      return null;
    }
    
    // Initialize Web3
    const web3 = new Web3(process.env.BLOCKCHAIN_RPC_URL);
    
    // Format private key
    let privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey;
    }
    
    try {
      // Create account from private key
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      
      // Get account balance
      const balance = await web3.eth.getBalance(account.address);
      const balanceInEth = web3.utils.fromWei(balance, 'ether');
      
      // Get network information
      const networkId = await web3.eth.net.getId();
      let networkName;
      
      switch (networkId) {
        case 1:
          networkName = 'Ethereum Mainnet';
          break;
        case 11155111:
          networkName = 'Sepolia Testnet';
          break;
        case 5:
          networkName = 'Goerli Testnet';
          break;
        default:
          networkName = `Network ID: ${networkId}`;
      }
      
      return {
        address: account.address,
        balance: balanceInEth,
        network: networkName,
        networkId
      };
    } catch (error) {
      console.error('❌ Error creating account from private key:', error.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting account info:', error.message);
    return null;
  }
}

// Function to suggest faucets based on network
function suggestFaucet(networkId) {
  switch (networkId) {
    case 11155111:
      return [
        'https://sepoliafaucet.com/',
        'https://sepolia-faucet.pk910.de/',
        'https://faucet.sepolia.dev/'
      ];
    case 5:
      return [
        'https://goerlifaucet.com/',
        'https://faucet.goerli.mudit.blog/'
      ];
    default:
      return [
        'Search for a faucet for your specific network',
        'For custom networks, contact the network administrator'
      ];
  }
}

// Main function
async function main() {
  console.log('🔍 Checking your blockchain account...');
  
  const accountInfo = await getAccountInfo();
  
  if (!accountInfo) {
    console.log('\n❌ Failed to get account information. Please check your .env file and make sure your private key is valid.');
    return;
  }
  
  console.log('\n✅ Account Information:');
  console.log('--------------------');
  console.log(`Address: ${accountInfo.address}`);
  console.log(`Network: ${accountInfo.network}`);
  console.log(`Balance: ${accountInfo.balance} ETH`);
  
  // Check if the account needs funds
  if (parseFloat(accountInfo.balance) === 0) {
    console.log('\n⚠️ Your account has 0 ETH! You need ETH to pay for gas fees.');
    console.log('\n💡 You can get free test ETH from these faucets:');
    
    const faucets = suggestFaucet(accountInfo.networkId);
    faucets.forEach((faucet, index) => {
      console.log(`${index + 1}. ${faucet}`);
    });
    
    console.log('\n📋 Instructions:');
    console.log('1. Visit one of the faucets above');
    console.log(`2. Enter your account address: ${accountInfo.address}`);
    console.log('3. Complete any verification steps');
    console.log('4. Wait for the ETH to be sent to your account (usually takes a few minutes)');
    console.log('5. Run this script again to verify your balance has been updated');
    
    console.log('\n⚙️ Alternative: Enable mock mode');
    console.log('If you just want to test the API without real blockchain transactions:');
    console.log('1. Add USE_MOCK_MODE=true to your .env file');
    console.log('2. Restart your server');
    console.log('3. The API will simulate blockchain operations without requiring real ETH');
  } else {
    console.log('\n✅ Your account has enough ETH to pay for gas fees!');
    console.log(`You can now use the API to record approvals on the blockchain.`);
  }
}

// Run the script
main().catch(error => {
  console.error('Error running script:', error);
});
