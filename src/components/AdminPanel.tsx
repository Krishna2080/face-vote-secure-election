import { useState, useEffect } from 'react';
import { useVoting } from '../contexts/VotingContext';
import BlockchainConfig from './BlockchainConfig';
import AdminAuth from './AdminAuth';

const AdminPanel = () => {
  const { 
    candidates, 
    addCandidate, 
    removeCandidate, 
    voters, 
    votes, 
    clearAllData,
    electionName,
    setElectionName,
    removeVoter
  } = useVoting();
  
  const [newCandidateName, setNewCandidateName] = useState('');
  const [newCandidateParty, setNewCandidateParty] = useState('');
  const [showBlockchainConfig, setShowBlockchainConfig] = useState(false);
  const [tempElectionName, setTempElectionName] = useState(electionName);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if admin is already authenticated
    const authStatus = localStorage.getItem('admin_authenticated');
    const authTime = localStorage.getItem('admin_auth_time');
    
    if (authStatus === 'true' && authTime) {
      // Check if authentication is still valid (24 hours)
      const timeDiff = Date.now() - parseInt(authTime);
      if (timeDiff < 24 * 60 * 60 * 1000) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('admin_authenticated');
        localStorage.removeItem('admin_auth_time');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_auth_time');
    setIsAuthenticated(false);
  };

  const handleDeleteVoter = async (voterName: string) => {
    if (window.confirm(`Are you sure you want to delete voter "${voterName}"? This will remove their face data and voting records.`)) {
      try {
        const response = await fetch(`http://localhost:8000/delete-voter/${voterName}`, {
          method: 'DELETE',
          headers: {
            'Authorization': 'Basic ' + btoa('admin:securevote123')
          }
        });

        const result = await response.json();
        
        if (result.success) {
          removeVoter(voterName);
          alert(`Voter ${voterName} deleted successfully`);
        } else {
          alert(`Failed to delete voter: ${result.message || 'Unknown error'}`);
        }
      } catch (error) {
        alert('Failed to delete voter. Please check if backend is running.');
      }
    }
  };

  // Show authentication screen if not authenticated
  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  const handleAddCandidate = () => {
    if (newCandidateName.trim() && newCandidateParty.trim()) {
      addCandidate({
        id: Date.now().toString(),
        name: newCandidateName.trim(),
        party: newCandidateParty.trim()
      });
      setNewCandidateName('');
      setNewCandidateParty('');
    }
  };

  const handleUpdateElectionName = () => {
    if (tempElectionName.trim()) {
      setElectionName(tempElectionName.trim());
      alert('Election name updated successfully!');
    }
  };

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear all voting data? This action cannot be undone.')) {
      clearAllData();
      alert('All data has been cleared successfully.');
    }
  };

  if (showBlockchainConfig) {
    return <BlockchainConfig onConfigured={() => setShowBlockchainConfig(false)} />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header with Logout */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
            <p className="text-gray-600">Manage election settings, candidates, and view system status</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Election Settings */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Election Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Election Name
            </label>
            <div className="flex space-x-3">
              <input
                type="text"
                value={tempElectionName}
                onChange={(e) => setTempElectionName(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter election name"
              />
              <button
                onClick={handleUpdateElectionName}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Current: {electionName}
            </p>
          </div>
        </div>
      </div>

      {/* Voter Management */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Registered Voters</h2>
        
        {voters.length === 0 ? (
          <p className="text-gray-500 italic">No voters registered yet.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Total registered voters: {voters.length}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {voters.map((voter) => (
                <div key={voter.name} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{voter.name}</h4>
                    <p className="text-sm text-gray-600">{voter.email}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteVoter(voter.name)}
                    className="text-red-600 hover:text-red-800 transition-colors p-1"
                    title="Delete voter and face data"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 10-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Blockchain Configuration */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Blockchain Integration</h2>
        <p className="text-gray-600 mb-4">
          Configure Ethereum Sepolia testnet integration for immutable vote storage.
        </p>
        <button
          onClick={() => setShowBlockchainConfig(true)}
          className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          Configure Blockchain
        </button>
      </div>

      {/* Candidate Management */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Candidate Management</h2>
        
        {/* Add New Candidate */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Add New Candidate</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={newCandidateName}
              onChange={(e) => setNewCandidateName(e.target.value)}
              placeholder="Candidate Name"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              value={newCandidateParty}
              onChange={(e) => setNewCandidateParty(e.target.value)}
              placeholder="Party/Affiliation"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleAddCandidate}
              disabled={!newCandidateName.trim() || !newCandidateParty.trim()}
              className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Add Candidate
            </button>
          </div>
        </div>

        {/* Candidates List */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Current Candidates</h3>
          {candidates.length === 0 ? (
            <p className="text-gray-500 italic">No candidates added yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidates.map((candidate) => (
                <div key={candidate.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{candidate.name}</h4>
                    <p className="text-sm text-gray-600">{candidate.party}</p>
                  </div>
                  <button
                    onClick={() => removeCandidate(candidate.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Remove candidate"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Registered Voters</h3>
          <div className="text-3xl font-bold text-blue-600">{voters.length}</div>
          <p className="text-sm text-gray-500">Total registered</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Votes Cast</h3>
          <div className="text-3xl font-bold text-green-600">{votes.length}</div>
          <p className="text-sm text-gray-500">Total votes</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Candidates</h3>
          <div className="text-3xl font-bold text-purple-600">{candidates.length}</div>
          <p className="text-sm text-gray-500">In election</p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-red-200">
        <h2 className="text-xl font-bold text-red-900 mb-4">Danger Zone</h2>
        <p className="text-red-700 mb-4">
          These actions are irreversible. Please proceed with caution.
        </p>
        <button
          onClick={handleClearAllData}
          className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          Clear All Data
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;
