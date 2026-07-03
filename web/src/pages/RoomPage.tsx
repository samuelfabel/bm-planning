import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { VotingBoard } from '@/components/voting/VotingBoard';
import { WaitingRoom } from '@/components/waiting/WaitingRoom';
import { usePlanning, useDemoQueue } from '@/context/PlanningContext';
import { useAuth } from '@/context/AuthContext';
import { useConnection } from '@/context/ConnectionContext';
import { useRoomWebSocket } from '@/hooks/useRoomWebSocket';
import { getRoom, joinRoom, leaveRoom } from '@/services/api';
import type { DemoPersona } from '@/types/planning';

function personaFromParam(value: string | null): DemoPersona {
  return value === 'participant' ? 'participant' : 'croupier';
}

function clientIdStorageKey(roomId: string) {
  return `bm-planning-client-id:${roomId}`;
}

function getOrCreateClientId(roomId: string): string {
  const key = clientIdStorageKey(roomId);
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const generated =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `client_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  sessionStorage.setItem(key, generated);
  return generated;
}

export function RoomPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useAuth();
  const {
    session,
    currentUser,
    currentUserId,
    createSession,
    setDemoPersona,
    setLiveSession,
    startVoting,
  } = usePlanning();
  const { status: liveConnectionStatus, error: liveConnectionError } = useConnection();
  const demoQueue = useDemoQueue();
  const isDemo = roomId === 'demo';
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [joinedIdentity, setJoinedIdentity] = useState<{
    displayName: string;
    clientId: string;
  } | null>(null);

  const canAutoJoinAsFacilitator = useMemo(() => {
    if (isDemo || !roomId) return false;
    if (!profile.displayName.trim()) return false;
    if (searchParams.get('facilitator') === '1') return true;
    const state = location.state as { asFacilitator?: boolean } | null;
    return Boolean(state?.asFacilitator);
  }, [isDemo, roomId, profile.displayName, searchParams, location.state]);

  useEffect(() => {
    if (!isDemo || session) return;
    const persona = personaFromParam(searchParams.get('as'));
    createSession('Demo — Sprint Planning', demoQueue, undefined, { isDemo: true });
    setDemoPersona(persona);
  }, [isDemo, session, createSession, demoQueue, searchParams, setDemoPersona]);

  const joinLiveRoom = useCallback(
    async (name: string, asFacilitator: boolean) => {
      if (!roomId) return;

      const normalizedName = name.trim();
      if (!normalizedName) {
        setLoadError('Display name is required');
        return;
      }

      setIsLoading(true);
      setLoadError(null);
      try {
        const clientId = getOrCreateClientId(roomId);
        const response = await joinRoom(roomId, {
          display_name: normalizedName,
          client_id: clientId,
          is_facilitator: asFacilitator,
          can_vote: asFacilitator ? profile.facilitatorRole !== 'croupier' : true,
        });

        const roomState = response.room_state ?? response.room;
        if (!roomState) {
          throw new Error('Room state was not returned by the server');
        }

        const participants = Array.isArray(roomState.participants)
          ? roomState.participants
          : Object.values(roomState.participants);
        const resolvedUserId =
          response.user?.id ??
          response.user_id ??
          participants.find((participant) => participant.display_name === normalizedName)?.id ??
          null;

        setLiveSession(roomState, resolvedUserId);
        setJoinedIdentity({ displayName: normalizedName, clientId });
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to join room');
      } finally {
        setIsLoading(false);
      }
    },
    [roomId, profile.facilitatorRole, setLiveSession],
  );

  useEffect(() => {
    if (isDemo || !roomId || joinedIdentity) return;

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    void (async () => {
      try {
        const room = await getRoom(roomId);
        if (cancelled) return;
        setLiveSession(room, null);
        if (canAutoJoinAsFacilitator) {
          await joinLiveRoom(profile.displayName, true);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load room');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isDemo,
    roomId,
    joinedIdentity,
    setLiveSession,
    canAutoJoinAsFacilitator,
    profile.displayName,
    joinLiveRoom,
  ]);

  useRoomWebSocket({
    roomId: roomId ?? '',
    displayName: joinedIdentity?.displayName ?? '',
    clientId: joinedIdentity?.clientId ?? '',
    enabled: Boolean(!isDemo && roomId && joinedIdentity),
  });

  useEffect(() => {
    if (isDemo || !roomId || !currentUserId) return;
    return () => {
      void leaveRoom(roomId, { user_id: currentUserId }).catch(() => undefined);
    };
  }, [isDemo, roomId, currentUserId]);

  const handleDemoPersonaChange = (persona: DemoPersona) => {
    setDemoPersona(persona);
    setSearchParams(
      { as: persona === 'participant' ? 'participant' : 'croupier' },
      { replace: true },
    );
  };

  if (!isDemo) {
    if (isLoading && !session) {
      return (
        <MainLayout>
          <div className="flex items-center justify-center h-96 text-bm-textMuted">
            Loading room...
          </div>
        </MainLayout>
      );
    }

    if (loadError && !session) {
      return (
        <MainLayout>
          <div className="max-w-lg mx-auto mt-12 border border-red-200 bg-red-50 text-red-700 rounded-md px-4 py-3">
            {loadError}
          </div>
        </MainLayout>
      );
    }

    if (!joinedIdentity) {
      return (
        <MainLayout>
          <div className="max-w-md mx-auto py-12 px-4">
            <div className="bg-bm-surface border border-bm-border rounded-md shadow-sm p-6 space-y-4">
              <h1 className="text-lg font-semibold text-bm-textDark">Join planning room</h1>
              <p className="text-sm text-bm-textMuted">
                Enter your display name to join this live room.
              </p>
              {loadError && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                  {loadError}
                </p>
              )}
              <label className="block text-sm font-medium text-bm-textDark">
                Display name
                <input
                  className="mt-1 w-full px-3 py-2 border border-bm-border rounded-md bg-bm-surface text-bm-textDark focus:outline-none focus:ring-2 focus:ring-bm-blue/30 focus:border-bm-blue"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Your name"
                />
              </label>
              <button
                type="button"
                onClick={() => void joinLiveRoom(displayName, false)}
                disabled={isLoading || !displayName.trim()}
                className="w-full bg-bm-blue hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
              >
                {isLoading ? 'Joining...' : 'Join room'}
              </button>
            </div>
          </div>
        </MainLayout>
      );
    }

    if (!session) {
      return (
        <MainLayout>
          <div className="flex items-center justify-center h-96 text-bm-textMuted">
            Room state is not available yet.
          </div>
        </MainLayout>
      );
    }

    return (
      <MainLayout>
        {liveConnectionStatus !== 'connected' && (
          <div className="mx-4 mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {liveConnectionStatus === 'connecting'
              ? 'Connecting to room live updates...'
              : 'Disconnected from live updates. Trying to reconnect...'}
            {liveConnectionError && <span className="ml-1">({liveConnectionError})</span>}
          </div>
        )}
        {session.status === 'waiting' ? (
          <WaitingRoom
            participants={session.participants}
            taskCount={session.queue.length}
            onStart={startVoting}
            canStart={Boolean(currentUser?.isFacilitator)}
          />
        ) : (
          <VotingBoard />
        )}
        {loadError && (
          <div className="mx-4 mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {loadError}
          </div>
        )}
        <div className="sr-only" aria-live="polite">
          Live connection: {liveConnectionStatus}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <VotingBoard onDemoPersonaChange={handleDemoPersonaChange} />
    </MainLayout>
  );
}
