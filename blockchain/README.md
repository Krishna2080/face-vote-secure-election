
# Blockchain Integration Setup Guide

## Overview
This guide will help you deploy the SecureVoting smart contract on Ethereum Sepolia testnet and configure the backend to interact with it.

## Prerequisites
1. MetaMask wallet installed
2. Sepolia ETH for gas fees (get from faucet)
3. Infura or Alchemy account for RPC access
4. Remix IDE access

## Step 1: Get Sepolia ETH
1. Visit a Sepolia faucet (e.g., https://sepoliafaucet.com/)
2. Enter your wallet address
3. Request test ETH

## Step 2: Deploy Smart Contract
1. Open Remix IDE (https://remix.ethereum.org/)
2. Create a new file called `VotingContract.sol`
3. Copy the contract code from `VotingContract.sol`
4. Compile the contract (Solidity version 0.8.19+)
5. Connect MetaMask to Sepolia network
6. Deploy the contract with initial candidates array

Example deployment parameters:
```javascript
["candidate1", "candidate2", "candidate3"]
```

## Step 3: Configure Backend
1. Update `backend/blockchain_service.py` with:
   - Contract address from deployment
   - Your Infura/Alchemy RPC URL
   - Your wallet private key
   - Your wallet address

## Step 4: Configure Frontend
1. Use the admin panel to configure blockchain settings
2. Enter the contract address and RPC details
3. Test the connection

## Smart Contract Functions

### Main Functions
- `castVote(string voterName, string candidateId)` - Cast a vote
- `hasVoted(string voterName)` - Check if voter has voted
- `getCandidateVotes(string candidateId)` - Get vote count for candidate
- `getResults()` - Get all results

### Admin Functions
- `toggleVoting()` - Enable/disable voting
- `addCandidate(string candidateId)` - Add new candidate

## Security Features
- One vote per voter enforced by smart contract
- Immutable vote storage
- Event logging for transparency
- Admin-only functions for election management

## Testing
1. Deploy contract on Sepolia
2. Configure backend with contract details
3. Register voters through face recognition
4. Test voting process
5. Verify votes on blockchain explorer

## Troubleshooting

### Common Issues
1. **Gas estimation failed**: Ensure you have enough Sepolia ETH
2. **Contract not found**: Verify contract address is correct
3. **RPC connection failed**: Check Infura/Alchemy URL and API key
4. **Transaction reverted**: Check if voting is active and voter hasn't voted

### Verification
- Check transactions on Sepolia Etherscan
- Verify vote counts match frontend display
- Test duplicate voting prevention

## Production Considerations
- Use mainnet for real elections
- Implement additional access controls
- Consider gas optimization
- Add comprehensive event logging
- Implement emergency pause functionality
