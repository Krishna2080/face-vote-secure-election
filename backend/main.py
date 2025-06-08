
import cv2
import os
import numpy as np
import pickle
import base64
import io
from PIL import Image
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from mtcnn import MTCNN
from keras_facenet import FaceNet
from scipy.spatial.distance import cosine
from web3 import Web3
import secrets
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SecureVote Face Recognition & Blockchain API")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Admin authentication
security = HTTPBasic()
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "securevote123"

def get_admin_user(credentials: HTTPBasicCredentials = Depends(security)):
    current_username_bytes = credentials.username.encode("utf8")
    correct_username_bytes = ADMIN_USERNAME.encode("utf8")
    is_correct_username = secrets.compare_digest(
        current_username_bytes, correct_username_bytes
    )
    current_password_bytes = credentials.password.encode("utf8")
    correct_password_bytes = ADMIN_PASSWORD.encode("utf8")
    is_correct_password = secrets.compare_digest(
        current_password_bytes, correct_password_bytes
    )
    if not (is_correct_username and is_correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect admin credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

# Initialize models
detector = MTCNN()
embedder = FaceNet()

# Create directory to store embeddings
face_data_dir = "face_embeddings"
if not os.path.exists(face_data_dir):
    os.makedirs(face_data_dir)

voted_users_file = "voted_users.pkl"
if os.path.exists(voted_users_file):
    with open(voted_users_file, "rb") as file:
        voted_users = pickle.load(file)
else:
    voted_users = set()

# Create registry file to track face-to-name mappings for fraud prevention
face_registry_file = "face_registry.pkl"
if os.path.exists(face_registry_file):
    with open(face_registry_file, "rb") as file:
        face_registry = pickle.load(file)
else:
    face_registry = {}  # {voter_name: embedding}

# Blockchain configuration
class BlockchainService:
    def __init__(self):
        self.rpc_url = "https://rpc.sepolia.org"
        self.web3 = None
        self.contract_address = ""
        self.private_key = ""
        self.account_address = ""
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
                "inputs": [{"internalType": "string", "name": "", "type": "string"}],
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
            }
        ]
        self.contract = None
    
    def initialize_web3(self):
        try:
            self.web3 = Web3(Web3.HTTPProvider(self.rpc_url))
            if self.contract_address and self.web3:
                self.contract = self.web3.eth.contract(
                    address=Web3.to_checksum_address(self.contract_address),
                    abi=self.contract_abi
                )
                logger.info("Blockchain initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize blockchain: {str(e)}")
    
    def is_connected(self):
        try:
            return self.web3 and self.web3.is_connected()
        except:
            return False
    
    def cast_vote(self, voter_name: str, candidate_id: str):
        try:
            if not self.contract or not self.is_connected():
                return {"success": False, "message": "Blockchain not configured"}
            
            # Build transaction with proper gas estimation
            transaction = self.contract.functions.castVote(voter_name, candidate_id).build_transaction({
                'from': Web3.to_checksum_address(self.account_address),
                'gas': 300000,  # Increased gas limit
                'gasPrice': self.web3.to_wei('20', 'gwei'),
                'nonce': self.web3.eth.get_transaction_count(Web3.to_checksum_address(self.account_address)),
            })
            
            # Sign and send transaction
            signed_txn = self.web3.eth.account.sign_transaction(transaction, private_key=self.private_key)
            tx_hash = self.web3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for transaction receipt
            tx_receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if tx_receipt.status == 1:
                return {
                    "success": True,
                    "message": "Vote cast successfully on Sepolia blockchain",
                    "tx_hash": tx_hash.hex(),
                    "block_number": tx_receipt.blockNumber
                }
            else:
                return {"success": False, "message": "Transaction failed", "tx_hash": tx_hash.hex()}
                
        except Exception as e:
            logger.error(f"Blockchain vote failed: {str(e)}")
            return {"success": False, "message": f"Blockchain error: {str(e)}"}

blockchain_service = BlockchainService()

# Pydantic models
class VoterRegistration(BaseModel):
    name: str
    email: str
    image_data: str

class FaceAuthentication(BaseModel):
    image_data: str

class VoteRequest(BaseModel):
    voter_name: str
    candidate_id: str

class BlockchainConfig(BaseModel):
    contract_address: str
    rpc_url: str
    private_key: str
    account_address: str

class AdminLogin(BaseModel):
    username: str
    password: str

