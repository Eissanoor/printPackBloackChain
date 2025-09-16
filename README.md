# Print & Pack Blockchain Integration

This project integrates blockchain technology with the Print & Pack product synchronization system, allowing product sync requests and approvals to be recorded on the blockchain.

## Setup Instructions

### Prerequisites

- Node.js v16+ and npm
- Git

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd printPackBlockChain
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Running the Application

### Windows-Specific Instructions

If you're on Windows, use these commands:

#### Option 1: Step-by-Step (Recommended for Windows)

1. Setup environment:
   ```
   npm run setup
   ```

2. Start Ganache (in one terminal window):
   ```
   npm run ganache-win
   ```

3. In a new terminal, compile and deploy:
   ```
   npm run deploy-simple
   ```

4. Start the application:
   ```
   npm run dev
   ```

#### Option 2: Combined Run for Windows

After setup, you can use:
```
npm run real-data-mode-win
```

### For All Operating Systems

### Option 1: One-Command Setup and Run

The easiest way to get started is with our all-in-one command:

```
npm run all-in-one
```

This command will:
1. Create the necessary directories
2. Create the `.env` file automatically
3. Start Ganache with persistent storage
4. Compile the smart contract
5. Deploy the contract
6. Start the application

### Option 2: Step-by-Step Setup

If you prefer to run each step individually:

#### 1. Setup Environment

This creates the `.env` file and necessary directories:

```
npm run setup
```

#### 2. Start the Blockchain with Persistent Data

```
npm run ganache
```

This starts a local blockchain at http://localhost:8545 with data stored in the `ganache-data` directory. The data will persist between restarts.

#### 3. Compile and Deploy the Smart Contract

```
npm run deploy-simple
```

#### 4. Run the Application

```
npm run dev
```

### Option 3: Combined Run (after setup)

After initial setup, you can use:

```
npm run real-data-mode
```

This starts Ganache, deploys the contract, and runs the application.

## How It Works

1. **Persistent Blockchain Data**: The blockchain data is stored in the `ganache-data` directory, ensuring that your data persists between Ganache restarts.

2. **Smart Contract**: The `PrintPackSync` smart contract manages product synchronization requests and approvals on the blockchain.

3. **Integration**: The application integrates with the blockchain to record all sync requests, approvals, and product data.

## Database Schema

The system uses both a traditional database (SQL Server) and blockchain storage:

- **Traditional Database**: Stores user data, product details, and sync requests
- **Blockchain**: Records immutable proof of sync requests, approvals, and product data

## Troubleshooting

### Blockchain Data Reset

If your blockchain data is being reset between restarts:

1. Make sure you're using the `npm run ganache` command to start Ganache
2. Check that the `ganache-data` directory exists and has write permissions
3. Verify that you're not using a different command to start Ganache that doesn't include the `--db` option

### Contract Deployment Issues

If contract deployment fails:

1. Make sure Ganache is running (`npm run ganache`)
2. Check that the contract compiles successfully (`npm run compile`)
3. Verify the Web3 provider URL in your `.env` file