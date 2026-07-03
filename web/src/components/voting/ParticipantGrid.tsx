import type { User, Vote } from '@/types/planning';

interface ParticipantGridProps {
  participants: User[];
  votes: Vote[];
  votesRevealed: boolean;
  currentUserId?: string;
}

function VoteCardBack({ hasVoted }: { hasVoted: boolean }) {
  return (
    <div
      className={`aspect-[2/3] rounded-md border-2 flex items-center justify-center transition-all ${
        hasVoted
          ? 'border-bm-blue bg-blue-50'
          : 'border-dashed border-slate-300 bg-slate-50'
      }`}
    >
      <div className="text-center">
        <div className={`text-2xl ${hasVoted ? 'text-bm-blue' : 'text-slate-300'}`}>
          {hasVoted ? '✓' : '?'}
        </div>
        <p className="text-[10px] text-bm-textMuted mt-1">
          {hasVoted ? 'Votou' : 'Aguardando'}
        </p>
      </div>
    </div>
  );
}

function VoteCardFront({ value }: { value: string }) {
  return (
    <div className="aspect-[2/3] rounded-md border-2 border-bm-blue bg-white shadow-md flex items-center justify-center">
      <span className="text-2xl font-bold text-bm-blue">{value}</span>
    </div>
  );
}

export function ParticipantGrid({ participants, votes, votesRevealed, currentUserId }: ParticipantGridProps) {
  const onlineParticipants = participants.filter((p) => p.isOnline);

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-bm-textMuted mb-3">
        Participantes ({onlineParticipants.length})
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {onlineParticipants.map((participant) => {
          const vote = votes.find((v) => v.userId === participant.id);
          const hasVoted = Boolean(vote?.value);
          const isCurrentUser = participant.id === currentUserId;

          return (
            <div key={participant.id} className="text-center">
              <div className="mb-1.5">
                {votesRevealed && vote ? (
                  <VoteCardFront value={vote.value} />
                ) : (
                  <VoteCardBack hasVoted={hasVoted} />
                )}
              </div>
              <p className={`text-xs truncate ${isCurrentUser ? 'font-semibold text-bm-textDark' : 'text-bm-textMuted'}`}>
                {participant.displayName}
                {participant.isFacilitator && (
                  <span className="ml-1 text-[10px] text-bm-blue">(fac.)</span>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
