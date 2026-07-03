import { useMemo, useState } from 'react';
import { usePlanning } from '@/context/PlanningContext';
import type { Vote } from '@/types/planning';
import { PrimaryButton, SecondaryButton } from '@/components/ui/FormPrimitives';

interface ConsensusPanelProps {
  votes: Vote[];
}

function VoteDistribution({ votes }: { votes: Vote[] }) {
  const distribution = useMemo(() => {
    const counts = new Map<string, number>();
    votes.forEach((v) => {
      counts.set(v.value, (counts.get(v.value) ?? 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [votes]);

  const max = Math.max(...distribution.map(([, c]) => c), 1);

  return (
    <div className="space-y-2">
      {distribution.map(([value, count]) => (
        <div key={value} className="flex items-center gap-3">
          <span className="w-8 text-sm font-bold text-bm-blue text-right">{value}</span>
          <div className="flex-1 h-6 bg-bm-board rounded overflow-hidden">
            <div
              className="h-full bg-bm-blue/80 rounded transition-all"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs text-bm-textMuted w-16">{count} voto{count !== 1 ? 's' : ''}</span>
        </div>
      ))}
    </div>
  );
}

function suggestConsensus(votes: Vote[]): string {
  const counts = new Map<string, number>();
  votes.forEach((v) => counts.set(v.value, (counts.get(v.value) ?? 0) + 1));
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? '?';
}

export function ConsensusPanel({ votes }: ConsensusPanelProps) {
  const { applyConsensus, nextCard, revote } = usePlanning();
  const suggestion = suggestConsensus(votes);
  const [consensusValue, setConsensusValue] = useState(suggestion);
  const [syncToBM, setSyncToBM] = useState(true);

  return (
    <div className="bg-white border border-bm-border rounded-md shadow-sm p-5">
      <h3 className="text-sm font-semibold text-bm-textDark mb-4">Consenso da Rodada</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-bm-textMuted mb-3">
            Distribuição de votos
          </p>
          <VoteDistribution votes={votes} />
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-bm-textMuted mb-1">
              Sugestão (moda): <span className="font-bold text-bm-blue text-lg">{suggestion}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-bm-textDark mb-1.5">
              Valor final
            </label>
            <input
              type="text"
              value={consensusValue}
              onChange={(e) => setConsensusValue(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-bm-border rounded-md focus:outline-none focus:ring-2 focus:ring-bm-blue/30 focus:border-bm-blue"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-bm-textDark cursor-pointer">
            <input
              type="checkbox"
              checked={syncToBM}
              onChange={(e) => setSyncToBM(e.target.checked)}
              className="rounded border-bm-border text-bm-blue focus:ring-bm-blue"
            />
            Sincronizar com Businessmap
          </label>

          <div className="flex gap-2 pt-2">
            <PrimaryButton
              onClick={() => {
                applyConsensus(consensusValue);
                if (syncToBM) {
                  // mock sync — será integrado ao back-end
                }
                nextCard();
              }}
            >
              Aplicar e Próximo
            </PrimaryButton>
            <SecondaryButton onClick={revote}>Revotar</SecondaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
