import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type {
  ApiCardSubtask,
  ApiQueuedCard,
  ApiRoomState,
  ApiUser,
  ApiVote,
  ClientMessage,
  ServerMessage,
} from '@/types/api';
import type {
  CardSubtask,
  DemoPersona,
  PlanningSession,
  QueuedCard,
  SessionSettings,
  User,
  Vote,
} from '@/types/planning';
import { demoUserIdForPersona } from '@/types/planning';
import { DEFAULT_SESSION_SETTINGS } from '@/mocks/config';
import { MOCK_PARTICIPANTS, MOCK_VOTES_HIDDEN } from '@/mocks/participants';
import { MOCK_CARDS } from '@/mocks/cards';

interface CreateSessionOptions {
  isDemo?: boolean;
}

interface PlanningContextValue {
  session: PlanningSession | null;
  roomId: string | null;
  currentUserId: string | null;
  currentUser: User | null;
  isDemoMode: boolean;
  isLiveMode: boolean;
  selectedVote: string | null;
  demoPersona: DemoPersona;
  setDemoPersona: (persona: DemoPersona) => void;
  setLiveSession: (room: ApiRoomState, currentUserId: string | null) => void;
  setLiveSender: (sender: ((message: ClientMessage) => void) | null) => void;
  applyServerMessage: (message: ServerMessage) => void;
  createSession: (
    name: string,
    queue: QueuedCard[],
    settings?: SessionSettings,
    options?: CreateSessionOptions,
  ) => void;
  castVote: (value: string) => void;
  revealVotes: () => void;
  applyConsensus: (value: string, syncToBusinessmap?: boolean) => void;
  startVoting: () => void;
  nextCard: () => void;
  revote: () => void;
  selectCurrentCard: (idx: number) => void;
  setCurrentCardDescription: (description: string) => void;
  addSubtask: (title: string) => void;
  updateSubtask: (id: string, title: string) => void;
  toggleSubtask: (id: string) => void;
  removeSubtask: (id: string) => void;
  toggleCardExcludedFromVoting: (cardId: number) => void;
}

const PlanningContext = createContext<PlanningContextValue | null>(null);

/** Map API subtasks to the planning session subtask shape.
 *
 * @param subtasks - Subtasks from a queued card payload.
 * @returns Mapped subtasks, or undefined when the input is missing.
 */
function fromApiSubtasks(subtasks: ApiCardSubtask[] | undefined): CardSubtask[] | undefined {
  return subtasks?.map((subtask) => ({
    id: subtask.id,
    title: subtask.title,
    done: subtask.done,
  }));
}

/** Map an API queued card to the client QueuedCard type.
 *
 * @param card - Queued card from room state.
 * @returns Normalized queued card for the planning UI.
 */
function fromApiQueueCard(card: ApiQueuedCard): QueuedCard {
  return {
    cardId: card.card_id,
    customId: card.custom_id,
    title: card.title,
    description: card.description,
    subtasks: fromApiSubtasks(card.subtasks),
    color: card.color,
    position: card.position,
    estimated: card.estimated,
    excludedFromVoting: card.excluded_from_voting,
  };
}

/** Map an API user record to the client User type.
 *
 * @param user - Participant from room state.
 * @returns Normalized user for the planning UI.
 */
function fromApiUser(user: ApiUser): User {
  return {
    id: user.id,
    displayName: user.display_name,
    isFacilitator: user.is_facilitator,
    canVote: user.can_vote,
    isOnline: user.is_online,
  };
}

/** Map API vote records to the client Vote type.
 *
 * @param votes - Votes from a round or reveal payload.
 * @returns Normalized vote list, or empty array when missing.
 */
function fromApiVotes(votes: ApiVote[] | undefined): Vote[] {
  return (
    votes?.map((vote) => ({
      userId: vote.user_id,
      value: vote.value,
      revealed: vote.revealed,
    })) ?? []
  );
}

/** Normalize room participants from array or map API shapes.
 *
 * @param participants - Participants field from room state.
 * @returns Flat list of users.
 */
function parseParticipants(participants: ApiRoomState['participants']): User[] {
  if (Array.isArray(participants)) {
    return participants.map(fromApiUser);
  }
  return Object.values(participants).map(fromApiUser);
}

/** Extract current-round votes from heterogeneous API room payloads.
 *
 * @param room - Full room state from REST or WebSocket.
 * @returns Normalized votes for the active or revealed round.
 */
function parseRoundVotes(room: ApiRoomState): Vote[] {
  if (room.votes?.length) {
    return fromApiVotes(room.votes);
  }
  const roundVotes = room.current_round?.votes;
  if (!roundVotes) return [];
  if (Array.isArray(roundVotes)) {
    return fromApiVotes(roundVotes);
  }
  return fromApiVotes(Object.values(roundVotes));
}

