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

function matchesTextSearch(card: RawBusinessmapCard, text: string): boolean {
  const q = text.trim().toLowerCase();
  if (!q) return true;
  if (card.title.toLowerCase().includes(q)) return true;
  if (card.custom_id?.toLowerCase().includes(q)) return true;
  return false;
}

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

export function filterCards(cards: RawBusinessmapCard[], query: CardQuery): RawBusinessmapCard[] {
  return cards.filter(
    (card) => matchesTextSearch(card, query.textSearch) && matchesTagFilter(card, query.tagFilter),
  );
}
