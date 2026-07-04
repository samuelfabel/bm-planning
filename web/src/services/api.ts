import type {
  ApiRoomState,
  ConsensusRequest,
  CreateRoomRequest,
  CreateRoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  UpdateCardRequest,
  UpdateQueueRequest,
  VoteRequest,
} from '@/types/api';

const API_BASE = '/api/v1';

/** Perform a JSON request against the BM Planning REST API.
 *
 * @param path - Path relative to /api/v1.
 * @param init - Fetch request init including method and body.
 * @returns Parsed JSON response body.
 * @returns Rejects with an Error when the response is not ok.
 */
async function request<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    ...init,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { title?: string; detail?: string; message?: string };
      message = data.detail ?? data.title ?? data.message ?? message;
    } catch {
      // keep generic message
    }
    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

/** Planning server health — rooms / WebSocket (M2+). Businessmap calls go direct from the browser. */
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch('/health');
    if (!res.ok) return false;
    const data = (await res.json()) as { status?: string };
    return data.status === 'ok';
  } catch {
    return false;
  }
}

/** Create a planning room with queue, settings, and facilitator.
 *
 * @param body - Room creation payload.
 * @returns Created room metadata including join URL and facilitator id.
 */
export function createRoom(body: CreateRoomRequest): Promise<CreateRoomResponse> {
  return request<CreateRoomResponse>('/rooms', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** Fetch current room state, optionally filtered for a participant.
 *
 * @param roomId - Room identifier.
 * @returns Full or participant-filtered room state.
 */
export function getRoom(roomId: string): Promise<ApiRoomState> {
  return request<ApiRoomState>(`/rooms/${roomId}`, { method: 'GET' });
}

/** Add a participant to a room.
 *
 * @param roomId - Room identifier.
 * @param body - Join payload with display name.
 * @returns Joined user record.
 */
export function joinRoom(roomId: string, body: JoinRoomRequest): Promise<JoinRoomResponse> {
  return request<JoinRoomResponse>(`/rooms/${roomId}/join`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** Remove a participant from a room.
 *
 * @param roomId - Room identifier.
 * @param body - Optional user id to leave.
 * @returns Resolves when the leave succeeds.
 */
export function leaveRoom(roomId: string, body?: { user_id?: string }): Promise<void> {
  return request<void>(`/rooms/${roomId}/leave`, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  });
}

/** Replace the room card queue (facilitator only).
 *
 * @param roomId - Room identifier.
 * @param body - Facilitator user id and new queue.
 * @returns Updated room state.
 */
export function updateQueue(roomId: string, body: UpdateQueueRequest): Promise<ApiRoomState> {
  return request<ApiRoomState>(`/rooms/${roomId}/queue`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/** Update a queued card's description, subtasks, or voting exclusion.
 *
 * @param roomId - Room identifier.
 * @param cardId - Businessmap card id in the queue.
 * @param body - Facilitator user id and card fields to update.
 * @returns Updated room state.
 */
export function updateCard(roomId: string, cardId: number, body: UpdateCardRequest): Promise<ApiRoomState> {
  return request<ApiRoomState>(`/rooms/${roomId}/cards/${cardId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/** Start a voting round on the current card (facilitator only).
 *
 * @param roomId - Room identifier.
 * @returns Updated room state with an active round.
 */
export function startRound(roomId: string): Promise<ApiRoomState> {
  return request<ApiRoomState>(`/rooms/${roomId}/rounds/start`, { method: 'POST', body: '{}' });
}

/** Cast a vote in the active round.
 *
 * @param roomId - Room identifier.
 * @param body - Voter user id and deck value.
 * @returns Updated room state including the vote.
 */
export function castVote(roomId: string, body: VoteRequest): Promise<ApiRoomState> {
  return request<ApiRoomState>(`/rooms/${roomId}/rounds/vote`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** Reveal all votes and compute consensus stats (facilitator only).
 *
 * @param roomId - Room identifier.
 * @returns Updated room state with revealed votes.
 */
export function revealVotes(roomId: string): Promise<ApiRoomState> {
  return request<ApiRoomState>(`/rooms/${roomId}/rounds/reveal`, { method: 'POST', body: '{}' });
}

/** Clear votes and restart the current round (facilitator only).
 *
 * @param roomId - Room identifier.
 * @returns Updated room state with a fresh voting round.
 */
export function revote(roomId: string): Promise<ApiRoomState> {
  return request<ApiRoomState>(`/rooms/${roomId}/rounds/revote`, { method: 'POST', body: '{}' });
}

/** Skip the current card and advance the queue (facilitator only).
 *
 * @param roomId - Room identifier.
 * @returns Updated room state at the next card or waiting status.
 */
export function skipCard(roomId: string): Promise<ApiRoomState> {
  return request<ApiRoomState>(`/rooms/${roomId}/rounds/skip`, { method: 'POST', body: '{}' });
}

/** Move to the next card after consensus (facilitator only).
 *
 * @param roomId - Room identifier.
 * @returns Updated room state at the next queue index.
 */
export function nextCard(roomId: string): Promise<ApiRoomState> {
  return request<ApiRoomState>(`/rooms/${roomId}/rounds/next`, { method: 'POST', body: '{}' });
}

/** Apply the agreed estimate to the current card (facilitator only).
 *
 * @param roomId - Room identifier.
 * @param body - Consensus value and optional Businessmap sync flag.
 * @returns Updated room state in consensus status.
 */
export function submitConsensus(roomId: string, body: ConsensusRequest): Promise<ApiRoomState> {
  return request<ApiRoomState>(`/rooms/${roomId}/rounds/consensus`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
