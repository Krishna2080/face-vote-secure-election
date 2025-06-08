
import React, { createContext, useContext, useState, useEffect } from 'react';

interface Candidate {
  id: string;
  name: string;
  party: string;
}

interface Voter {
  name: string;
  email: string;
  faceEmbedding: number[];
}

interface Vote {
  voterName: string;
  candidateId: string;
  timestamp: Date;
}

interface VotingContextType {
  candidates: Candidate[];
  voters: Voter[];
  votes: Vote[];
  currentVoter: Voter | null;
  electionName: string;
  addCandidate: (candidate: Candidate) => void;
  removeCandidate: (id: string) => void;
  addVoter: (voter: Voter) => void;
  removeVoter: (name: string) => void;
  castVote: (candidateId: string) => void;
  setCurrentVoter: (voter: Voter | null) => void;
  clearAllData: () => void;
  setElectionName: (name: string) => void;
}

const VotingContext = createContext<VotingContextType | undefined>(undefined);

export const VotingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [currentVoter, setCurrentVoter] = useState<Voter | null>(null);
  const [electionName, setElectionName] = useState('SecureVote Election 2024');

  // Load data from localStorage on mount
  useEffect(() => {
    const savedCandidates = localStorage.getItem('voting_candidates');
    const savedVoters = localStorage.getItem('voting_voters');
    const savedVotes = localStorage.getItem('voting_votes');
    const savedElectionName = localStorage.getItem('voting_election_name');

    if (savedCandidates) {
      setCandidates(JSON.parse(savedCandidates));
    }
    if (savedVoters) {
      setVoters(JSON.parse(savedVoters));
    }
    if (savedVotes) {
      setVotes(JSON.parse(savedVotes).map((vote: any) => ({
        ...vote,
        timestamp: new Date(vote.timestamp)
      })));
    }
    if (savedElectionName) {
      setElectionName(savedElectionName);
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('voting_candidates', JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem('voting_voters', JSON.stringify(voters));
  }, [voters]);

  useEffect(() => {
    localStorage.setItem('voting_votes', JSON.stringify(votes));
  }, [votes]);

  useEffect(() => {
    localStorage.setItem('voting_election_name', electionName);
  }, [electionName]);

  const addCandidate = (candidate: Candidate) => {
    setCandidates(prev => [...prev, candidate]);
  };

  const removeCandidate = (id: string) => {
    setCandidates(prev => prev.filter(candidate => candidate.id !== id));
  };

  const addVoter = (voter: Voter) => {
    setVoters(prev => [...prev, voter]);
  };

  const removeVoter = (name: string) => {
    setVoters(prev => prev.filter(voter => voter.name !== name));
    setVotes(prev => prev.filter(vote => vote.voterName !== name));
  };

  const castVote = (candidateId: string) => {
    if (!currentVoter) return;

    const vote: Vote = {
      voterName: currentVoter.name,
      candidateId,
      timestamp: new Date()
    };

    setVotes(prev => [...prev, vote]);
  };

  const clearAllData = () => {
    setCandidates([]);
    setVoters([]);
    setVotes([]);
    setCurrentVoter(null);
    localStorage.clear();
  };

  const updateElectionName = (name: string) => {
    setElectionName(name);
  };

  return (
    <VotingContext.Provider
      value={{
        candidates,
        voters,
        votes,
        currentVoter,
        electionName,
        addCandidate,
        removeCandidate,
        addVoter,
        removeVoter,
        castVote,
        setCurrentVoter,
        clearAllData,
        setElectionName: updateElectionName
      }}
    >
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