/** Map API room state to the client PlanningSession model.
 *
 * @param room - Room state from REST or WebSocket.
 * @param previousSettings - Prior session settings used as fallback for partial payloads.
 * @returns Planning session for React state.
 */
function mapRoomState(room: ApiRoomState, previousSettings?: SessionSettings): PlanningSession {
  return {
    id: room.id,
    name: room.name,
    status: room.status,
    settings: {
      deck: room.config?.deck
        ? {
            type: room.config.deck.type,
            values: room.config.deck.values,
            allowPass: room.config.deck.allow_pass,
            allowBreak: room.config.deck.allow_break,
          }
        : (previousSettings?.deck ?? DEFAULT_SESSION_SETTINGS.deck),
      consensusAlgorithm:
        room.config?.consensus_algorithm ??
        previousSettings?.consensusAlgorithm ??
        DEFAULT_SESSION_SETTINGS.consensusAlgorithm,
      syncValueSource:
        room.config?.sync_value_source ??
        previousSettings?.syncValueSource ??
        DEFAULT_SESSION_SETTINGS.syncValueSource,
    },
    isDemo: false,
    queue: room.queue.map(fromApiQueueCard),
    currentCardIdx: room.current_card_idx,
    participants: parseParticipants(room.participants),
    votes: parseRoundVotes(room),
    votesRevealed:
      room.votes_revealed ??
      (room.status === 'revealed' || room.status === 'consensus'),
  };
}

/** Build an in-browser demo session without calling the server.
 *
 * @param name - Session display name.
 * @param queue - Initial card queue.
 * @param settings - Session settings; defaults when omitted.
 * @param isDemo - Whether demo mode flags should be set.
 * @returns Local-only planning session.
 */
function buildMockSession(
  name: string,
  queue: QueuedCard[],
  settings: SessionSettings = DEFAULT_SESSION_SETTINGS,
  isDemo = false,
): PlanningSession {
  return {
    id: 'rm_demo_' + Date.now().toString(36),
    name,
    status: 'waiting',
    settings,
    isDemo,
    queue,
    currentCardIdx: 0,
    participants: MOCK_PARTICIPANTS,
    votes: [],
    votesRevealed: false,
  };
}

