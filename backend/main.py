
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import VoterRegistration, FaceAuthentication, VoteRequest, BlockchainConfig
from face_service import base64_to_opencv_image, extract_face_embedding, check_face_duplicate, authenticate_face
from voter_service import voter_service
from blockchain_service import blockchain_service
from web3 import Web3

app = FastAPI(title="SecureVote Face Recognition & Blockchain API")

# Enable CORS for the frontend running on localhost:8080
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173"],  # Support both ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ... keep existing code (all the endpoints remain the same)

@app.post("/register-voter")
async def register_voter(registration: VoterRegistration):
    """Register a new voter with face embedding and fraud prevention"""
    try:
        # Check if name already exists
        if voter_service.is_voter_registered(registration.name):
            raise HTTPException(status_code=400, detail=f"Voter with name '{registration.name}' is already registered")
        
        # Convert base64 image to OpenCV format
        image = base64_to_opencv_image(registration.image_data)
        
        # Extract face embedding
        embedding = extract_face_embedding(image)
        
        if embedding is None:
            raise HTTPException(status_code=400, detail="No face detected in the image")
        
        # Check for face duplicates (fraud prevention)
        duplicate_name = check_face_duplicate(embedding, voter_service.face_registry)
        if duplicate_name:
            raise HTTPException(
                status_code=400, 
                detail=f"This face is already registered under the name '{duplicate_name}'. Each person can only register once."
            )
        
        # Register the voter
        voter_service.register_voter(registration.name, embedding)
        
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
        user_embeddings = voter_service.load_user_embeddings()
        
        # Authenticate face
        auth_result = authenticate_face(test_embedding, user_embeddings)
        
        if auth_result["authenticated"]:
            voter_name = auth_result["match"]
            has_voted = voter_service.has_voted(voter_name)
            
            if has_voted:
                return {
                    "success": False,
                    "message": f"{voter_name} has already voted",
                    "voter_name": voter_name,
                    "has_voted": True
                }
            
            return {
                "success": True,
                "message": f"Voter authenticated as {voter_name}",
                "voter_name": voter_name,
                "has_voted": False,
                "similarity_score": auth_result["score"]
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
        if voter_service.has_voted(vote_request.voter_name):
            raise HTTPException(status_code=400, detail="Voter has already cast their vote")
        
        # Cast vote on blockchain first (if configured)
        blockchain_result = blockchain_service.cast_vote_on_blockchain(
            vote_request.voter_name, 
            vote_request.candidate_id
        )
        
        if not blockchain_result["success"]:
            # If blockchain fails, still record locally but warn
            voter_service.record_vote(vote_request.voter_name, vote_request.candidate_id)
            
            return {
                "success": True,
                "message": f"Vote recorded locally for {vote_request.voter_name}. Blockchain: {blockchain_result['message']}",
                "blockchain_result": blockchain_result,
                "local_backup": True
            }
        
        # Record the vote locally as backup
        voter_service.record_vote(
            vote_request.voter_name, 
            vote_request.candidate_id, 
            blockchain_result.get('tx_hash')
        )
        
        return {
            "success": True,
            "message": f"Vote recorded successfully for {vote_request.voter_name}",
            "blockchain_result": blockchain_result,
            "tx_hash": blockchain_result.get("tx_hash"),
            "block_number": blockchain_result.get("block_number")
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vote recording failed: {str(e)}")

@app.post("/configure-blockchain")
async def configure_blockchain(config: BlockchainConfig):
    """Configure blockchain connection parameters"""
    try:
        blockchain_service.contract_address = config.contract_address
        blockchain_service.rpc_url = config.rpc_url or "https://rpc.sepolia.org"
        blockchain_service.private_key = config.private_key
        blockchain_service.account_address = config.account_address
        
        # Initialize Web3 connection with public Sepolia RPC
        blockchain_service.web3 = Web3(Web3.HTTPProvider(blockchain_service.rpc_url))
        blockchain_service._initialize_contract()
        
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
        return blockchain_service.get_blockchain_results()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get blockchain results: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "SecureVote API is running"}

@app.get("/voter-stats")
async def get_voter_stats():
    """Get statistics about registered voters and votes cast"""
    try:
        stats = voter_service.get_stats()
        return {
            "success": True,
            **stats
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to get stats: {str(e)}"
        }

if __name__ == "__main__":
    import uvicorn
    print("Starting SecureVote Backend API...")
    print("Frontend should run on: http://localhost:8080")
    print("Backend API available at: http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