def base64_to_opencv_image(base64_string):
    """Convert base64 string to OpenCV image"""
    if base64_string.startswith('data:image'):
        base64_string = base64_string.split(',')[1]
    
    image_bytes = base64.b64decode(base64_string)
    pil_image = Image.open(io.BytesIO(image_bytes))
    opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
    
    return opencv_image

def extract_face_embedding(image):
    """Extract face embedding from image using MTCNN and FaceNet"""
    faces = detector.detect_faces(image)
    
    if not faces:
        return None
    
    # Get the largest face
    largest_face = max(faces, key=lambda x: x['box'][2] * x['box'][3])
    x, y, w, h = largest_face['box']
    
    # Crop and resize face
    cropped_face = image[y:y+h, x:x+w]
    resized_face = cv2.resize(cropped_face, (160, 160))
    
    # Extract FaceNet embedding
    embedding = embedder.embeddings([resized_face])[0]
    
    return embedding.tolist()

def check_face_duplicate(new_embedding, similarity_threshold=0.3):
    """Check if a face embedding matches any existing registered face"""
    for registered_name, registered_embedding in face_registry.items():
        similarity_score = cosine(new_embedding, registered_embedding)
        if similarity_score < similarity_threshold:
            return registered_name
    return None

@app.post("/admin-login")
async def admin_login(credentials: AdminLogin):
    """Admin login endpoint"""
    if credentials.username == ADMIN_USERNAME and credentials.password == ADMIN_PASSWORD:
        return {"success": True, "message": "Admin authenticated successfully"}
    else:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

