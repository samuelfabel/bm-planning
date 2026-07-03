import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { PlanningSession, QueuedCard } from '@/types/planning';
import { MOCK_PARTICIPANTS, MOCK_VOTES_HIDDEN } from '@/mocks/participants';
import { MOCK_CARDS } from '@/mocks/cards';

interface PlanningContextValue {
  session: PlanningSession | null;
  selectedVote: string | null;
  createSession: (name: string, queue: QueuedCard[]) => void;
  castVote: (value: string) => void;
  revealVotes: () => void;
  applyConsensus: (value: string) => void;
  startVoting: () => void;
  nextCard: () => void;
  revote: () => void;
}

const PlanningContext = createContext<PlanningContextValue | null>(null);

function buildMockSession(name: string, queue: QueuedCard[]): PlanningSession {
  return {
    id: 'rm_demo_' + Date.now().toString(36),
    name,
    status: 'waiting',
    queue,
    currentCardIdx: 0,
    participants: MOCK_PARTICIPANTS,
    votes: [],
    votesRevealed: false,
  };
}

export function PlanningProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PlanningSession | null>(null);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);

  const createSession = useCallback((name: string, queue: QueuedCard[]) => {
    setSession(buildMockSession(name, queue));
    setSelectedVote(null);
  }, []);

  const startVoting = useCallback(() => {
    setSession((prev) =>
      prev ? { ...prev, status: 'voting', votes: MOCK_VOTES_HIDDEN, votesRevealed: false } : prev,
    );
    setSelectedVote(null);
  }, []);

  const castVote = useCallback((value: string) => {
    setSelectedVote(value);
    setSession((prev) => {
      if (!prev) return prev;
      const votes = prev.votes.map((v) =>
        v.userId === 'usr-1' ? { ...v, value } : v,
      );
      return { ...prev, votes };
    });
  }, []);

  const revealVotes = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        status: 'revealed',
        votesRevealed: true,
        votes: prev.votes.map((v) => ({ ...v, revealed: true })),
      };
    });
  }, []);

  const applyConsensus = useCallback((value: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      const queue = [...prev.queue];
      const current = queue[prev.currentCardIdx];
      if (current) {
        queue[prev.currentCardIdx] = { ...current, estimated: value };
      }
      return { ...prev, status: 'consensus', queue };
    });
  }, []);

  const nextCard = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      const nextIdx = prev.currentCardIdx + 1;
      if (nextIdx >= prev.queue.length) {
        return { ...prev, status: 'closed' };
      }
      return {
        ...prev,
        currentCardIdx: nextIdx,
        status: 'voting',
        votes: MOCK_VOTES_HIDDEN,
        votesRevealed: false,
      };
    });
    setSelectedVote(null);
  }, []);

  const revote = useCallback(() => {
    setSession((prev) =>
      prev ? { ...prev, status: 'voting', votes: MOCK_VOTES_HIDDEN, votesRevealed: false } : prev,
    );
    setSelectedVote(null);
  }, []);

  return (
    <PlanningContext.Provider
      value={{
        session,
        selectedVote,
        createSession,
        castVote,
        revealVotes,
        applyConsensus,
        startVoting,
        nextCard,
        revote,
      }}
    >
      {children}
    </PlanningContext.Provider>
  );
}

export function usePlanning() {
  const ctx = useContext(PlanningContext);
  if (!ctx) throw new Error('usePlanning must be used within PlanningProvider');
  return ctx;
}

export function useDemoQueue(): QueuedCard[] {
  return MOCK_CARDS.map((c, i) => ({
    cardId: c.cardId,
    customId: c.customId,
    title: c.title,
    description: c.description,
    color: c.color,
    position: i,
  }));
}
