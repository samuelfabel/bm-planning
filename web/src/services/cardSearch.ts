import type { CardQuery } from '@/types/businessmap';

export interface RawBusinessmapCard {
  card_id: number;
  custom_id?: string;
  title: string;
  description?: string;
  board_id: number;
  column_id: number;
  lane_id: number;
  color?: string;
  tags?: { tag_id: number; name: string }[];
}

/** Return true when the card matches the free-text search query.
 *
 * @param card - Raw Businessmap card from the API.
 * @param text - User text search; empty matches all cards.
 * @returns True when title or custom_id contains the query.
 */
function matchesTextSearch(card: RawBusinessmapCard, text: string): boolean {
  const q = text.trim().toLowerCase();
  if (!q) return true;
  if (card.title.toLowerCase().includes(q)) return true;
  if (card.custom_id?.toLowerCase().includes(q)) return true;
  return false;
}

/** Return true when the card has at least one tag matching the filter.
 *
 * @param card - Raw Businessmap card from the API.
 * @param tagFilter - Comma-separated tag substrings; empty matches all cards.
 * @returns True when any tag name contains a filter needle.
 */
function matchesTagFilter(card: RawBusinessmapCard, tagFilter: string): boolean {
  const filter = tagFilter.trim();
  if (!filter) return true;

  const needles = filter
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  if (!needles.length) return true;

  return needles.some((needle) =>
    (card.tags ?? []).some((tag) => tag.name.toLowerCase().includes(needle)),
  );
}

/** Apply text and tag filters to raw Businessmap search results.
 *
 * @param cards - Raw cards from the Businessmap API.
 * @param query - Client-side filter criteria.
 * @returns Cards matching all active filters.
 */
export function filterCards(cards: RawBusinessmapCard[], query: CardQuery): RawBusinessmapCard[] {
  return cards.filter(
    (card) => matchesTextSearch(card, query.textSearch) && matchesTagFilter(card, query.tagFilter),
  );
}
