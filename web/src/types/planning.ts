export type DeckType = 'fibonacci' | 'sequential' | 'tshirt' | 'custom';

export type FacilitatorRole = 'croupier' | 'participant';

/** Demo preview persona — maps to mock users usr-1 (facilitator) or usr-2 (voter) */
export type DemoPersona = FacilitatorRole;

export type EstimationTargetKind = 'custom_field' | 'native_size';

export type ConsensusAlgorithm = 'average_nearest' | 'median_nearest' | 'manual';

export type SyncValueSource = 'nearest_card' | 'raw_average';

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

export interface EstimationTarget {
  kind: EstimationTargetKind;
  customFieldMapping?: CustomFieldMapping | null;
}

export interface DeckConfig {
  type: DeckType;
  values: string[];
  allowPass: boolean;
  allowBreak: boolean;
}

export interface WorkspaceConfig {
  subdomain: string;
  customFieldMapping: CustomFieldMapping | null;
  estimationTarget: EstimationTarget;
  /** Data URL — company logo for header branding (browser session only) */
  companyLogoUrl?: string | null;
  /** Facilitator may edit the active card description in the voting room */
  allowDescriptionEdit: boolean;
  /** Show subtasks from Businessmap on the active card */
  showSubtasks: boolean;
  /** Facilitator may add and manage subtasks during planning */
  allowSubtasks: boolean;
}

/** Personal credentials and session identity — not shared workspace settings */
export interface UserProfile {
  apiKey: string;
  displayName: string;
  facilitatorRole: FacilitatorRole;
  /** Personal night mode — applies across the app in this browser */
  nightMode: boolean;
}

/** @deprecated Use WorkspaceConfig + UserProfile */
export interface PlanningConfig extends WorkspaceConfig, UserProfile {
  facilitatorDisplayName: string;
}

export interface SessionSettings {
  deck: DeckConfig;
  consensusAlgorithm: ConsensusAlgorithm;
  syncValueSource: SyncValueSource;
}

export type RoomStatus = 'waiting' | 'voting' | 'revealed' | 'consensus' | 'closed';

export interface User {
  id: string;
  displayName: string;
  isFacilitator: boolean;
  canVote: boolean;
  isOnline: boolean;
}

export interface Vote {
  userId: string;
  value: string;
  revealed: boolean;
}

export interface CardSubtask {
  id: string;
  title: string;
  done: boolean;
}

export interface QueuedCard {
  cardId: number;
  customId?: string;
  title: string;
  description?: string;
  subtasks?: CardSubtask[];
  color: string;
  position: number;
  estimated?: string;
  /** Facilitator-only: hidden from participant voting queue */
  excludedFromVoting?: boolean;
}

export interface PlanningSession {
  id: string;
  name: string;
  status: RoomStatus;
  settings: SessionSettings;
  isDemo?: boolean;
  queue: QueuedCard[];
  currentCardIdx: number;
  participants: User[];
  votes: Vote[];
  votesRevealed: boolean;
}

export function demoUserIdForPersona(persona: DemoPersona): string {
  return persona === 'croupier' ? 'usr-1' : 'usr-2';
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export function facilitatorCanVote(role: FacilitatorRole): boolean {
  return role === 'participant';
}

/** True when the card appears in the participant voting queue. */
export function isInVotingQueue(card: QueuedCard): boolean {
  return !card.excludedFromVoting;
}

export function filterVotingQueue(queue: QueuedCard[]): QueuedCard[] {
  return queue.filter(isInVotingQueue);
}

/** True when the session can persist estimates (custom field selected or native size). */
export function isEstimationTargetReady(workspace: WorkspaceConfig | null): boolean {
  if (!workspace) return false;
  if (workspace.estimationTarget.kind === 'native_size') return true;
  return Boolean(workspace.customFieldMapping?.fieldId);
}