export function PlanningProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PlanningSession | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [liveSender, setLiveSenderState] = useState<((message: ClientMessage) => void) | null>(null);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [demoPersona, setDemoPersonaState] = useState<DemoPersona>('croupier');

  const setDemoPersona = useCallback((persona: DemoPersona) => {
    setDemoPersonaState(persona);
    setSelectedVote(null);
  }, []);

  const setLiveSender = useCallback((sender: ((message: ClientMessage) => void) | null) => {
    setLiveSenderState(() => sender);
  }, []);

  const setLiveSession = useCallback((room: ApiRoomState, userId: string | null) => {
    setRoomId(room.id);
    setCurrentUserId(userId);
    setSession((prev) => mapRoomState(room, prev?.settings));
    setSelectedVote(null);
  }, []);

  const createSession = useCallback(
    (
      name: string,
      queue: QueuedCard[],
      settings?: SessionSettings,
      options?: CreateSessionOptions,
    ) => {
      setRoomId(null);
      setCurrentUserId(null);
      setLiveSenderState(null);
      setSession(buildMockSession(name, queue, settings ?? DEFAULT_SESSION_SETTINGS, options?.isDemo));
      setSelectedVote(null);
    },
    [],
  );

  const isLiveMode = Boolean(session && !session.isDemo && roomId);
  const isDemoMode = Boolean(session?.isDemo);

  const resolveVoterId = useCallback(
    (s: PlanningSession) => {
      if (s.isDemo) return demoUserIdForPersona(demoPersona);
      return currentUserId ?? 'usr-1';
    },
    [demoPersona, currentUserId],
  );

  const sendLiveMessage = useCallback(
    (message: ClientMessage) => {
      if (!isLiveMode || !liveSender) return;
      liveSender(message);
    },
    [isLiveMode, liveSender],
  );

  const updateCurrentCard = useCallback(
    (
      updater: (card: QueuedCard) => QueuedCard,
      options?: { publishWs?: boolean },
    ) => {
      setSession((prev) => {
        if (!prev) return prev;
        const queue = [...prev.queue];
        const current = queue[prev.currentCardIdx];
        if (!current) return prev;
        const updated = updater(current);
        queue[prev.currentCardIdx] = updated;

        if (!prev.isDemo && options?.publishWs) {
          sendLiveMessage({
            type: 'update_card',
            payload: {
              card_id: updated.cardId,
              description: updated.description,
              subtasks: updated.subtasks?.map((subtask) => ({
                id: subtask.id,
                title: subtask.title,
                done: subtask.done,
              })),
              excluded_from_voting: updated.excludedFromVoting,
            },
          });
        }
        return { ...prev, queue };
      });
    },
    [sendLiveMessage],
  );

  const startVoting = useCallback(() => {
    if (isLiveMode) {
      sendLiveMessage({ type: 'start_round' });
      return;
    }
    setSession((prev) =>
      prev ? { ...prev, status: 'voting', votes: MOCK_VOTES_HIDDEN, votesRevealed: false } : prev,
    );
    setSelectedVote(null);
  }, [isLiveMode, sendLiveMessage]);

  const castVote = useCallback(
    (value: string) => {
      setSelectedVote(value);
      setSession((prev) => {
        if (!prev) return prev;
        const userId = resolveVoterId(prev);
        const votes = prev.votes.map((v) => (v.userId === userId ? { ...v, value } : v));
        if (!prev.isDemo) {
          sendLiveMessage({ type: 'vote', value, user_id: userId });
        }
        return { ...prev, votes };
      });
    },
    [resolveVoterId, sendLiveMessage],
  );

  const revealVotes = useCallback(() => {
    if (isLiveMode) {
      sendLiveMessage({ type: 'reveal' });
      return;
    }
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        status: 'revealed',
        votesRevealed: true,
        votes: prev.votes.map((v) => ({ ...v, revealed: true })),
      };
    });
  }, [isLiveMode, sendLiveMessage]);

  const applyConsensus = useCallback((value: string, syncToBusinessmap = false) => {
    if (isLiveMode) {
      sendLiveMessage({ type: 'consensus', value, sync_to_businessmap: syncToBusinessmap });
      return;
    }
    setSession((prev) => {
      if (!prev) return prev;
      const queue = [...prev.queue];
      const current = queue[prev.currentCardIdx];
      if (current) {
        queue[prev.currentCardIdx] = { ...current, estimated: value };
      }
      return { ...prev, status: 'consensus', queue };
    });
  }, [isLiveMode, sendLiveMessage]);

  const nextCard = useCallback(() => {
    if (isLiveMode) {
      sendLiveMessage({ type: 'next' });
      setSelectedVote(null);
      return;
    }
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
  }, [isLiveMode, sendLiveMessage]);

  const revote = useCallback(() => {
    if (isLiveMode) {
      sendLiveMessage({ type: 'revote' });
      setSelectedVote(null);
      return;
    }
    setSession((prev) =>
      prev ? { ...prev, status: 'voting', votes: MOCK_VOTES_HIDDEN, votesRevealed: false } : prev,
    );
    setSelectedVote(null);
  }, [isLiveMode, sendLiveMessage]);

  const selectCurrentCard = useCallback((idx: number) => {
    setSession((prev) => {
      if (
        !prev ||
        !prev.isDemo ||
        idx < 0 ||
        idx >= prev.queue.length ||
        idx === prev.currentCardIdx
      ) {
        return prev;
      }
      return {
        ...prev,
        currentCardIdx: idx,
        status: 'waiting',
        votes: [],
        votesRevealed: false,
      };
    });
    setSelectedVote(null);
  }, []);

  const setCurrentCardDescription = useCallback(
    (description: string) => {
      updateCurrentCard((card) => ({
        ...card,
        description: description || undefined,
      }), { publishWs: true });
    },
    [updateCurrentCard],
  );

  const addSubtask = useCallback(
    (title: string) => {
      updateCurrentCard((card) => ({
        ...card,
        subtasks: [
          ...(card.subtasks ?? []),
          { id: `st_${Date.now().toString(36)}`, title, done: false },
        ],
      }), { publishWs: true });
    },
    [updateCurrentCard],
  );

  const updateSubtask = useCallback(
    (id: string, title: string) => {
      updateCurrentCard((card) => ({
        ...card,
        subtasks: (card.subtasks ?? []).map((subtask) =>
          subtask.id === id ? { ...subtask, title } : subtask,
        ),
      }), { publishWs: true });
    },
    [updateCurrentCard],
  );

  const toggleSubtask = useCallback(
    (id: string) => {
      updateCurrentCard((card) => ({
        ...card,
        subtasks: (card.subtasks ?? []).map((subtask) =>
          subtask.id === id ? { ...subtask, done: !subtask.done } : subtask,
        ),
      }), { publishWs: true });
    },
    [updateCurrentCard],
  );

  const removeSubtask = useCallback(
    (id: string) => {
      updateCurrentCard((card) => ({
        ...card,
        subtasks: (card.subtasks ?? []).filter((subtask) => subtask.id !== id),
      }), { publishWs: true });
    },
    [updateCurrentCard],
  );

  const toggleCardExcludedFromVoting = useCallback((cardId: number) => {
    setSession((prev) => {
      if (!prev) return prev;
      const queue = prev.queue.map((card) =>
        card.cardId === cardId
          ? { ...card, excludedFromVoting: !card.excludedFromVoting }
          : card,
      );
      const updatedCard = queue.find((card) => card.cardId === cardId);
      if (!prev.isDemo && updatedCard) {
        sendLiveMessage({
          type: 'update_card',
          payload: {
            card_id: updatedCard.cardId,
            description: updatedCard.description,
            subtasks: updatedCard.subtasks?.map((subtask) => ({
              id: subtask.id,
              title: subtask.title,
              done: subtask.done,
            })),
            excluded_from_voting: updatedCard.excludedFromVoting,
          },
        });
      }
      return {
        ...prev,
        queue,
      };
    });
  }, [sendLiveMessage]);

  const applyServerMessage = useCallback((message: ServerMessage) => {
    if (message.type === 'pong') return;

    setSession((prev) => {
      if (!prev || prev.isDemo) return prev;

      switch (message.type) {
        case 'room_state':
          return mapRoomState(message.payload, prev.settings);
        case 'card_updated':
          return {
            ...prev,
            queue: prev.queue.map((card) =>
              card.cardId === message.payload.card_id
                ? {
                    ...card,
                    description: message.payload.description ?? card.description,
                    subtasks: message.payload.subtasks
                      ? fromApiSubtasks(message.payload.subtasks)
                      : card.subtasks,
                    excludedFromVoting:
                      message.payload.excluded_from_voting ?? card.excludedFromVoting,
                  }
                : card,
            ),
          };
        case 'participant_joined':
          return {
            ...prev,
            participants: [
              ...prev.participants.filter((participant) => participant.id !== message.payload.id),
              fromApiUser(message.payload),
            ],
          };
        case 'participant_left':
          return {
            ...prev,
            participants: prev.participants.map((participant) =>
              participant.id === message.payload.user_id
                ? { ...participant, isOnline: false }
                : participant,
            ),
          };
        case 'round_started': {
          const voters = prev.participants.filter((participant) => participant.canVote);
          return {
            ...prev,
            status: 'voting',
            votesRevealed: false,
            votes: voters.map((participant) => ({
              userId: participant.id,
              value: '',
              revealed: false,
            })),
          };
        }
        case 'vote_received':
          return {
            ...prev,
            votes: prev.votes.some((vote) => vote.userId === message.payload.user_id)
              ? prev.votes
              : [...prev.votes, { userId: message.payload.user_id, value: '', revealed: false }],
          };
        case 'votes_revealed':
          return {
            ...prev,
            status: 'revealed',
            votesRevealed: true,
            votes: fromApiVotes(message.payload.votes),
          };
        case 'consensus_applied':
          return {
            ...prev,
            status: 'consensus',
            queue: prev.queue.map((card) =>
              card.cardId === message.payload.card_id
                ? { ...card, estimated: message.payload.value }
                : card,
            ),
          };
        case 'error':
          return prev;
        default:
          return prev;
      }
    });
  }, []);

  const currentUser = useMemo(
    () => session?.participants.find((participant) => participant.id === currentUserId) ?? null,
    [session, currentUserId],
  );

  return (
    <PlanningContext.Provider
      value={{
        session,
        roomId,
        currentUserId,
        currentUser,
        isDemoMode,
        isLiveMode,
        selectedVote,
        demoPersona,
        setDemoPersona,
        setLiveSession,
        setLiveSender,
        applyServerMessage,
        createSession,
        castVote,
        revealVotes,
        applyConsensus,
        startVoting,
        nextCard,
        revote,
        selectCurrentCard,
        setCurrentCardDescription,
        addSubtask,
        updateSubtask,
        toggleSubtask,
        removeSubtask,
        toggleCardExcludedFromVoting,
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
    subtasks:
      c.cardId === 4521
        ? [
            { id: 'st_demo_1', title: 'Configure Azure AD app registration', done: false },
            { id: 'st_demo_2', title: 'Implement OIDC callback handler', done: false },
            { id: 'st_demo_3', title: 'Map SSO groups to app roles', done: false },
          ]
        : undefined,
    color: c.color,
    position: i,
  }));
}
