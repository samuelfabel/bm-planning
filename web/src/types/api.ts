import type { CardSubtask, ConsensusAlgorithm, FacilitatorRole, QueuedCard, SyncValueSource } from '@/types/planning';

export interface ApiDeckConfig {
  type: 'fibonacci' | 'sequential' | 'tshirt' | 'custom';
  values: string[];
  allow_pass: boolean;
  allow_break: boolean;
}

export interface ApiSessionConfig {
  subdomain?: string;
  facilitator_name?: string;
  facilitator_role?: FacilitatorRole;
  deck?: ApiDeckConfig;
  consensus_algorithm?: ConsensusAlgorithm;
  sync_value_source?: SyncValueSource;
}

export interface ApiUser {
  id: string;
  display_name: string;
  is_facilitator: boolean;
  can_vote: boolean;
  is_online: boolean;
}

export interface ApiVote {
  user_id: string;
  value: string;
  revealed: boolean;
}

export interface ApiCardSubtask {
  id: string;
  title: string;
  done: boolean;
}

export interface ApiQueuedCard {
  card_id: number;
  custom_id?: string;
  title: string;
  description?: string;
  subtasks?: ApiCardSubtask[];
  color: string;
  position: number;
  estimated?: string;
  excluded_from_voting?: boolean;
}

export interface ApiRound {
  card_id: number;
  votes?: Record<string, ApiVote> | ApiVote[];
}

export interface ApiRoomState {
  id: string;
  name: string;
  status: 'waiting' | 'voting' | 'revealed' | 'consensus' | 'closed';
  config?: ApiSessionConfig;
  queue: ApiQueuedCard[];
  current_card_idx: number;
  participants: ApiUser[] | Record<string, ApiUser>;
  votes?: ApiVote[];
  current_round?: ApiRound | null;
  votes_revealed?: boolean;
}

export interface CreateRoomRequest {
  name: string;
  mode: 'live';
  queue: ApiQueuedCard[];
  config: ApiSessionConfig;
}

export interface CreateRoomResponse {
  id: string;
  join_url: string;
  expires_at: string | null;
}

export interface JoinRoomRequest {
  display_name: string;
  client_id?: string;
  is_facilitator?: boolean;
  can_vote?: boolean;
}

export interface JoinRoomResponse {
  room?: ApiRoomState;
  room_state?: ApiRoomState;
  user?: ApiUser;
  user_id?: string;
}

export interface UpdateQueueRequest {
  queue: ApiQueuedCard[];
}

export interface UpdateCardRequest {
  description?: string;
  subtasks?: ApiCardSubtask[];
  excluded_from_voting?: boolean;
}

export interface VoteRequest {
  user_id?: string;
  value: string;
}

export interface ConsensusRequest {
  value: string;
  sync_to_businessmap: boolean;
}

export type ClientMessage =
  | { type: 'join'; display_name: string; client_id?: string }
  | { type: 'ping' }
  | { type: 'vote'; value: string; user_id?: string }
  | { type: 'reveal' }
  | { type: 'start_round' }
  | { type: 'revote' }
  | { type: 'skip' }
  | { type: 'next' }
  | { type: 'consensus'; value: string; sync_to_businessmap: boolean }
  | { type: 'update_queue'; payload: { queue: ApiQueuedCard[] } }
  | {
      type: 'update_card';
      payload: {
        card_id: number;
        description?: string;
        subtasks?: ApiCardSubtask[];
        excluded_from_voting?: boolean;
      };
    };

export type ServerMessage =
  | { type: 'room_state'; payload: ApiRoomState }
  | {
      type: 'card_updated';
      payload: {
        card_id: number;
        description?: string;
        subtasks?: ApiCardSubtask[];
        excluded_from_voting?: boolean;
      };
    }
  | { type: 'participant_joined'; payload: ApiUser }
  | { type: 'participant_left'; payload: { user_id: string } }
  | { type: 'round_started'; payload: { card_id: number } }
  | { type: 'vote_received'; payload: { user_id: string } }
  | { type: 'votes_revealed'; payload: { votes: ApiVote[] } }
  | { type: 'consensus_applied'; payload: { card_id: number; value: string } }
  | { type: 'pong' }
  | { type: 'error'; payload: { code: string; message: string } };

export interface VoteSyncContext {
  sourceValue: string;
  syncValueSource: SyncValueSource;
}

export function toApiSubtasks(subtasks: CardSubtask[] | undefined): ApiCardSubtask[] | undefined {
  return subtasks?.map((subtask) => ({
    id: subtask.id,
    title: subtask.title,
    done: subtask.done,
  }));
}

export function toApiQueueCard(card: QueuedCard): ApiQueuedCard {
  return {
    card_id: card.cardId,
    custom_id: card.customId,
    title: card.title,
    description: card.description,
    subtasks: toApiSubtasks(card.subtasks),
    color: card.color,
    position: card.position,
    estimated: card.estimated,
    excluded_from_voting: card.excludedFromVoting,
  };
}
