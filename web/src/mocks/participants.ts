import type { User, Vote } from '@/types/planning';

export const MOCK_PARTICIPANTS: User[] = [
  { id: 'usr-1', displayName: 'Ana Silva', isFacilitator: true, isOnline: true },
  { id: 'usr-2', displayName: 'Bruno Costa', isFacilitator: false, isOnline: true },
  { id: 'usr-3', displayName: 'Carla Mendes', isFacilitator: false, isOnline: true },
  { id: 'usr-4', displayName: 'Diego Alves', isFacilitator: false, isOnline: true },
  { id: 'usr-5', displayName: 'Elena Rocha', isFacilitator: false, isOnline: false },
];

export const MOCK_VOTES_HIDDEN: Vote[] = [
  { userId: 'usr-1', value: '8', revealed: false },
  { userId: 'usr-2', value: '5', revealed: false },
  { userId: 'usr-3', value: '8', revealed: false },
  { userId: 'usr-4', value: '13', revealed: false },
];

export const MOCK_VOTES_REVEALED: Vote[] = [
  { userId: 'usr-1', value: '8', revealed: true },
  { userId: 'usr-2', value: '5', revealed: true },
  { userId: 'usr-3', value: '8', revealed: true },
  { userId: 'usr-4', value: '13', revealed: true },
];
