import { useEffect } from 'react';
import type { ClientMessage } from '@/types/api';
import { usePlanning } from '@/context/PlanningContext';
import { useConnection } from '@/context/ConnectionContext';
import { connectRoomWebSocket } from '@/services/websocket';

interface UseRoomWebSocketOptions {
  roomId: string;
  displayName: string;
  clientId: string;
  enabled: boolean;
}

/** Connect a room page to the live WebSocket and planning context.
 *
 * @param options.roomId - Room to join.
 * @param options.displayName - Participant display name sent on join.
 * @param options.clientId - Stable client id for reconnects.
 * @param options.enabled - When false, disconnects and clears the live sender.
 */
export function useRoomWebSocket({
  roomId,
  displayName,
  clientId,
  enabled,
}: UseRoomWebSocketOptions) {
  const { applyServerMessage, setLiveSender } = usePlanning();
  const { setStatus, setError } = useConnection();

  useEffect(() => {
    if (!enabled) {
      setLiveSender(null);
      setStatus('disconnected');
      return;
    }

    const socket = connectRoomWebSocket({
      roomId,
      joinPayload: {
        display_name: displayName,
        client_id: clientId,
      },
      onMessage: (message) => {
        setError(null);
        applyServerMessage(message);
      },
      onStatusChange: (status) => {
        setStatus(status);
      },
      onError: (error) => {
        setError(error);
      },
    });

    setLiveSender((message: ClientMessage) => {
      socket.send(message);
    });

    return () => {
      setLiveSender(null);
      socket.close();
    };
  }, [
    enabled,
    roomId,
    displayName,
    clientId,
    applyServerMessage,
    setLiveSender,
    setStatus,
    setError,
  ]);
}
