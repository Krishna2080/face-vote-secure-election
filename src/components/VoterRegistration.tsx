
import { useState } from 'react';
import { useVoting } from '../contexts/VotingContext';
import FaceCapture from './FaceCapture';

interface VoterRegistrationProps {
  onRegistrationComplete: () => void;
}

const VoterRegistration = ({ onRegistrationComplete }: VoterRegistrationProps) => {
  const { addVoter } = useVoting();
  const [isCapturingFace, setIsCapturingFace] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  const handleRegisterVoter = async (result: any) => {
    if (result.success && formData.name && formData.email) {
      // Add voter to local context with the embedding from backend
      addVoter({
        id: `voter_${Date.now()}`, // Generate unique ID
        name: formData.name,
        email: formData.email,
        faceEmbedding: result.embedding || []
      });
      
      setFormData({ name: '', email: '' });
      setIsCapturingFace(false);
      alert(`Registration successful! ${formData.name} has been registered with advanced biometric fraud prevention.`);
      onRegistrationComplete();
    } else {
      // Enhanced error handling for fraud prevention
      const errorMessage = result.message || 'Unknown error';
      if (errorMessage.includes('already registered under the name')) {
        alert(`⚠️ FRAUD PREVENTION ALERT:\n\n${errorMessage}\n\nEach individual can only register once to maintain election integrity.`);
      } else if (errorMessage.includes('already registered')) {
        alert(`Registration failed: ${errorMessage}`);
      } else {
        alert(`Registration failed: ${errorMessage}`);
      }
      setIsCapturingFace(false);
    }
  };

  const handleStartFaceCapture = () => {
    if (!formData.name || !formData.email) {
      alert('Please fill in all fields before capturing face data.');
      return;
    }
    setIsCapturingFace(true);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Voter Registration</h2>
        <p className="text-lg text-gray-600">
          Register as a new voter with advanced biometric authentication and fraud prevention
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        {!isCapturingFace ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full legal name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email address"
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-lg font-medium text-blue-900 mb-2">Next Step: Advanced Biometric Registration</h4>
              <p className="text-blue-700 text-sm mb-4">
                Your face will be captured and analyzed using MTCNN detection and FaceNet embeddings. Our system includes advanced fraud prevention to ensure each person can only register once.
              </p>
              <button
                onClick={handleStartFaceCapture}
                disabled={!formData.name || !formData.email}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                Capture Biometric Data
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-red-900 mb-2">🔒 Fraud Prevention</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Each face can only be registered once</li>
                <li>• Prevents multiple identities per person</li>
                <li>• Real-time duplicate detection</li>
                <li>• Maintains election integrity</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-900 mb-2">🔬 Advanced Technology</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• MTCNN for precise face detection</li>
                <li>• FaceNet neural network embeddings</li>
                <li>• Cosine similarity matching</li>
                <li>• High-accuracy biometric authentication</li>
              </ul>
            </div>
          </div>
        ) : (
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Advanced Biometric Registration with Fraud Prevention</h4>
            <FaceCapture
              mode="register"
              voterData={formData}
              onCapture={handleRegisterVoter}
              onCancel={() => setIsCapturingFace(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VoterRegistration;
