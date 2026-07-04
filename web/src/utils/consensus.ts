import type { ConsensusAlgorithm, DeckConfig, Vote } from '@/types/planning';

const NON_NUMERIC = new Set(['?', 'Pass', '☕']);

/** Parses deck card to number when possible (½ → 0.5).
 *
 * @param value - Deck card label.
 * @returns Numeric value, or null for pass/break/non-numeric cards.
 */
export function parseCardValue(value: string): number | null {
  if (NON_NUMERIC.has(value)) return null;
  if (value === '½') return 0.5;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Keep only votes from participants eligible to vote.
 *
 * @param votes - All votes in the current round.
 * @param eligibleUserIds - Participant ids allowed to vote.
 * @returns Filtered vote list for consensus calculation.
 */
export function votingVotesForConsensus(
  votes: Vote[],
  eligibleUserIds: Set<string>,
): Vote[] {
  return votes.filter((v) => eligibleUserIds.has(v.userId));
}

/** Extract numeric deck values from vote labels.
 *
 * @param votes - Votes to parse.
 * @returns Numeric values; non-numeric deck cards are omitted.
 */
export function numericVoteValues(votes: Vote[]): number[] {
  return votes
    .map((v) => parseCardValue(v.value))
    .filter((n): n is number => n !== null);
}

/** Compute the arithmetic mean of numeric values.
 *
 * @param values - Numeric vote values.
 * @returns Average, or null when the input is empty.
 */
export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Compute the median of numeric values.
 *
 * @param values - Numeric vote values.
 * @returns Median, or null when the input is empty.
 */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
}

/** Nearest deck card by numeric distance.
 *
 * @param deck - Session deck configuration.
 * @param target - Target numeric value from average or median.
 * @returns Closest deck label, or null when no numeric cards exist.
 */
export function nearestDeckCard(deck: DeckConfig, target: number): string | null {
  let best: { value: string; dist: number } | null = null;
  for (const card of deck.values) {
    const n = parseCardValue(card);
    if (n === null) continue;
    const dist = Math.abs(n - target);
    if (!best || dist < best.dist) {
      best = { value: card, dist };
    }
  }
  return best?.value ?? null;
}

export interface ConsensusSuggestion {
  average: number | null;
  median: number | null;
  nearestCard: string | null;
  suggestedValue: string;
}

/** Suggest a consensus value from revealed votes and deck settings.
 *
 * @param votes - Revealed votes in the round.
 * @param deck - Session deck configuration.
 * @param algorithm - Consensus algorithm from session settings.
 * @param eligibleUserIds - Participant ids allowed to vote.
 * @returns Average, median, nearest deck card, and suggested value.
 */
export function suggestConsensus(
  votes: Vote[],
  deck: DeckConfig,
  algorithm: ConsensusAlgorithm,
  eligibleUserIds: Set<string>,
): ConsensusSuggestion {
  const eligible = votingVotesForConsensus(votes, eligibleUserIds);
  const nums = numericVoteValues(eligible);
  const avg = average(nums);
  const med = median(nums);

  const stat = algorithm === 'median_nearest' ? med : avg;
  const nearest = stat !== null ? nearestDeckCard(deck, stat) : null;

  let suggestedValue = '?';
  if (algorithm === 'manual') {
    suggestedValue = nearest ?? String(avg ?? '?');
  } else {
    suggestedValue = nearest ?? (stat !== null ? String(stat) : '?');
  }

  return {
    average: avg,
    median: med,
    nearestCard: nearest,
    suggestedValue,
  };
}
