
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Candidate {
  id: string;
  name: string;
  votes: number;
}

export interface VotingContextType {
  candidates: Candidate[];
  addCandidate: (candidate: Omit<Candidate, "votes">) => void;
  removeCandidate: (id: string) => void;
  vote: (candidateId: string) => void;
  clearAllData: () => void;
  electionName: string;
  setElectionName: (name: string) => void;
}

const VotingContext = createContext<VotingContextType | undefined>(undefined);

export const useVoting = () => {
  const context = useContext(VotingContext);
  if (!context) {
    throw new Error('useVoting must be used within a VotingProvider');
  }
  return context;
};

interface VotingProviderProps {
  children: ReactNode;
}

export const VotingProvider: React.FC<VotingProviderProps> = ({ children }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([
    { id: '1', name: 'John Smith', votes: 0 },
    { id: '2', name: 'Jane Johnson', votes: 0 },
    { id: '3', name: 'Mike Williams', votes: 0 }
  ]);
  
  const [electionName, setElectionName] = useState<string>('General Election 2024');

  // Load data from localStorage on mount
  useEffect(() => {
    const savedCandidates = localStorage.getItem('voting-candidates');
    const savedElectionName = localStorage.getItem('election-name');
    
    if (savedCandidates) {
      setCandidates(JSON.parse(savedCandidates));
    }
    
    if (savedElectionName) {
      setElectionName(savedElectionName);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('voting-candidates', JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem('election-name', electionName);
  }, [electionName]);

  const addCandidate = (candidate: Omit<Candidate, "votes">) => {
    const newCandidate: Candidate = {
      ...candidate,
      votes: 0
    };
    setCandidates(prev => [...prev, newCandidate]);
  };

  const removeCandidate = (id: string) => {
    setCandidates(prev => prev.filter(candidate => candidate.id !== id));
  };

  const vote = (candidateId: string) => {
    setCandidates(prev => 
      prev.map(candidate => 
        candidate.id === candidateId 
          ? { ...candidate, votes: candidate.votes + 1 }
          : candidate
      )
    );
  };

  const clearAllData = () => {
    setCandidates([]);
    localStorage.removeItem('voting-candidates');
    localStorage.removeItem('election-name');
    setElectionName('General Election 2024');
  };

  const value: VotingContextType = {
    candidates,
    addCandidate,
    removeCandidate,
    vote,
    clearAllData,
    electionName,
    setElectionName
  };

  return (
    <VotingContext.Provider value={value}>
      {children}
    </VotingContext.Provider>
  );
};
