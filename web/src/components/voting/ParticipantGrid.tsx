import type { User, Vote } from '@/types/planning';

interface ParticipantGridProps {
  participants: User[];
  votes: Vote[];
  votesRevealed: boolean;
  currentUserId?: string;
}

const CARD_WRAPPER = 'w-[4.5rem] sm:w-[5.5rem] md:w-full max-w-[6rem] md:max-w-none mx-auto';

/** Hidden vote card shown before reveal.
 *
 * @param hasVoted - Whether the participant has submitted a vote.
 * @returns Card back UI with voted or waiting state.
 */
function VoteCardBack({ hasVoted }: { hasVoted: boolean }) {
  return (
    <div
      className={`aspect-[2/3] rounded-md border-2 flex items-center justify-center transition-all ${
        hasVoted
          ? 'border-bm-blue bg-bm-accentSoft'
          : 'border-dashed border-bm-insetBorder bg-bm-inset'
      }`}
    >
      <div className="text-center">
        <div className={`text-base sm:text-xl md:text-2xl ${hasVoted ? 'text-bm-blue' : 'text-bm-dotInactive'}`}>
          {hasVoted ? '✓' : '?'}
        </div>
        <p className="text-[9px] sm:text-[10px] text-bm-textMuted mt-0.5">
          {hasVoted ? 'Voted' : 'Waiting'}
        </p>
      </div>
    </div>
  );
}

/** Revealed vote card showing the selected deck value.
 *
 * @param value - Vote label from the deck.
 * @returns Card front UI with the vote value.
 */
function VoteCardFront({ value }: { value: string }) {
  return (
    <div className="aspect-[2/3] rounded-md border-2 border-bm-blue bg-bm-surface shadow-md flex items-center justify-center">
      <span className="text-base sm:text-xl md:text-2xl font-bold text-bm-blue">{value}</span>
    </div>
  );
}

export function ParticipantGrid({ participants, votes, votesRevealed, currentUserId }: ParticipantGridProps) {
  const onlineParticipants = participants.filter((p) => p.isOnline);
  const voters = onlineParticipants.filter((p) => p.canVote);
  const facilitators = onlineParticipants.filter((p) => !p.canVote);

  return (
    <div>
      {facilitators.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-bm-textMuted">
            Facilitating
          </span>
          {facilitators.map((participant) => (
            <span
              key={participant.id}
              className={`inline-flex items-center gap-1.5 rounded-full border border-bm-border bg-bm-surface px-2.5 py-1 text-xs ${
                participant.id === currentUserId ? 'font-semibold text-bm-textDark' : 'text-bm-textMuted'
              }`}
            >
              <GearIcon className="h-3 w-3 text-bm-textMuted" />
              {participant.displayName}
              <span className="text-[10px] font-medium uppercase tracking-wide text-bm-textMuted">
                Croupier
              </span>
            </span>
          ))}
        </div>
      )}

      {voters.length > 0 && (
        <>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-bm-textMuted mb-3">
            Participants ({voters.length})
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
            {voters.map((participant) => {
              const vote = votes.find((v) => v.userId === participant.id);
              const hasVoted = Boolean(vote?.value);
              const isCurrentUser = participant.id === currentUserId;

              return (
                <div key={participant.id} className="text-center">
                  <div className={`mb-1 ${CARD_WRAPPER}`}>
                    {votesRevealed && vote ? (
                      <VoteCardFront value={vote.value} />
                    ) : (
                      <VoteCardBack hasVoted={hasVoted} />
                    )}
                  </div>
                  <p
                    className={`text-[11px] sm:text-xs truncate ${
                      isCurrentUser ? 'font-semibold text-bm-textDark' : 'text-bm-textMuted'
                    }`}
                  >
                    {participant.displayName}
                    {participant.isFacilitator && (
                      <span className="ml-1 text-[10px] text-bm-blue">(fac.)</span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/** Inline gear icon for facilitator badges.
 *
 * @param className - Optional Tailwind size and color classes.
 * @returns SVG gear icon element.
 */
function GearIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
