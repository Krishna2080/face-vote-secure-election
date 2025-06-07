
import cv2
import numpy as np
import base64
import io
from PIL import Image
from mtcnn import MTCNN
from keras_facenet import FaceNet
from scipy.spatial.distance import cosine

# Initialize face detection and recognition models
detector = MTCNN()
embedder = FaceNet()

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

def check_face_duplicate(new_embedding, face_registry, similarity_threshold=0.3):
    """Check if a face embedding matches any existing registered face"""
    for registered_name, registered_embedding in face_registry.items():
        similarity_score = cosine(new_embedding, registered_embedding)
        if similarity_score < similarity_threshold:
            return registered_name
    return None

def authenticate_face(test_embedding, user_embeddings, similarity_threshold=0.4):
    """Authenticate a face against stored embeddings"""
    best_match = None
    best_score = float("inf")
    
    for user, embeddings in user_embeddings.items():
        for stored_embedding in embeddings:
            score = cosine(test_embedding, stored_embedding)
            if score < best_score:
                best_score = score
                best_match = user
    
    if best_match and best_score < similarity_threshold:
        return {
            "match": best_match,
            "score": 1 - best_score,  # Convert to similarity percentage
            "authenticated": True
        }
    else:
        return {
            "match": None,
            "score": 0,
            "authenticated": False
        }
