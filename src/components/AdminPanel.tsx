import { useState, useEffect } from 'react';
import { useVoting } from '../contexts/VotingContext';
import BlockchainConfig from './BlockchainConfig';

interface AdminPanelProps {
  onLogout: () => void;
}

const AdminPanel = ({ onLogout }: AdminPanelProps) => {
  const { 
    candidates, 
    voters, 
    votes,
    electionName,
    addCandidate, 
    removeCandidate, 
    removeVoter,
    clearAllData,
    setElectionName,
    getResults,
    getTotalVotes
  } = useVoting();

  const [newCandidate, setNewCandidate] = useState({ name: '', party: '' });
  const [activeTab, setActiveTab] = useState('overview');
  const [backendStats, setBackendStats] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Fetch backend statistics
  useEffect(() => {
    fetchBackendStats();
  }, []);

  const fetchBackendStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/voter-stats');
      const data = await response.json();
      setBackendStats(data);
    } catch (error) {
      console.error('Failed to fetch backend stats:', error);
    }
  };

  const handleAddCandidate = () => {
    if (newCandidate.name && newCandidate.party) {
      addCandidate({
        id: `candidate_${Date.now()}`,
        name: newCandidate.name,
        party: newCandidate.party
      });
      setNewCandidate({ name: '', party: '' });
      alert(`Candidate ${newCandidate.name} added successfully!`);
    }
  };

  const handleDeleteVoter = async (voterName: string) => {
    if (!confirm(`⚠️ WARNING: This will permanently delete voter "${voterName}" from both local storage and backend.\n\nThis action cannot be undone. Continue?`)) {
      return;
    }

    setIsDeleting(voterName);
    
    try {
      // Delete from backend first
      const response = await fetch(`http://localhost:8000/delete-voter/${encodeURIComponent(voterName)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Basic ' + btoa('admin:securevote123')
        }
      });

      const result = await response.json();

      if (result.success) {
        // Delete from local context
        removeVoter(voterName);
        
        // Refresh backend stats
        await fetchBackendStats();
        
        alert(`✅ Voter "${voterName}" deleted successfully from both backend and local storage.`);
        console.log(`Admin deleted voter: ${voterName}`);
      } else {
        alert(`❌ Failed to delete voter from backend: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete voter error:', error);
      alert(`❌ Failed to delete voter: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleClearAllData = () => {
    if (confirm('⚠️ DANGER: This will permanently delete ALL data including:\n• All registered voters\n• All votes cast\n• All candidates\n• Blockchain configuration\n\nThis action cannot be undone. Continue?')) {
      clearAllData();
      setBackendStats(null);
      alert('All data cleared successfully!');
    }
  };

  const handleElectionNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setElectionName(e.target.value);
  };

  const totalVotes = getTotalVotes();
  const results = getResults();

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Admin Panel</h3>
            <p className="mt-1 text-sm text-gray-600">
              Manage election settings, voters, and candidates.
            </p>
          </div>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <div className="shadow sm:rounded-md">
            <div className="bg-white py-6 px-4 sm:p-6">
              <nav className="mb-4">
                <ul className="flex space-x-4">
                  <li>
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`${activeTab === 'overview'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        } px-3 py-2 rounded-md text-sm font-medium`}
                    >
                      Overview
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab('candidates')}
                      className={`${activeTab === 'candidates'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        } px-3 py-2 rounded-md text-sm font-medium`}
                    >
                      Candidates
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab('voters')}
                      className={`${activeTab === 'voters'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        } px-3 py-2 rounded-md text-sm font-medium`}
                    >
                      Voters
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab('blockchain')}
                      className={`${activeTab === 'blockchain'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        } px-3 py-2 rounded-md text-sm font-medium`}
                    >
                      Blockchain
                    </button>
                  </li>
                </ul>
              </nav>

              {activeTab === 'overview' && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Election Overview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <dt className="text-sm font-medium text-gray-500">
                        Election Name
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        <input
                          type="text"
                          value={electionName}
                          onChange={handleElectionNameChange}
                          className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </dd>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <dt className="text-sm font-medium text-gray-500">
                        Total Votes Cast
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{totalVotes}</dd>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <dt className="text-sm font-medium text-gray-500">
                        Registered Voters
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {backendStats ? backendStats.total_registered : 'Loading...'}
                      </dd>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <dt className="text-sm font-medium text-gray-500">
                        Remaining Voters
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {backendStats ? backendStats.remaining_voters : 'Loading...'}
                      </dd>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Election Results</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Candidate
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Party
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Votes
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Percentage
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {results.map((candidate) => (
                            <tr key={candidate.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{candidate.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{candidate.party}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{candidate.votes}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{candidate.percentage.toFixed(2)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'candidates' && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Manage Candidates</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="candidate-name" className="block text-sm font-medium text-gray-700">
                        Candidate Name
                      </label>
                      <input
                        type="text"
                        id="candidate-name"
                        className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={newCandidate.name}
                        onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="candidate-party" className="block text-sm font-medium text-gray-700">
                        Candidate Party
                      </label>
                      <input
                        type="text"
                        id="candidate-party"
                        className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={newCandidate.party}
                        onChange={(e) => setNewCandidate({ ...newCandidate, party: e.target.value })}
                      />
                    </div>
                    <div>
                      <button
                        onClick={handleAddCandidate}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Add Candidate
                      </button>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Current Candidates</h4>
                    <ul className="divide-y divide-gray-200">
                      {candidates.map((candidate) => (
                        <li key={candidate.id} className="py-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{candidate.name}</p>
                            <p className="text-sm text-gray-500">{candidate.party}</p>
                          </div>
                          <button
                            onClick={() => removeCandidate(candidate.id)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'voters' && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Registered Voters</h4>
                  <ul className="divide-y divide-gray-200">
                    {voters.map((voter) => (
                      <li key={voter.name} className="py-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{voter.name}</p>
                          <p className="text-sm text-gray-500">{voter.email}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteVoter(voter.name)}
                          disabled={isDeleting === voter.name}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDeleting === voter.name ? 'Deleting...' : 'Delete'}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeTab === 'blockchain' && (
                <BlockchainConfig />
              )}
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between">
              <button
                onClick={onLogout}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
              <button
                onClick={handleClearAllData}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
