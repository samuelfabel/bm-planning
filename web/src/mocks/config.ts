import type { BusinessmapBoard, BusinessmapColumn, BusinessmapLane, BusinessmapCustomField } from '@/types/businessmap';
import type { SessionSettings } from '@/types/planning';

export const MOCK_BOARDS: BusinessmapBoard[] = [
  { boardId: 10, name: 'Squad Alpha — Delivery' },
  { boardId: 11, name: 'Squad Beta — Platform' },
  { boardId: 12, name: 'Product — Roadmap' },
];

export const MOCK_COLUMNS: Record<number, BusinessmapColumn[]> = {
  10: [
    { columnId: 101, name: 'Backlog', section: 1 },
    { columnId: 102, name: 'Refinement', section: 1 },
    { columnId: 103, name: 'Ready', section: 2 },
    { columnId: 104, name: 'In Progress', section: 3 },
    { columnId: 105, name: 'Done', section: 4 },
  ],
  11: [
    { columnId: 201, name: 'Backlog', section: 1 },
    { columnId: 202, name: 'Ready', section: 2 },
    { columnId: 203, name: 'In Progress', section: 3 },
  ],
  12: [
    { columnId: 301, name: 'Ideas', section: 1 },
    { columnId: 302, name: 'Prioritized', section: 2 },
  ],
};

export const MOCK_LANES: Record<number, BusinessmapLane[]> = {
  10: [
    { laneId: 1001, name: 'Team A' },
    { laneId: 1002, name: 'Team B' },
    { laneId: 1003, name: 'Bugs' },
  ],
  11: [
    { laneId: 2001, name: 'Infra' },
    { laneId: 2002, name: 'API' },
  ],
  12: [
    { laneId: 3001, name: 'Q3' },
    { laneId: 3002, name: 'Q4' },
  ],
};

export const MOCK_CUSTOM_FIELDS: BusinessmapCustomField[] = [
  { fieldId: 15, name: 'Story Points', type: 'number' },
  { fieldId: 16, name: 'Effort', type: 'dropdown', allowedValues: [
    { valueId: 1, value: 'P' },
    { valueId: 2, value: 'M' },
    { valueId: 3, value: 'G' },
    { valueId: 4, value: 'GG' },
  ]},
  { fieldId: 17, name: 'Risk', type: 'dropdown', allowedValues: [
    { valueId: 10, value: 'Low' },
    { valueId: 11, value: 'Medium' },
    { valueId: 12, value: 'High' },
  ]},
];

export const DECK_PRESETS: Record<string, string[]> = {
  fibonacci: ['0', '½', '1', '2', '3', '5', '8', '13', '21', '34', '?'],
  sequential: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '?'],
  tshirt: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?'],
  custom: ['1', '2', '3', '5', '8', '13', '?'],
};

export const DEFAULT_SESSION_SETTINGS: SessionSettings = {
  deck: {
    type: 'fibonacci',
    values: DECK_PRESETS.fibonacci,
    allowPass: true,
    allowBreak: false,
  },
  consensusAlgorithm: 'average_nearest',
  syncValueSource: 'nearest_card',
};
