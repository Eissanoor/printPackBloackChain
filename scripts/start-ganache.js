import ganache from 'ganache';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration for Ganache
const options = {
  // Generate 10 accounts with 100 ETH each
  wallet: {
    totalAccounts: 10,
    defaultBalance: 100
  },
  // Log all requests to the console
  logging: {
    quiet: false
  },
  // Chain ID for local development
  chain: {
    chainId: 1337
  },
  // Enable mining
  miner: {
    blockTime: 0 // Mine immediately
  }
};

// Start Ganache server
const server = ganache.server(options);
const PORT = 8545;

server.listen(PORT, async (err) => {
  if (err) {
    console.error(`Error starting Ganache: ${err}`);
    process.exit(1);
  }
  
  console.log(`Ganache running at http://localhost:${PORT}`);
  
  // Get the generated accounts
  const provider = server.provider;
  const accounts = await provider.request({ method: "eth_accounts", params: [] });
  
  // Get the private key for the first account
  const wallet = provider.getInitialAccounts();
  const firstAccount = Object.keys(wallet)[0];
  const privateKey = wallet[firstAccount].secretKey.substring(2); // Remove '0x' prefix
  
  console.log(`\nAvailable Accounts:`);
  accounts.forEach((account, i) => {
    console.log(`(${i}) ${account} (100 ETH)`);
  });
  
  console.log(`\nPrivate Key for first account:`);
  console.log(privateKey);
  
  // Save account info to a file for easy access
  const accountsInfo = {
    accounts,
    firstAccount: accounts[0],
    privateKey
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../ganache-accounts.json'),
    JSON.stringify(accountsInfo, null, 2)
  );
  
  console.log(`\nAccount info saved to ganache-accounts.json`);
  console.log(`\nTo use this account for deployment:`);
  console.log(`1. Add to your .env file:`);
  console.log(`   BLOCKCHAIN_RPC_URL=http://localhost:8545`);
  console.log(`   BLOCKCHAIN_PRIVATE_KEY=${privateKey}`);
  console.log(`\n2. Run the deployment script:`);
  console.log(`   npm run deploy:local`);
  
  console.log(`\nPress Ctrl+C to stop the Ganache server`);
});
