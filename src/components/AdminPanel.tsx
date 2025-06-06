
import { useState } from 'react';
import { useVoting } from '../contexts/VotingContext';

const AdminPanel = () => {
  const { voters, candidates, electionName, addCandidate, deleteCandidate, setElectionName } = useVoting();
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);
  const [isEditingElection, setIsEditingElection] = useState(false);
  const [tempElectionName, setTempElectionName] = useState(electionName);
  const [candidateFormData, setCandidateFormData] = useState({
    name: '',
    party: ''
  });

  const handleAddCandidate = () => {
    if (candidateFormData.name && candidateFormData.party) {
      addCandidate({
        name: candidateFormData.name,
        party: candidateFormData.party,
        image: '/placeholder.svg'
      });
      
      setCandidateFormData({ name: '', party: '' });
      setIsAddingCandidate(false);
      alert('Candidate added successfully!');
    }
  };

  const handleDeleteCandidate = (candidateId: string, candidateName: string) => {
    if (window.confirm(`Are you sure you want to delete ${candidateName}? This will also remove all votes for this candidate.`)) {
      deleteCandidate(candidateId);
      alert('Candidate deleted successfully!');
    }
  };

  const handleUpdateElectionName = () => {
    if (tempElectionName.trim()) {
      setElectionName(tempElectionName.trim());
      setIsEditingElection(false);
      alert('Election name updated successfully!');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Control Panel</h2>
        <p className="text-gray-600">Manage election details, candidates and monitor election statistics</p>
      </div>

      {/* Election Management */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Election Information</h3>
          {!isEditingElection && (
            <button
              onClick={() => {
                setTempElectionName(electionName);
                setIsEditingElection(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Edit Election Name
            </button>
          )}
        </div>

        {!isEditingElection ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-blue-900">Current Election</h4>
                <p className="text-xl font-bold text-blue-700">{electionName}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Update Election Name</h4>
            <div className="flex space-x-4">
              <input
                type="text"
                value={tempElectionName}
                onChange={(e) => setTempElectionName(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter election name"
              />
              <button
                onClick={handleUpdateElectionName}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update
              </button>
              <button
                onClick={() => setIsEditingElection(false)}
                className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Registered Voters</p>
              <p className="text-2xl font-bold text-gray-900">{voters.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Candidates</p>
              <p className="text-2xl font-bold text-gray-900">{candidates.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Votes Cast</p>
              <p className="text-2xl font-bold text-gray-900">{voters.filter(v => v.hasVoted).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Votes</p>
              <p className="text-2xl font-bold text-gray-900">{voters.filter(v => !v.hasVoted).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Candidate Management */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Candidate Management</h3>
          {!isAddingCandidate && (
            <button
              onClick={() => setIsAddingCandidate(true)}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add New Candidate
            </button>
          )}
        </div>

        {isAddingCandidate && (
          <div className="mb-6 p-4 border border-purple-200 rounded-lg bg-purple-50">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Add New Candidate</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Candidate Name
                </label>
                <input
                  type="text"
                  value={candidateFormData.name}
                  onChange={(e) => setCandidateFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter candidate's full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Party/Affiliation
                </label>
                <input
                  type="text"
                  value={candidateFormData.party}
                  onChange={(e) => setCandidateFormData(prev => ({ ...prev, party: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter party or affiliation"
                />
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={handleAddCandidate}
                className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Candidate
              </button>
              <button
                onClick={() => {
                  setIsAddingCandidate(false);
                  setCandidateFormData({ name: '', party: '' });
                }}
                className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Candidates List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900">{candidate.name}</h4>
                  <p className="text-purple-600 font-medium">{candidate.party}</p>
                  <p className="text-sm text-gray-500 mt-1">ID: {candidate.id}</p>
                </div>
                <button
                  onClick={() => handleDeleteCandidate(candidate.id, candidate.name)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Candidate"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Registered Voters List */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Registered Voters</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {voters.map((voter) => (
                <tr key={voter.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {voter.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {voter.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(voter.registeredAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      voter.hasVoted 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {voter.hasVoted ? 'Voted' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
