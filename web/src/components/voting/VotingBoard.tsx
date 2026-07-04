import { useAuth } from '@/context/AuthContext';
import { usePlanning } from '@/context/PlanningContext';
import { demoUserIdForPersona, filterVotingQueue, isInVotingQueue } from '@/types/planning';
import type { DemoPersona } from '@/types/planning';
import { TaskQueue } from './TaskQueue';
import { ActiveCard } from './ActiveCard';
import { ParticipantGrid } from './ParticipantGrid';
import { DeckRow } from './DeckRow';
import { ConsensusPanel } from '@/components/consensus/ConsensusPanel';
import { DemoRoleSwitcher } from './DemoRoleSwitcher';
import { DemoGuideBanner } from './DemoGuideBanner';
import { PrimaryButton, SecondaryButton } from '@/components/ui/FormPrimitives';

interface VotingBoardProps {
  onDemoPersonaChange?: (persona: DemoPersona) => void;
}

/** Main voting room layout with queue, active card, deck, and consensus.
 *
 * @param props - {@link VotingBoardProps}
 * @returns React element.
 */
export function VotingBoard({ onDemoPersonaChange }: VotingBoardProps) {
  const { workspace } = useAuth();
  const {
    session,
    currentUser,
    currentUserId: liveCurrentUserId,
    selectedVote,
    demoPersona,
    castVote,
    revealVotes,
    startVoting,
    revote,
    selectCurrentCard,
    setCurrentCardDescription,
    addSubtask,
    updateSubtask,
    toggleSubtask,
    removeSubtask,
    toggleCardExcludedFromVoting,
  } = usePlanning();

  if (!session) {
    return (
      <div className="flex items-center justify-center h-96 text-bm-textMuted">
        No active session. Set up a planning session at /setup.
      </div>
    );
  }

  const isDemo = Boolean(session.isDemo);
  const currentUserId =
    isDemo ? demoUserIdForPersona(demoPersona) : (liveCurrentUserId ?? 'usr-guest');
  const viewer = isDemo
    ? session.participants.find((participant) => participant.id === currentUserId) ?? null
    : currentUser;
  const viewingAsCroupier = isDemo ? demoPersona === 'croupier' : !Boolean(viewer?.canVote);
  const showFacilitatorControls = isDemo
    ? demoPersona === 'croupier'
    : Boolean(viewer?.isFacilitator);
  const canUseDeck = isDemo ? demoPersona === 'participant' : Boolean(viewer?.canVote);

  const deckValues = session.settings.deck.values;
  const eligibleUserIds = new Set(
    session.participants.filter((participant) => participant.canVote).map((participant) => participant.id),
  );
  const isWaiting = session.status === 'waiting';
  const isVoting = session.status === 'voting';
  const isRevealed = session.status === 'revealed' || session.status === 'consensus';
  const allVoted = Array.from(eligibleUserIds).every((userId) =>
    session.votes.some((vote) => vote.userId === userId && Boolean(vote.value)),
  );
  const isFacilitator = Boolean(viewer?.isFacilitator);
  const canEditDescription = isDemo
    ? demoPersona === 'croupier'
    : isFacilitator && workspace.allowDescriptionEdit;
  const showSubtasks = workspace.showSubtasks;
  const canManageSubtasks =
    showSubtasks &&
    (isDemo ? demoPersona === 'croupier' : isFacilitator && workspace.allowSubtasks);
  const canSelectTask = showFacilitatorControls;

  const fullQueue = session.queue;
  const votingIndices = fullQueue
    .map((_, i) => i)
    .filter((i) => isInVotingQueue(fullQueue[i]));
  const sidebarQueue = showFacilitatorControls ? fullQueue : filterVotingQueue(fullQueue);
  const currentCard = fullQueue[session.currentCardIdx];
  const participantSeesCurrent =
    showFacilitatorControls || (currentCard && isInVotingQueue(currentCard));
  const participantCanVote =
    participantSeesCurrent && (isVoting || isRevealed) && canUseDeck;

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] min-h-0">
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
        <TaskQueue
          queue={sidebarQueue}
          currentIdx={session.currentCardIdx}
          queueIndices={showFacilitatorControls ? undefined : votingIndices}
          onSelect={canSelectTask ? selectCurrentCard : undefined}
          onToggleExcluded={
            canSelectTask
              ? (idx) => toggleCardExcludedFromVoting(fullQueue[idx].cardId)
              : undefined
          }
          facilitatorMode={canSelectTask}
          showSubtasks={showSubtasks}
        />

        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-bm-bg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-2.5 bg-bm-surface border-b border-bm-border shrink-0">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-bm-textDark truncate">{session.name}</h2>
              <p className="text-xs text-bm-textMuted">
                {isWaiting && 'Waiting room — awaiting start'}
                {isVoting && 'Voting in progress'}
                {isRevealed && 'Votes revealed — set consensus'}
                {session.status === 'closed' && 'Planning complete'}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
              {isDemo && onDemoPersonaChange && (
                <DemoRoleSwitcher value={demoPersona} onChange={onDemoPersonaChange} />
              )}
              {showFacilitatorControls && isWaiting && (
                <PrimaryButton onClick={startVoting}>Start Voting</PrimaryButton>
              )}
              {showFacilitatorControls && isVoting && (
                <>
                  <SecondaryButton onClick={revote}>Clear votes</SecondaryButton>
                  <PrimaryButton onClick={revealVotes} disabled={!isDemo && !allVoted}>
                    Reveal Votes
                  </PrimaryButton>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {isDemo && <DemoGuideBanner persona={demoPersona} />}

            {currentCard && participantSeesCurrent && (
              <>
                <ActiveCard
                  card={currentCard}
                  showSubtasks={showSubtasks}
                  canEditDescription={canEditDescription}
                  canManageSubtasks={canManageSubtasks}
                  canToggleExcludedFromVoting={canSelectTask}
                  onToggleExcludedFromVoting={() =>
                    toggleCardExcludedFromVoting(currentCard.cardId)
                  }
                  onDescriptionChange={setCurrentCardDescription}
                  onAddSubtask={addSubtask}
                  onUpdateSubtask={updateSubtask}
                  onToggleSubtask={toggleSubtask}
                  onRemoveSubtask={removeSubtask}
                />
                <ParticipantGrid
                  participants={session.participants}
                  votes={session.votes}
                  votesRevealed={session.votesRevealed}
                  currentUserId={currentUserId}
                />
              </>
            )}

            {currentCard && !participantSeesCurrent && (
              <div className="rounded-md border border-bm-border bg-bm-board/80 px-4 py-6 text-center">
                <p className="text-sm font-medium text-bm-textDark">Waiting for the next votable task</p>
                <p className="text-xs text-bm-textMuted mt-1.5 max-w-sm mx-auto leading-relaxed">
                  The facilitator is reviewing a deferred task that is not part of your voting queue.
                </p>
              </div>
            )}

            {isRevealed && participantSeesCurrent && (
              <ConsensusPanel votes={session.votes} eligibleUserIds={eligibleUserIds} />
            )}
          </div>

          {participantCanVote && (
            <DeckRow
              values={deckValues}
              selectedValue={selectedVote}
              onSelect={castVote}
              disabled={!isVoting}
            />
          )}

          {(isVoting || isRevealed) && viewingAsCroupier && (
            <div className="shrink-0 bg-bm-board border-t border-bm-border px-4 py-3 text-center">
              <p className="text-xs text-bm-textMuted">
                Croupier mode — you facilitate this round without voting.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
