import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePlanning } from '@/context/PlanningContext';
import type { Vote } from '@/types/planning';
import { parseCardValue, suggestConsensus } from '@/utils/consensus';
import {
  updateCardCustomField,
  updateCardNativeSize,
  type BusinessmapCredentials,
} from '@/services/businessmapApi';
import { PrimaryButton, SecondaryButton } from '@/components/ui/FormPrimitives';

interface ConsensusPanelProps {
  votes: Vote[];
  eligibleUserIds: Set<string>;
}

/** Bar chart of revealed vote values for eligible participants.
 *
 * @param votes - Revealed votes in the current round.
 * @param eligibleUserIds - Participant ids allowed to vote.
 * @returns Vote distribution visualization.
 */
function VoteDistribution({ votes, eligibleUserIds }: { votes: Vote[]; eligibleUserIds: Set<string> }) {
  const distribution = useMemo(() => {
    const counts = new Map<string, number>();
    votes
      .filter((v) => eligibleUserIds.has(v.userId))
      .forEach((v) => {
        counts.set(v.value, (counts.get(v.value) ?? 0) + 1);
      });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [votes, eligibleUserIds]);

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
          <span className="text-xs text-bm-textMuted w-16">{count} vote{count !== 1 ? 's' : ''}</span>
        </div>
      ))}
    </div>
  );
}

/** Consensus controls shown after vote reveal with suggestion and Businessmap sync.
 *
 * @param props - {@link ConsensusPanelProps}
 * @returns React element.
 */
export function ConsensusPanel({ votes, eligibleUserIds }: ConsensusPanelProps) {
  const { workspace, profile } = useAuth();
  const { session, applyConsensus, nextCard, revote } = usePlanning();

  const settings = session?.settings;
  const deck = settings?.deck ?? { type: 'fibonacci', values: ['1', '2', '3', '5', '8', '13', '?'], allowPass: true, allowBreak: false };
  const algorithm = settings?.consensusAlgorithm ?? 'average_nearest';
  const syncValueSource = settings?.syncValueSource ?? 'nearest_card';

  const suggestion = useMemo(
    () => suggestConsensus(votes, deck, algorithm, eligibleUserIds),
    [votes, deck, algorithm, eligibleUserIds],
  );

  const [consensusValue, setConsensusValue] = useState(suggestion.suggestedValue);
  const [syncToBM, setSyncToBM] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    setConsensusValue(suggestion.suggestedValue);
  }, [suggestion.suggestedValue]);

  const credentials: BusinessmapCredentials | null =
    workspace.subdomain && profile.apiKey
      ? { subdomain: workspace.subdomain, apiKey: profile.apiKey }
      : null;

  const activeCard = session?.queue[session.currentCardIdx];

  async function syncConsensusToBusinessmap(value: string) {
    if (!syncToBM) return;
    if (!activeCard) throw new Error('No active card selected');
    if (!credentials) {
      throw new Error('Businessmap credentials are missing in this browser session');
    }

    if (workspace.estimationTarget.kind === 'native_size') {
      const size =
        syncValueSource === 'raw_average'
          ? suggestion.average
          : parseCardValue(value);
      if (size === null || size === undefined) {
        throw new Error('Unable to resolve a numeric size to sync');
      }
      await updateCardNativeSize(credentials, activeCard.cardId, size);
      return;
    }

    const mapping = workspace.customFieldMapping;
    if (!mapping) {
      throw new Error('Custom field mapping is required to sync this estimate');
    }

    if (mapping.fieldType === 'number') {
      const numericValue =
        syncValueSource === 'raw_average'
          ? suggestion.average
          : parseCardValue(value);
      if (numericValue === null || numericValue === undefined) {
        throw new Error('Only numeric values can be synced to number fields');
      }
      await updateCardCustomField(credentials, activeCard.cardId, mapping.fieldId, {
        value: numericValue,
      });
      return;
    }

    const desiredLabel =
      syncValueSource === 'raw_average' && suggestion.average !== null
        ? String(suggestion.average)
        : value;
    const option = mapping.allowedValues?.find(
      (allowed) => allowed.value.trim().toLowerCase() === desiredLabel.trim().toLowerCase(),
    );

    if (!option) {
      throw new Error(
        `Dropdown value "${desiredLabel}" does not exist in the mapped Businessmap field`,
      );
    }

    await updateCardCustomField(credentials, activeCard.cardId, mapping.fieldId, {
      values: [{ value_id: option.valueId }],
    });
  }

  return (
    <div className="bg-bm-surface border border-bm-border rounded-md shadow-sm p-5">
      <h3 className="text-sm font-semibold text-bm-textDark mb-4">Round Consensus</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-bm-textMuted mb-3">
            Vote distribution
          </p>
          <VoteDistribution votes={votes} eligibleUserIds={eligibleUserIds} />
        </div>

        <div className="space-y-4">
          {suggestion.average !== null && (
            <p className="text-sm text-bm-textMuted">
              Average: <span className="font-semibold text-bm-textDark">{suggestion.average.toFixed(1)}</span>
              {suggestion.nearestCard && (
                <>
                  {' '}
                  → nearest card:{' '}
                  <span className="font-bold text-bm-blue text-lg">{suggestion.nearestCard}</span>
                </>
              )}
            </p>
          )}

          <div>
            <label htmlFor="consensus-value" className="block text-sm font-medium text-bm-textDark mb-1.5">
              Final value
            </label>
            <input
              id="consensus-value"
              type="text"
              value={consensusValue}
              onChange={(e) => setConsensusValue(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-bm-border rounded-md bg-bm-surface text-bm-textDark focus:outline-none focus:ring-2 focus:ring-bm-blue/30 focus:border-bm-blue"
            />
          </div>

          <p className="text-xs text-bm-textMuted">
            Write to BM:{' '}
            {syncValueSource === 'raw_average' ? 'arithmetic mean' : 'deck card'}
            {' · '}
            {workspace.estimationTarget.kind === 'native_size' ? 'Size field' : 'custom field'}
          </p>

          <label className="flex items-center gap-2 text-sm text-bm-textDark cursor-pointer">
            <input
              type="checkbox"
              checked={syncToBM}
              onChange={(e) => setSyncToBM(e.target.checked)}
              className="rounded border-bm-border text-bm-blue focus:ring-bm-blue"
            />
            Sync with Businessmap
          </label>

          <div className="flex gap-2 pt-2">
            <PrimaryButton
              disabled={isApplying || !consensusValue.trim()}
              onClick={() => {
                const value = consensusValue.trim();
                if (!value) return;
                setIsApplying(true);
                setSyncError(null);
                void (async () => {
                  try {
                    await syncConsensusToBusinessmap(value);
                    applyConsensus(value, syncToBM);
                    nextCard();
                  } catch (error) {
                    setSyncError(
                      error instanceof Error ? error.message : 'Failed to sync with Businessmap',
                    );
                  } finally {
                    setIsApplying(false);
                  }
                })();
              }}
            >
              {isApplying ? 'Applying...' : 'Apply and Next'}
            </PrimaryButton>
            <SecondaryButton onClick={revote}>Revote</SecondaryButton>
          </div>
          {syncError && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {syncError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
