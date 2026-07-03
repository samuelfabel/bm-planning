export interface BusinessmapBoard {
  boardId: number;
  name: string;
}

export interface BusinessmapColumn {
  columnId: number;
  name: string;
  section: number;
}

export interface BusinessmapLane {
  laneId: number;
  name: string;
}

export interface BusinessmapCustomField {
  fieldId: number;
  name: string;
  type: string;
  allowedValues?: { valueId: number; value: string }[];
}

export interface BusinessmapCard {
  cardId: number;
  customId?: string;
  title: string;
  description?: string;
  boardId: number;
  columnId: number;
  laneId: number;
  color: string;
  tags?: string[];
}

export interface CardQuery {
  boardId: number | null;
  columnIds: number[];
  laneIds: number[];
  textSearch: string;
  tagFilter: string;
}

/** Alias used by useBusinessmapProxy */
export type CardSearchRequest = CardQuery;
