
# Blockchain Integration Guide

This guide will help you set up blockchain integration for SecureVote using MetaMask and Remix IDE with Sepolia testnet.

## Prerequisites

1. **MetaMask Browser Extension**
   - Install from [metamask.io](https://metamask.io)
   - Create a wallet or import existing one

2. **Sepolia Testnet ETH**
   - Get free test ETH from [Sepolia Faucet](https://sepolia-faucet.pk910.de)
   - You'll need ~0.01 ETH for deployment and transactions

## Step-by-Step Setup

### 1. Configure MetaMask

1. Open MetaMask extension
2. Click on network dropdown (usually shows "Ethereum Mainnet")
3. Select "Add Network" or "Custom RPC"
4. Add Sepolia testnet with these details:
   - **Network Name:** Sepolia Test Network
   - **RPC URL:** https://rpc.sepolia.org
   - **Chain ID:** 11155111
   - **Currency Symbol:** ETH
   - **Block Explorer:** https://sepolia.etherscan.io

### 2. Get Testnet ETH

1. Visit [Sepolia Faucet](https://sepolia-faucet.pk910.de)
2. Enter your MetaMask wallet address
3. Request test ETH (usually 0.05 ETH per request)
4. Wait for confirmation in MetaMask

### 3. Deploy Smart Contract using Remix

1. Open [Remix IDE](https://remix.ethereum.org)
2. Create a new file called `SecureVoting.sol`
3. Copy the contract code from `VotingContract.sol` in this directory
4. Go to "Solidity Compiler" tab and compile the contract
5. Go to "Deploy & Run Transactions" tab
6. Select "Injected Provider - MetaMask" as environment
7. Ensure MetaMask is connected to Sepolia testnet
8. Deploy the contract with candidate names as constructor parameter
   - Example: `["Alice Johnson", "Bob Smith", "Carol Williams"]`
9. Copy the deployed contract address

### 4. Configure SecureVote Application

1. Go to Admin Panel in the SecureVote application
2. Click "Configure Blockchain"
3. Connect MetaMask when prompted
4. Enter the deployed contract address
5. Export your private key from MetaMask:
   - Click on account menu → Account Details → Export Private Key
   - Enter your MetaMask password
   - Copy the private key
6. Paste the private key in the configuration form
7. Click "Configure Blockchain"

### 5. Test the Setup

1. Register a voter with face authentication
2. Authenticate and cast a vote
3. Check the transaction hash on [Sepolia Etherscan](https://sepolia.etherscan.io)
4. Verify the vote was recorded on the blockchain

## Smart Contract Features

- **Fraud Prevention:** Each voter can only vote once
- **Transparency:** All votes are publicly verifiable
- **Immutability:** Votes cannot be changed or deleted
- **Real-time Results:** Vote counts are updated instantly

## Troubleshooting

### Common Issues

1. **"Insufficient funds" error**
   - Get more test ETH from the faucet
   - Ensure you're on Sepolia testnet, not mainnet

2. **"Transaction failed" error**
   - Check gas limit (should be around 300,000)
   - Ensure contract address is correct
   - Verify you're on Sepolia testnet

3. **"Contract not found" error**
   - Double-check the contract address
   - Ensure the contract was deployed successfully
   - Verify you're using the correct network

4. **MetaMask connection issues**
   - Refresh the page and try again
   - Check if MetaMask is unlocked
   - Switch to Sepolia testnet in MetaMask

### Verification Steps

1. **Check transaction on Etherscan:**
   ```
   https://sepolia.etherscan.io/tx/[YOUR_TX_HASH]
   ```

2. **Verify contract on Etherscan:**
   ```
   https://sepolia.etherscan.io/address/[YOUR_CONTRACT_ADDRESS]
   ```

3. **Check wallet balance:**
   - Open MetaMask
   - Ensure you're on Sepolia testnet
   - Check ETH balance

## Security Notes

- **Never use mainnet:** This is for testing only, use Sepolia testnet
- **Keep private keys secure:** Don't share your private key
- **Test thoroughly:** Verify all functionality before production use
- **Backup wallet:** Keep your MetaMask seed phrase safe

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all configuration steps
3. Ensure backend is running on `http://localhost:8000`
4. Check MetaMask is connected to Sepolia testnet

## Contract Deployment Example

Here's an example of how to deploy using Remix:

1. Constructor parameters for 3 candidates:
   ```
   ["Alice Johnson", "Bob Smith", "Carol Williams"]
   ```

2. After deployment, you'll get an address like:
   ```
   0x1234567890123456789012345678901234567890
   ```

3. Use this address in the SecureVote configuration.

Now your SecureVote application will generate real blockchain transactions on Sepolia testnet!
