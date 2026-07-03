export const MOCK_PARTICIPANTS = [
  { id: 'usr-1', displayName: 'Ana Silva', isFacilitator: true, canVote: false, isOnline: true },
  { id: 'usr-2', displayName: 'Bruno Costa', isFacilitator: false, canVote: true, isOnline: true },
  { id: 'usr-3', displayName: 'Carla Mendes', isFacilitator: false, canVote: true, isOnline: true },
  { id: 'usr-4', displayName: 'Diego Alves', isFacilitator: false, canVote: true, isOnline: true },
  { id: 'usr-5', displayName: 'Elena Rocha', isFacilitator: false, canVote: false, isOnline: false },
];

/** Votes without values revealed — excludes non-voters (Croupier) */
export const MOCK_VOTES_HIDDEN = MOCK_PARTICIPANTS.filter((p) => p.canVote).map((p) => ({
  userId: p.id,
  value: '',
  revealed: false,
}));

export const MOCK_VOTES_REVEALED = [
  { userId: 'usr-2', value: '5', revealed: true },
  { userId: 'usr-3', value: '8', revealed: true },
  { userId: 'usr-4', value: '5', revealed: true },
];
