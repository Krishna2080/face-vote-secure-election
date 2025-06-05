
import cv2
import os
import numpy as np
import pickle
import pyttsx3
from mtcnn import MTCNN
from keras_facenet import FaceNet
from scipy.spatial.distance import cosine
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import io
from PIL import Image
import json

app = FastAPI(title="SecureVote Face Recognition API")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

class VoterRegistration(BaseModel):
    name: str
    email: str
    image_data: str  # Base64 encoded image

class FaceAuthentication(BaseModel):
    image_data: str  # Base64 encoded image

class VoteRequest(BaseModel):
    voter_name: str
    candidate_id: str

def base64_to_opencv_image(base64_string):
    """Convert base64 string to OpenCV image"""
    # Remove data URL prefix if present
    if base64_string.startswith('data:image'):
        base64_string = base64_string.split(',')[1]
    
    # Decode base64 to bytes
    image_bytes = base64.b64decode(base64_string)
    
    # Convert to PIL Image
    pil_image = Image.open(io.BytesIO(image_bytes))
    
    # Convert PIL to OpenCV format
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

@app.post("/register-voter")
async def register_voter(registration: VoterRegistration):
    """Register a new voter with face embedding"""
    try:
        # Convert base64 image to OpenCV format
        image = base64_to_opencv_image(registration.image_data)
        
        # Extract face embedding
        embedding = extract_face_embedding(image)
        
        if embedding is None:
            raise HTTPException(status_code=400, detail="No face detected in the image")
        
        # Save embedding to file
        user_face_file = os.path.join(face_data_dir, f"{registration.name}.pkl")
        with open(user_face_file, "wb") as file:
            pickle.dump([embedding], file)
        
        return {
            "success": True,
            "message": f"Voter {registration.name} registered successfully",
            "embedding": embedding
        }
    
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
                "message": "Face not recognized",
                "voter_name": None,
                "has_voted": False
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")

@app.post("/cast-vote")
async def cast_vote(vote_request: VoteRequest):
    """Record a vote for the authenticated voter"""
    try:
        # Check if user has already voted
        if vote_request.voter_name in voted_users:
            raise HTTPException(status_code=400, detail="Voter has already cast their vote")
        
        # Record the vote
        with open("votes.txt", "a") as file:
            file.write(f"{vote_request.voter_name}: {vote_request.candidate_id}\n")
        
        # Mark user as voted
        voted_users.add(vote_request.voter_name)
        with open(voted_users_file, "wb") as file:
            pickle.dump(voted_users, file)
        
        return {
            "success": True,
            "message": f"Vote recorded successfully for {vote_request.voter_name}"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vote recording failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Face recognition API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
