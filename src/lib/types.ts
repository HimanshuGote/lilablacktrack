export interface GameEvent {
  user_id: string;
  match_id: string;
  map_id: string;
  x: number;
  y: number;
  z: number;
  ts: number; // ms timestamp
  event: string;
  isBot: boolean;
  dateFolder: string; // e.g. "February_10"
}

export type EventType =
  | 'Position'
  | 'BotPosition'
  | 'Kill'
  | 'Killed'
  | 'BotKill'
  | 'BotKilled'
  | 'KilledByStorm'
  | 'Loot';

export const COMBAT_EVENTS: EventType[] = ['Kill', 'Killed', 'BotKill', 'BotKilled'];
export const ALL_EVENTS: EventType[] = [
  'Position', 'BotPosition', 'Kill', 'Killed',
  'BotKill', 'BotKilled', 'KilledByStorm', 'Loot',
];

export const EVENT_COLORS: Record<string, string> = {
  Position: '#4ade80',       // green
  BotPosition: '#6b7280',   // gray
  Kill: '#ef4444',           // red
  Killed: '#f97316',         // orange
  BotKill: '#a855f7',       // purple
  BotKilled: '#ec4899',     // pink
  KilledByStorm: '#06b6d4', // cyan
  Loot: '#eab308',          // yellow
};

export const EVENT_ICONS: Record<string, string> = {
  Kill: '💀',
  Killed: '☠️',
  BotKill: '🤖',
  BotKilled: '🤖',
  KilledByStorm: '⚡',
  Loot: '📦',
};

export interface Filters {
  map: string;
  dates: string[];
  eventTypes: EventType[];
  showHumans: boolean;
  showBots: boolean;
  selectedMatch: string | null;
  selectedPlayer: string | null;
}

export type HeatmapMode = 'none' | 'kills' | 'deaths' | 'traffic';

export type ViewMode = 'events' | 'journeys' | 'heatmap';
