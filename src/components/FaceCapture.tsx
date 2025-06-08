
import { useState, useRef, useEffect } from 'react';
import { faceRecognitionApi } from '../services/faceRecognitionApi';

interface FaceCaptureProps {
  onCapture: (result: any) => void;
  onCancel: () => void;
  mode: 'register' | 'authenticate';
  voterData?: { name: string; email: string };
}

const FaceCapture = ({ onCapture, onCancel, mode, voterData }: FaceCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('Initializing camera...');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    checkBackendStatus();
    initializeCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const checkBackendStatus = async () => {
    try {
      const isHealthy = await faceRecognitionApi.healthCheck();
      setBackendStatus(isHealthy ? 'online' : 'offline');
    } catch (error) {
      setBackendStatus('offline');
    }
  };

  const initializeCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 480 }, 
          height: { ideal: 360 }, 
          facingMode: 'user',
          frameRate: { ideal: 15 }
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      setStatus('Camera ready - Position your face in the frame');
    } catch (error) {
      console.error('Error accessing camera:', error);
      setStatus('Camera access denied');
    }
  };

  const captureImageAsBase64 = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return null;
    
    // Use smaller dimensions for faster processing
    const width = 320;
    const height = 240;
    canvas.width = width;
    canvas.height = height;
    
    // Draw current video frame to canvas with reduced size
    context.drawImage(video, 0, 0, width, height);
    
    // Use lower quality for faster upload and processing
    return canvas.toDataURL('image/jpeg', 0.6);
  };

  const captureAndProcess = async () => {
    if (backendStatus !== 'online') {
      setStatus('Backend server is offline. Please start the Python FastAPI server.');
      return;
    }

    setIsProcessing(true);
    
    try {
      if (mode === 'register') {
        setStatus('Processing registration (10-15 seconds)...');
      } else {
        setStatus('Authenticating face (5-10 seconds)...');
      }
      
      const imageData = captureImageAsBase64();
      
      if (!imageData) {
        throw new Error('Failed to capture image');
      }

      let result;
      const startTime = Date.now();
      
      if (mode === 'register' && voterData) {
        result = await faceRecognitionApi.registerVoter({
          name: voterData.name,
          email: voterData.email,
          image_data: imageData
        });
      } else if (mode === 'authenticate') {
        result = await faceRecognitionApi.authenticateVoter({
          image_data: imageData
        });
      }

      const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`Face ${mode} completed in ${processingTime} seconds`);

      if (result?.success) {
        if (mode === 'register') {
          setStatus(`Registration successful! (${processingTime}s)`);
        } else {
          setStatus(`Authentication successful! (${processingTime}s)`);
        }
        onCapture(result);
      } else {
        const errorMessage = result?.message || `${mode === 'register' ? 'Registration' : 'Authentication'} failed`;
        setStatus(errorMessage);
        
        if (errorMessage.includes('already registered under the name')) {
          setTimeout(() => setStatus('Ready to try again'), 4000);
        } else {
          setTimeout(() => setStatus('Ready to try again'), 2000);
        }
      }
      
    } catch (error) {
      console.error(`Error during ${mode}:`, error);
      if (error instanceof Error && error.message.includes('fetch')) {
        setStatus('Network timeout - Backend may be slow. Try again.');
      } else {
        setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      setTimeout(() => setStatus('Ready to try again'), 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Feed */}
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
            
            {/* Face detection overlay */}
            <div className="absolute inset-0 border-2 border-blue-500 border-dashed m-8 rounded-lg flex items-center justify-center">
              <div className="text-white text-center bg-black bg-opacity-50 px-4 py-2 rounded">
                <p className="text-sm">Position your face here</p>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            {/* Backend Status */}
            <div className="mb-3">
              <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                backendStatus === 'online' ? 'bg-green-100 text-green-800' :
                backendStatus === 'offline' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                <span className={`w-2 h-2 rounded-full mr-1 ${
                  backendStatus === 'online' ? 'bg-green-400' :
                  backendStatus === 'offline' ? 'bg-red-400' :
                  'bg-yellow-400'
                }`}></span>
                Backend {backendStatus}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-3">{status}</p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={captureAndProcess}
                disabled={isProcessing || !stream || backendStatus !== 'online'}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Processing...' : 
                 mode === 'register' ? 'Capture & Verify' : 'Quick Authenticate'
                }
              </button>
              <button
                onClick={onCancel}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3">
              {mode === 'register' ? 'Fast Biometric Registration' : 'Quick Face Authentication'}
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                <span>Position your face within the blue frame</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                <span>Look directly at the camera</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                <span>Ensure good lighting on your face</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                <span>Click capture for {mode === 'register' ? '10-15s' : '5-10s'} processing</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5 8.707 7.621a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0z" clipRule="evenodd" />
              </svg>
              <div>
                <h5 className="text-sm font-medium text-green-900">Optimized Performance</h5>
                <p className="text-sm text-green-700 mt-1">
                  Reduced image processing for faster {mode === 'register' ? 'registration (10-15 seconds)' : 'authentication (5-10 seconds)'}.
                </p>
              </div>
            </div>
          </div>
          
          {mode === 'register' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h5 className="text-sm font-medium text-red-900">Fraud Prevention Active</h5>
                  <p className="text-sm text-red-700 mt-1">
                    System will check if your face is already registered. Each person can only register once.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-blue-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h5 className="text-sm font-medium text-blue-900">Fast & Secure</h5>
                <p className="text-sm text-blue-700 mt-1">
                  MTCNN + FaceNet technology optimized for speed while maintaining high accuracy.
                </p>
              </div>
            </div>
          </div>

          {backendStatus === 'offline' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h5 className="text-sm font-medium text-red-900">Backend Required</h5>
                  <p className="text-sm text-red-700 mt-1">
                    Please run the Python FastAPI server: <code>python backend/main.py</code>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default FaceCapture;
