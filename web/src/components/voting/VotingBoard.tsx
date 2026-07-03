import { useAuth } from '@/context/AuthContext';
import { usePlanning } from '@/context/PlanningContext';
import { TaskQueue } from './TaskQueue';
import { ActiveCard } from './ActiveCard';
import { ParticipantGrid } from './ParticipantGrid';
import { DeckRow } from './DeckRow';
import { ConsensusPanel } from '@/components/consensus/ConsensusPanel';
import { PrimaryButton, SecondaryButton } from '@/components/ui/FormPrimitives';

export function VotingBoard() {
  const { config } = useAuth();
  const {
    session,
    selectedVote,
    castVote,
    revealVotes,
    startVoting,
    revote,
  } = usePlanning();

  if (!session) {
    return (
      <div className="flex items-center justify-center h-96 text-bm-textMuted">
        Nenhuma sessão ativa. Configure uma planning em /setup.
      </div>
    );
  }

  const currentCard = session.queue[session.currentCardIdx];
  const deckValues = config?.deck.values ?? ['1', '2', '3', '5', '8', '13', '?'];
  const isWaiting = session.status === 'waiting';
  const isVoting = session.status === 'voting';
  const isRevealed = session.status === 'revealed' || session.status === 'consensus';
  const allVoted = session.votes.filter((v) => session.participants.find((p) => p.id === v.userId && p.isOnline)).every((v) => v.value);

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      <div className="flex flex-1 min-h-0">
        <TaskQueue queue={session.queue} currentIdx={session.currentCardIdx} />

        <div className="flex-1 flex flex-col min-w-0 bg-bm-bg">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-bm-border">
            <div>
              <h2 className="text-sm font-semibold text-bm-textDark">{session.name}</h2>
              <p className="text-xs text-bm-textMuted">
                {isWaiting && 'Sala de espera — aguardando início'}
                {isVoting && 'Votação em andamento'}
                {isRevealed && 'Votos revelados — defina o consenso'}
                {session.status === 'closed' && 'Planning concluída'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isWaiting && (
                <PrimaryButton onClick={startVoting}>Iniciar Votação</PrimaryButton>
              )}
              {isVoting && (
                <>
                  <SecondaryButton onClick={revote}>Limpar votos</SecondaryButton>
                  <PrimaryButton onClick={revealVotes} disabled={!allVoted}>
                    Revelar Votos
                  </PrimaryButton>
                </>
              )}
            </div>
          </div>

          {/* Main voting area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {currentCard && (
              <>
                <ActiveCard card={currentCard} />
                <ParticipantGrid
                  participants={session.participants}
                  votes={session.votes}
                  votesRevealed={session.votesRevealed}
                  currentUserId="usr-1"
                />
              </>
            )}

            {isRevealed && (
              <ConsensusPanel votes={session.votes} />
            )}
          </div>

          {/* Deck */}
          {(isVoting || isRevealed) && (
            <DeckRow
              values={deckValues}
              selectedValue={selectedVote}
              onSelect={castVote}
              disabled={!isVoting}
            />
          )}
        </div>
      </div>
    </div>
  );
}
