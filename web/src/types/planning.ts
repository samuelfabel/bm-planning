export type DeckType = 'fibonacci' | 'sequential' | 'tshirt' | 'custom';

export interface DropdownOption {
  valueId: number;
  value: string;
}

export interface CustomFieldMapping {
  fieldId: number;
  fieldName: string;
  fieldType: 'number' | 'dropdown';
  allowedValues?: DropdownOption[];
}

export interface DeckConfig {
  type: DeckType;
  values: string[];
  allowPass: boolean;
  allowBreak: boolean;
}

export interface PlanningConfig {
  subdomain: string;
  apiKey: string;
  customFieldMapping: CustomFieldMapping | null;
  deck: DeckConfig;
  facilitatorDisplayName: string;
}

export type RoomStatus = 'waiting' | 'voting' | 'revealed' | 'consensus' | 'closed';

export interface User {
  id: string;
  displayName: string;
  isFacilitator: boolean;
  isOnline: boolean;
}

export interface Vote {
  userId: string;
  value: string;
  revealed: boolean;
}

export interface QueuedCard {
  cardId: number;
  customId?: string;
  title: string;
  description?: string;
  color: string;
  position: number;
  estimated?: string;
}

export interface PlanningSession {
  id: string;
  name: string;
  status: RoomStatus;
  queue: QueuedCard[];
  currentCardIdx: number;
  participants: User[];
  votes: Vote[];
  votesRevealed: boolean;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
