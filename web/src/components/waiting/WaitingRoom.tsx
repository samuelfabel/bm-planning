import type { User } from '@/types/planning';

interface WaitingRoomProps {
  participants: User[];
  taskCount: number;
  onStart: () => void;
  canStart?: boolean;
}

export function WaitingRoom({ participants, taskCount, onStart, canStart = true }: WaitingRoomProps) {
  const online = participants.filter((p) => p.isOnline);

  return (
    <div className="max-w-lg mx-auto text-center py-12">
      <div className="bg-bm-surface border border-bm-border rounded-md shadow-sm p-8">
        <h2 className="text-lg font-semibold text-bm-textDark">Waiting Room</h2>
        <p className="text-sm text-bm-textMuted mt-2">
          {taskCount} task{taskCount !== 1 ? 's' : ''} in queue · {online.length} participant{online.length !== 1 ? 's' : ''} online
        </p>

        <ul className="mt-6 space-y-2 text-left">
          {participants.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 px-3 py-2 rounded-md bg-bm-board"
            >
              <span className={`h-2 w-2 rounded-full ${p.isOnline ? 'bg-emerald-400' : 'bg-bm-dotInactive'}`} />
              <span className="text-sm text-bm-textDark">{p.displayName}</span>
              {p.isFacilitator && (
                <span className="ml-auto text-[10px] font-medium text-bm-blue bg-bm-accentSoft px-2 py-0.5 rounded">
                  {p.canVote ? 'Facilitator' : 'Croupier'}
                </span>
              )}
            </li>
          ))}
        </ul>

        {canStart ? (
          <button
            type="button"
            onClick={onStart}
            className="mt-6 w-full bg-bm-blue hover:bg-blue-700 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
          >
            Start Planning
          </button>
        ) : (
          <p className="mt-6 text-xs text-bm-textMuted">
            Waiting for facilitator to start the round.
          </p>
        )}
      </div>
    </div>
  );
}
