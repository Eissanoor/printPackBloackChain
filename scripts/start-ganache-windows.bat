@echo off
echo Starting Ganache with persistent data...

:: Create data directory if it doesn't exist
if not exist "ganache-data" mkdir ganache-data

:: Start Ganache with persistence
npx ganache --db ganache-data --deterministic --networkId 1337 --chain.chainId 1337 --wallet.totalAccounts 10 --wallet.defaultBalance 1000 --miner.blockTime 0 --server.host 0.0.0.0 --server.port 8545
