
# Blockchain Integration with MetaMask & Sepolia

This directory contains the smart contract and documentation for integrating the voting system with Ethereum blockchain using MetaMask and Sepolia testnet.

## Prerequisites

1. **MetaMask Extension**: Install MetaMask browser extension
2. **Sepolia Testnet**: Configure MetaMask to use Sepolia testnet
3. **Test ETH**: Get Sepolia ETH from faucets for gas fees
4. **Remix IDE**: Use Remix IDE for contract deployment

## Setup Instructions

### 1. Install MetaMask
- Install MetaMask browser extension from metamask.io
- Create a wallet or import existing one
- Make note of your wallet address

### 2. Configure Sepolia Testnet
- Open MetaMask
- Click on network dropdown (usually shows "Ethereum Mainnet")
- Select "Sepolia test network"
- If not available, add manually:
  - Network Name: Sepolia Test Network
  - RPC URL: https://sepolia.infura.io/v3/
  - Chain ID: 11155111
  - Currency Symbol: ETH
  - Block Explorer: https://sepolia.etherscan.io

### 3. Get Test ETH
Get Sepolia ETH from these faucets:
- https://sepolia-faucet.pk910.de/
- https://sepoliafaucet.com/
- https://faucets.chain.link/sepolia

You'll need test ETH to deploy contracts and pay for transactions.

### 4. Deploy Smart Contract

1. Open Remix IDE (remix.ethereum.org)
2. Create a new file and paste the VotingContract.sol code
3. Compile the contract:
   - Go to "Solidity Compiler" tab
   - Select compiler version 0.8.19 or later
   - Click "Compile VotingContract.sol"
4. Deploy the contract:
   - Go to "Deploy & Run Transactions" tab
   - Set Environment to "Injected Provider - MetaMask"
   - Make sure MetaMask is connected and on Sepolia
   - Click "Deploy"
   - Confirm transaction in MetaMask
5. Copy the deployed contract address

### 5. Configure Backend

1. In the admin panel, click "Configure Blockchain"
2. Click "Connect MetaMask" to auto-fill wallet details
3. Enter your contract address from step 4
4. Export your private key from MetaMask:
   - Click on account menu (3 dots)
   - Select "Account Details"
   - Click "Export Private Key"
   - Enter MetaMask password
   - Copy the private key (keep it secure!)
5. Paste the private key in the configuration form
6. Click "Configure Blockchain"

## Smart Contract Features

- **Vote Recording**: Stores voter name and candidate ID immutably
- **Fraud Prevention**: Prevents duplicate voting per voter
- **Transparency**: All votes are publicly verifiable on blockchain
- **Security**: Uses cryptographic signatures for transaction integrity

## Security Notes

- Private keys are sensitive - never share them
- Use only testnet for development/testing
- For production, consider using hardware wallets or secure key management
- Smart contracts are immutable once deployed - test thoroughly

## Verification

After deployment, you can verify your contract on Sepolia Etherscan:
1. Go to sepolia.etherscan.io
2. Search for your contract address
3. View all transactions and contract interactions
4. Verify voting transparency

## Troubleshooting

**MetaMask Connection Issues:**
- Ensure MetaMask is unlocked
- Check you're on Sepolia testnet
- Refresh the page and try again

**Transaction Failures:**
- Check you have sufficient Sepolia ETH
- Increase gas limit if needed
- Verify contract address is correct

**Contract Not Found:**
- Verify deployment was successful
- Check contract address is correct
- Ensure you're on the right network (Sepolia)

## Gas Costs

Typical gas costs on Sepolia:
- Contract deployment: ~500,000 gas
- Vote casting: ~50,000 gas
- Vote checking: ~21,000 gas (read-only)

With current gas prices, each vote costs approximately 0.001 Sepolia ETH.