@app.post("/register-voter")
async def register_voter(registration: VoterRegistration):
    """Register a new voter with face embedding and fraud prevention"""
    try:
        # Check if name already exists
        if registration.name in face_registry:
            raise HTTPException(status_code=400, detail=f"Voter with name '{registration.name}' is already registered")
        
        # Convert base64 image to OpenCV format
        image = base64_to_opencv_image(registration.image_data)
        
        # Extract face embedding
        embedding = extract_face_embedding(image)
        
        if embedding is None:
            raise HTTPException(status_code=400, detail="No face detected in the image")
        
        # Check for face duplicates (fraud prevention)
        duplicate_name = check_face_duplicate(embedding)
        if duplicate_name:
            raise HTTPException(
                status_code=400, 
                detail=f"This face is already registered under the name '{duplicate_name}'. Each person can only register once."
            )
        
        # Save embedding to file
        user_face_file = os.path.join(face_data_dir, f"{registration.name}.pkl")
        with open(user_face_file, "wb") as file:
            pickle.dump([embedding], file)
        
        # Add to face registry for fraud prevention
        face_registry[registration.name] = embedding
        with open(face_registry_file, "wb") as file:
            pickle.dump(face_registry, file)
        
        return {
            "success": True,
            "message": f"Voter {registration.name} registered successfully with biometric verification",
            "embedding": embedding
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/authenticate-voter")
async def authenticate_voter(auth_request: FaceAuthentication):
    """Authenticate voter using face recognition"""
    try:
        # Convert base64 image to OpenCV format
        image = base64_to_opencv_image(auth_request.image_data)
        
        # Extract face embedding
        test_embedding = extract_face_embedding(image)
        
        if test_embedding is None:
            raise HTTPException(status_code=400, detail="No face detected in the image")
        
        # Load all stored embeddings
        user_embeddings = {}
        for filename in os.listdir(face_data_dir):
            if filename.endswith('.pkl'):
                voter_name = filename.replace(".pkl", "")
                with open(os.path.join(face_data_dir, filename), "rb") as file:
                    user_embeddings[voter_name] = pickle.load(file)
        
        # Compare with stored embeddings using Cosine Similarity
        best_match = None
        best_score = float("inf")
        
        for user, embeddings in user_embeddings.items():
            for stored_embedding in embeddings:
                score = cosine(test_embedding, stored_embedding)
                if score < best_score:
                    best_score = score
                    best_match = user
        
        # If best match is found and similarity is high enough
        if best_match and best_score < 0.4:  # Threshold for matching
            # Check if user has already voted
            if best_match in voted_users:
                return {
                    "success": False,
                    "message": f"{best_match} has already voted",
                    "voter_name": best_match,
                    "has_voted": True
                }
            
            return {
                "success": True,
                "message": f"Voter authenticated as {best_match}",
                "voter_name": best_match,
                "has_voted": False,
                "similarity_score": 1 - best_score  # Convert to similarity percentage
            }
        else:
            return {
                "success": False,
                "message": "Face not recognized. Please ensure you are registered to vote.",
                "voter_name": None,
                "has_voted": False
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")

@app.post("/cast-vote")
async def cast_vote(vote_request: VoteRequest):
    """Record a vote both locally and on blockchain"""
    try:
        # Check if user has already voted
        if vote_request.voter_name in voted_users:
            raise HTTPException(status_code=400, detail="Voter has already cast their vote")
        
        # Try to cast vote on blockchain first
        blockchain_result = blockchain_service.cast_vote(vote_request.voter_name, vote_request.candidate_id)
        
        # Record the vote locally (as backup)
        with open("votes.txt", "a") as file:
            tx_info = f"tx: {blockchain_result.get('tx_hash', 'failed')}"
            file.write(f"{vote_request.voter_name}: {vote_request.candidate_id} ({tx_info})\n")
        
        # Mark user as voted
        voted_users.add(vote_request.voter_name)
        with open(voted_users_file, "wb") as file:
            pickle.dump(voted_users, file)
        
        if blockchain_result["success"]:
            return {
                "success": True,
                "message": f"Vote recorded successfully for {vote_request.voter_name}",
                "blockchain_result": blockchain_result,
                "tx_hash": blockchain_result.get("tx_hash"),
                "block_number": blockchain_result.get("block_number")
            }
        else:
            return {
                "success": True,
                "message": f"Vote recorded locally for {vote_request.voter_name}. Blockchain: {blockchain_result['message']}",
                "blockchain_result": blockchain_result,
                "local_backup": True
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vote recording failed: {str(e)}")

@app.delete("/delete-voter/{voter_name}")
async def delete_voter(voter_name: str, admin: str = Depends(get_admin_user)):
    """Delete a registered voter (Admin only)"""
    try:
        # Remove from face registry
        if voter_name in face_registry:
            del face_registry[voter_name]
            with open(face_registry_file, "wb") as file:
                pickle.dump(face_registry, file)
        
        # Remove face embedding file
        user_face_file = os.path.join(face_data_dir, f"{voter_name}.pkl")
        if os.path.exists(user_face_file):
            os.remove(user_face_file)
        
        # Remove from voted users if present
        if voter_name in voted_users:
            voted_users.remove(voter_name)
            with open(voted_users_file, "wb") as file:
                pickle.dump(voted_users, file)
        
        return {
            "success": True,
            "message": f"Voter {voter_name} deleted successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete voter: {str(e)}")

@app.post("/configure-blockchain")
async def configure_blockchain(config: BlockchainConfig, admin: str = Depends(get_admin_user)):
    """Configure blockchain connection parameters (Admin only)"""
    try:
        blockchain_service.contract_address = config.contract_address
        blockchain_service.rpc_url = config.rpc_url or "https://rpc.sepolia.org"
        blockchain_service.private_key = config.private_key
        blockchain_service.account_address = config.account_address
        
        blockchain_service.initialize_web3()
        
        return {
            "success": True,
            "message": "Blockchain configuration updated successfully",
            "connected": blockchain_service.is_connected()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Configuration failed: {str(e)}")

@app.get("/blockchain-status")
async def get_blockchain_status():
    """Get blockchain connection status"""
    try:
        return {
            "connected": blockchain_service.is_connected(),
            "contract_configured": blockchain_service.contract is not None,
            "contract_address": blockchain_service.contract_address
        }
    except Exception as e:
        return {
            "connected": False,
            "contract_configured": False,
            "contract_address": "",
            "error": str(e)
        }

@app.get("/blockchain-results")
async def get_blockchain_results():
    """Get voting results from blockchain"""
    try:
        if not blockchain_service.contract:
            return {"success": False, "message": "Contract not configured"}
        
        candidates, vote_counts = blockchain_service.contract.functions.getResults().call()
        
        results = {}
        for i, candidate in enumerate(candidates):
            results[candidate] = int(vote_counts[i])
        
        return {
            "success": True,
            "results": results,
            "total_votes": sum(vote_counts)
        }
        
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "SecureVote API is running"}

@app.get("/voter-stats")
async def get_voter_stats():
    """Get statistics about registered voters and votes cast"""
    try:
        total_registered = len(face_registry)
        total_voted = len(voted_users)
        
        return {
            "success": True,
            "total_registered": total_registered,
            "total_voted": total_voted,
            "remaining_voters": total_registered - total_voted
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to get stats: {str(e)}"
        }

if __name__ == "__main__":
    import uvicorn
    print("Starting SecureVote Backend API...")
    print("Admin credentials: username=admin, password=securevote123")
    print("Frontend should run on: http://localhost:8080")
    print("Backend API available at: http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
