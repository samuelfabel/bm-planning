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

export function createRoom(body: CreateRoomRequest): Promise<CreateRoomResponse> {
  return request<CreateRoomResponse>('/rooms', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getRoom(roomId: string): Promise<ApiRoomState> {
  return request<ApiRoomState>(`/rooms/${roomId}`, { method: 'GET' });
}

export function joinRoom(roomId: string, body: JoinRoomRequest): Promise<JoinRoomResponse> {
  return request<JoinRoomResponse>(`/rooms/${roomId}/join`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function leaveRoom(roomId: string, body?: { user_id?: string }): Promise<void> {
  return request<void>(`/rooms/${roomId}/leave`, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  });
}

export function updateQueue(roomId: string, body: UpdateQueueRequest): Promise<ApiRoomState> {
  return request<ApiRoomState>(`/rooms/${roomId}/queue`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function updateCard(roomId: string, cardId: number, body: UpdateCardRequest): Promise<ApiRoomState> {
  return request<ApiRoomState>(`/rooms/${roomId}/cards/${cardId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function startRound(roomId: string): Promise<ApiRoomState> {
  return request<ApiRoomState>(`/rooms/${roomId}/rounds/start`, { method: 'POST', body: '{}' });
}

export function castVote(roomId: string, body: VoteRequest): Promise<ApiRoomState> {
  return request<ApiRoomState>(`/rooms/${roomId}/rounds/vote`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function revealVotes(roomId: string): Promise<ApiRoomState> {
  return request<ApiRoomState>(`/rooms/${roomId}/rounds/reveal`, { method: 'POST', body: '{}' });
}

export function revote(roomId: string): Promise<ApiRoomState> {
  return request<ApiRoomState>(`/rooms/${roomId}/rounds/revote`, { method: 'POST', body: '{}' });
}

export function skipCard(roomId: string): Promise<ApiRoomState> {
  return request<ApiRoomState>(`/rooms/${roomId}/rounds/skip`, { method: 'POST', body: '{}' });
}

export function nextCard(roomId: string): Promise<ApiRoomState> {
  return request<ApiRoomState>(`/rooms/${roomId}/rounds/next`, { method: 'POST', body: '{}' });
}

export function submitConsensus(roomId: string, body: ConsensusRequest): Promise<ApiRoomState> {
  return request<ApiRoomState>(`/rooms/${roomId}/rounds/consensus`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
