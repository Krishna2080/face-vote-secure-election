import { useState } from 'react';
import { useVoting } from '../contexts/VotingContext';

interface VotingInterfaceProps {
  onVoteComplete: () => void;
}

const VotingInterface = ({ onVoteComplete }: VotingInterfaceProps) => {
  const { candidates, currentVoter, electionName, castVote } = useVoting();
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const handleVoteSubmit = async () => {
    if (!selectedCandidate) return;
    
    setIsVoting(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const success = castVote(selectedCandidate);
    
    if (success) {
      alert('Vote cast successfully!');
      onVoteComplete();
    } else {
      alert('Error casting vote. Please try again.');
    }
    
    setIsVoting(false);
  };

  if (!currentVoter) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2">Please authenticate first to access the voting interface.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-blue-600 mb-2">{electionName}</h1>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Cast Your Vote</h2>
            <p className="text-gray-600">Welcome, {currentVoter.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Voter ID</p>
            <p className="text-lg font-medium text-gray-900">{currentVoter.id}</p>
          </div>
        </div>
      </div>

      {!isConfirming ? (
        <>
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-blue-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-blue-900">Voting Instructions</h3>
                <ul className="text-blue-700 mt-2 space-y-1">
                  <li>• Select one candidate by clicking on their card</li>
                  <li>• Review your selection carefully</li>
                  <li>• Click "Continue" to confirm your vote</li>
                  <li>• Your vote is final and cannot be changed</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Candidates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                onClick={() => setSelectedCandidate(candidate.id)}
                className={`bg-white rounded-xl shadow-lg p-6 cursor-pointer transition-all duration-200 ${
                  selectedCandidate === candidate.id
                    ? 'ring-4 ring-blue-500 border-blue-500 scale-105'
                    : 'border border-gray-200 hover:shadow-xl hover:scale-102'
                }`}
              >
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{candidate.name}</h3>
                  <p className="text-sm text-blue-600 font-medium mb-4">{candidate.party}</p>
                  
                  {selectedCandidate === candidate.id && (
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-blue-600 font-medium ml-2">Selected</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="text-center">
            <button
              onClick={() => setIsConfirming(true)}
              disabled={!selectedCandidate}
              className="px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              Continue to Confirmation
            </button>
          </div>
        </>
      ) : (
        /* Confirmation Screen */
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Confirm Your Vote</h3>
            
            {selectedCandidate && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6 max-w-md mx-auto">
                <p className="text-gray-600 mb-2">You are voting for:</p>
                <h4 className="text-xl font-bold text-gray-900">
                  {candidates.find(c => c.id === selectedCandidate)?.name}
                </h4>
                <p className="text-blue-600 font-medium">
                  {candidates.find(c => c.id === selectedCandidate)?.party}
                </p>
              </div>
            )}
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-w-lg mx-auto">
              <p className="text-red-800 font-medium">
                ⚠️ Warning: This action cannot be undone. Once you submit your vote, you cannot change it.
              </p>
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setIsConfirming(false)}
                className="px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleVoteSubmit}
                disabled={isVoting}
                className="px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isVoting ? 'Submitting Vote...' : 'Submit Vote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VotingInterface;
