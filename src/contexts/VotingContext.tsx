import React, { createContext, useContext, useState, useEffect } from 'react';

interface Voter {
  id: string;
  name: string;
  email: string;
  faceEmbedding: number[];
  hasVoted: boolean;
  registeredAt: string;
}

interface Candidate {
  id: string;
  name: string;
  party: string;
  image: string;
  votes: number;
}

interface Vote {
  id: string;
  voterId: string;
  candidateId: string;
  timestamp: string;
}

interface VotingContextType {
  voters: Voter[];
  candidates: Candidate[];
  votes: Vote[];
  currentVoter: Voter | null;
  electionName: string;
  addVoter: (voter: Omit<Voter, 'id' | 'hasVoted' | 'registeredAt'>) => void;
  addCandidate: (candidate: Omit<Candidate, 'id' | 'votes'>) => void;
  deleteCandidate: (candidateId: string) => void;
  authenticateVoter: (faceEmbedding: number[]) => Voter | null;
  castVote: (candidateId: string) => boolean;
  setCurrentVoter: (voter: Voter | null) => void;
  setElectionName: (name: string) => void;
  getTotalVotes: () => number;
  getResults: () => Array<Candidate & { percentage: number }>;
}

const VotingContext = createContext<VotingContextType | undefined>(undefined);

export const VotingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [currentVoter, setCurrentVoter] = useState<Voter | null>(null);
  const [electionName, setElectionName] = useState<string>('General Election 2024');

  // Default candidates - now stored in state
  const [candidates, setCandidates] = useState<Candidate[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      party: 'Progressive Party',
      image: '/placeholder.svg',
      votes: 0
    },
    {
      id: '2',
      name: 'Michael Chen',
      party: 'Innovation Alliance',
      image: '/placeholder.svg',
      votes: 0
    },
    {
      id: '3',
      name: 'Maria Rodriguez',
      party: 'Unity Coalition',
      image: '/placeholder.svg',
      votes: 0
    },
    {
      id: '4',
      name: 'David Thompson',
      party: 'Future Forward',
      image: '/placeholder.svg',
      votes: 0
    }
  ]);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedVoters = localStorage.getItem('secureVote_voters');
    const savedVotes = localStorage.getItem('secureVote_votes');
    const savedCandidates = localStorage.getItem('secureVote_candidates');
    const savedElectionName = localStorage.getItem('secureVote_electionName');
    
    if (savedVoters) {
      setVoters(JSON.parse(savedVoters));
    }
    if (savedVotes) {
      setVotes(JSON.parse(savedVotes));
    }
    if (savedCandidates) {
      setCandidates(JSON.parse(savedCandidates));
    }
    if (savedElectionName) {
      setElectionName(savedElectionName);
    }
  }, []);

  // Save data to localStorage whenever voters, votes, candidates, or election name change
  useEffect(() => {
    localStorage.setItem('secureVote_voters', JSON.stringify(voters));
  }, [voters]);

  useEffect(() => {
    localStorage.setItem('secureVote_votes', JSON.stringify(votes));
  }, [votes]);

  useEffect(() => {
    localStorage.setItem('secureVote_candidates', JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem('secureVote_electionName', electionName);
  }, [electionName]);

  const addVoter = (voterData: Omit<Voter, 'id' | 'hasVoted' | 'registeredAt'>) => {
    const newVoter: Voter = {
      ...voterData,
      id: Date.now().toString(),
      hasVoted: false,
      registeredAt: new Date().toISOString()
    };
    setVoters(prev => [...prev, newVoter]);
  };

  const addCandidate = (candidateData: Omit<Candidate, 'id' | 'votes'>) => {
    const newCandidate: Candidate = {
      ...candidateData,
      id: Date.now().toString(),
      votes: 0
    };
    setCandidates(prev => [...prev, newCandidate]);
  };

  const deleteCandidate = (candidateId: string) => {
    // Remove the candidate
    setCandidates(prev => prev.filter(candidate => candidate.id !== candidateId));
    
    // Remove any votes for this candidate
    setVotes(prev => prev.filter(vote => vote.candidateId !== candidateId));
    
    // If voters voted for this candidate, mark them as not having voted
    setVoters(prev => 
      prev.map(voter => {
        const voterVote = votes.find(vote => vote.voterId === voter.id && vote.candidateId === candidateId);
        if (voterVote) {
          return { ...voter, hasVoted: false };
        }
        return voter;
      })
    );
  };

  const calculateSimilarity = (embedding1: number[], embedding2: number[]): number => {
    if (embedding1.length !== embedding2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  };

  const authenticateVoter = (faceEmbedding: number[]): Voter | null => {
    const threshold = 0.7; // Similarity threshold for face matching
    
    for (const voter of voters) {
      const similarity = calculateSimilarity(faceEmbedding, voter.faceEmbedding);
      if (similarity > threshold) {
        return voter;
      }
    }
    
    return null;
  };

  const castVote = (candidateId: string): boolean => {
    if (!currentVoter || currentVoter.hasVoted) {
      return false;
    }

    const newVote: Vote = {
      id: Date.now().toString(),
      voterId: currentVoter.id,
      candidateId,
      timestamp: new Date().toISOString()
    };

    setVotes(prev => [...prev, newVote]);
    
    // Mark voter as having voted
    setVoters(prev => 
      prev.map(voter => 
        voter.id === currentVoter.id 
          ? { ...voter, hasVoted: true }
          : voter
      )
    );

    return true;
  };

  const getTotalVotes = (): number => {
    return votes.length;
  };

  const getResults = (): Array<Candidate & { percentage: number }> => {
    const totalVotes = votes.length;
    
    return candidates.map(candidate => {
      const candidateVotes = votes.filter(vote => vote.candidateId === candidate.id).length;
      return {
        ...candidate,
        votes: candidateVotes,
        percentage: totalVotes > 0 ? (candidateVotes / totalVotes) * 100 : 0
      };
    });
  };

  return (
    <VotingContext.Provider value={{
      voters,
      candidates,
      votes,
      currentVoter,
      electionName,
      addVoter,
      addCandidate,
      deleteCandidate,
      authenticateVoter,
      castVote,
      setCurrentVoter,
      setElectionName,
      getTotalVotes,
      getResults
    }}>
      {children}
    </VotingContext.Provider>
  );
};

export const useVoting = () => {
  const context = useContext(VotingContext);
  if (context === undefined) {
    throw new Error('useVoting must be used within a VotingProvider');
  }
  return context;
};
