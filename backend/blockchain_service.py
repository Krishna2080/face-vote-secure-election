
import os
from web3 import Web3
from typing import Dict, Any, Optional
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BlockchainService:
    def __init__(self):
        # Sepolia testnet configuration
        self.rpc_url = "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID"  # Replace with your Infura project ID
        self.web3 = Web3(Web3.HTTPProvider(self.rpc_url))
        
        # Contract configuration (to be updated after deployment)
        self.contract_address = "0x0000000000000000000000000000000000000000"  # Update after deployment
        self.private_key = "YOUR_PRIVATE_KEY"  # Replace with your private key
        self.account_address = "YOUR_ACCOUNT_ADDRESS"  # Replace with your account address
        
        # Contract ABI (simplified version)
        self.contract_abi = [
            {
                "inputs": [
                    {"internalType": "string", "name": "_voterName", "type": "string"},
                    {"internalType": "string", "name": "_candidateId", "type": "string"}
                ],
                "name": "castVote",
                "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "string", "name": "_voterName", "type": "string"}],
                "name": "hasVoted",
                "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "string", "name": "_candidateId", "type": "string"}],
                "name": "getCandidateVotes",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getResults",
                "outputs": [
                    {"internalType": "string[]", "name": "", "type": "string[]"},
                    {"internalType": "uint256[]", "name": "", "type": "uint256[]"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "anonymous": False,
                "inputs": [
                    {"indexed": True, "internalType": "string", "name": "voterName", "type": "string"},
                    {"indexed": True, "internalType": "string", "name": "candidateId", "type": "string"},
                    {"indexed": False, "internalType": "uint256", "name": "timestamp", "type": "uint256"},
                    {"indexed": False, "internalType": "bytes32", "name": "txHash", "type": "bytes32"}
                ],
                "name": "VoteCast",
                "type": "event"
            }
        ]
        
        self.contract = None
        self._initialize_contract()
    
    def _initialize_contract(self):
        """Initialize the smart contract instance"""
        try:
            if self.contract_address != "0x0000000000000000000000000000000000000000":
                self.contract = self.web3.eth.contract(
                    address=self.contract_address,
                    abi=self.contract_abi
                )
                logger.info("Blockchain contract initialized successfully")
            else:
                logger.warning("Contract address not configured")
        except Exception as e:
            logger.error(f"Failed to initialize contract: {str(e)}")
    
    def is_connected(self) -> bool:
        """Check if connected to Ethereum network"""
        try:
            return self.web3.is_connected()
        except Exception as e:
            logger.error(f"Connection check failed: {str(e)}")
            return False
    
    def cast_vote_on_blockchain(self, voter_name: str, candidate_id: str) -> Dict[str, Any]:
        """Cast vote on blockchain"""
        try:
            if not self.contract:
                return {
                    "success": False,
                    "message": "Blockchain contract not initialized",
                    "tx_hash": None
                }
            
            if not self.is_connected():
                return {
                    "success": False,
                    "message": "Not connected to Ethereum network",
                    "tx_hash": None
                }
            
            # Check if voter has already voted on blockchain
            if self.has_voted_on_blockchain(voter_name):
                return {
                    "success": False,
                    "message": "Voter has already voted on blockchain",
                    "tx_hash": None
                }
            
            # Build transaction
            transaction = self.contract.functions.castVote(voter_name, candidate_id).build_transaction({
                'from': self.account_address,
                'gas': 200000,
                'gasPrice': self.web3.to_wei('20', 'gwei'),
                'nonce': self.web3.eth.get_transaction_count(self.account_address),
            })
            
            # Sign transaction
            signed_txn = self.web3.eth.account.sign_transaction(transaction, private_key=self.private_key)
            
            # Send transaction
            tx_hash = self.web3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for transaction receipt
            tx_receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
            
            if tx_receipt.status == 1:
                return {
                    "success": True,
                    "message": "Vote cast successfully on blockchain",
                    "tx_hash": tx_hash.hex(),
                    "block_number": tx_receipt.blockNumber
                }
            else:
                return {
                    "success": False,
                    "message": "Transaction failed",
                    "tx_hash": tx_hash.hex()
                }
                
        except Exception as e:
            logger.error(f"Blockchain vote casting failed: {str(e)}")
            return {
                "success": False,
                "message": f"Blockchain error: {str(e)}",
                "tx_hash": None
            }
    
    def has_voted_on_blockchain(self, voter_name: str) -> bool:
        """Check if voter has voted on blockchain"""
        try:
            if not self.contract:
                return False
            
            return self.contract.functions.hasVoted(voter_name).call()
        except Exception as e:
            logger.error(f"Error checking vote status: {str(e)}")
            return False
    
    def get_blockchain_results(self) -> Dict[str, Any]:
        """Get voting results from blockchain"""
        try:
            if not self.contract:
                return {"success": False, "message": "Contract not initialized"}
            
            candidates, vote_counts = self.contract.functions.getResults().call()
            
            results = {}
            for i, candidate in enumerate(candidates):
                results[candidate] = int(vote_counts[i])
            
            return {
                "success": True,
                "results": results,
                "total_votes": sum(vote_counts)
            }
            
        except Exception as e:
            logger.error(f"Error getting blockchain results: {str(e)}")
            return {"success": False, "message": str(e)}
    
    def get_candidate_votes(self, candidate_id: str) -> int:
        """Get vote count for specific candidate"""
        try:
            if not self.contract:
                return 0
            
            return self.contract.functions.getCandidateVotes(candidate_id).call()
        except Exception as e:
            logger.error(f"Error getting candidate votes: {str(e)}")
            return 0

# Global blockchain service instance
blockchain_service = BlockchainService()
