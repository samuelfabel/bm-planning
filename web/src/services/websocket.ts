import type { ClientMessage, ServerMessage } from '@/types/api';

export type RoomSocketStatus = 'connecting' | 'connected' | 'disconnected';

interface RoomSocketOptions {
  roomId: string;
  joinPayload: { display_name: string; client_id?: string };
  onMessage: (message: ServerMessage) => void;
  onStatusChange?: (status: RoomSocketStatus) => void;
  onError?: (error: string) => void;
  reconnectDelayMs?: number;
  maxReconnectAttempts?: number;
}

export interface RoomSocketClient {
  send: (message: ClientMessage) => void;
  close: () => void;
}

/** Build the WebSocket URL for a room live channel.
 *
 * @param roomId - Room identifier.
 * @returns ws or wss URL for the current host.
 */
function wsUrlForRoom(roomId: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/api/v1/rooms/${encodeURIComponent(roomId)}/live`;
}

/** Parse and validate a server WebSocket JSON frame.
 *
 * @param raw - Raw message string from the socket.
 * @returns Parsed server message, or null when JSON or type is invalid.
 */
function parseServerMessage(raw: string): ServerMessage | null {
  try {
    const parsed = JSON.parse(raw) as { type?: string };
    if (!parsed.type) return null;
    return parsed as ServerMessage;
  } catch {
    return null;
  }
}

/** Open a reconnecting WebSocket to a room live channel.
 *
 * @param options - Room id, join payload, and event callbacks.
 * @returns Client with send and close methods.
 */
export function connectRoomWebSocket(options: RoomSocketOptions): RoomSocketClient {
  const reconnectDelayMs = options.reconnectDelayMs ?? 1500;
  const maxReconnectAttempts = options.maxReconnectAttempts ?? 20;

  let socket: WebSocket | null = null;
  let pingTimer: number | null = null;
  let reconnectTimer: number | null = null;
  let reconnectAttempts = 0;
  let manuallyClosed = false;

  const setStatus = (status: RoomSocketStatus) => {
    options.onStatusChange?.(status);
  };

  const clearTimers = () => {
    if (pingTimer) {
      window.clearInterval(pingTimer);
      pingTimer = null;
    }
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const send = (message: ClientMessage) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(message));
  };

  const scheduleReconnect = () => {
    if (manuallyClosed || reconnectAttempts >= maxReconnectAttempts) {
      setStatus('disconnected');
      return;
    }
    reconnectAttempts += 1;
    reconnectTimer = window.setTimeout(connect, reconnectDelayMs * reconnectAttempts);
  };

  const connect = () => {
    clearTimers();
    setStatus('connecting');
    socket = new WebSocket(wsUrlForRoom(options.roomId));

    socket.onopen = () => {
      reconnectAttempts = 0;
      setStatus('connected');
      send({ type: 'join', ...options.joinPayload });
      pingTimer = window.setInterval(() => {
        send({ type: 'ping' });
      }, 20_000);
    };

    socket.onmessage = (event) => {
      if (typeof event.data !== 'string') return;
      const message = parseServerMessage(event.data);
      if (!message) return;
      options.onMessage(message);
    };

    socket.onerror = () => {
      options.onError?.('WebSocket connection error');
    };

    socket.onclose = () => {
      clearTimers();
      if (manuallyClosed) {
        setStatus('disconnected');
        return;
      }
      scheduleReconnect();
    };
  };

  connect();

  return {
    send,
    close: () => {
      manuallyClosed = true;
      clearTimers();
      socket?.close();
      socket = null;
      setStatus('disconnected');
    },
  };
}
