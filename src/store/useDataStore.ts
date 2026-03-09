import { create } from 'zustand';
import type { GameEvent, Filters, HeatmapMode, ViewMode, EventType } from '@/lib/types';
import { ALL_EVENTS } from '@/lib/types';

interface DataStore {
  events: GameEvent[];
  loading: boolean;
  loadProgress: { loaded: number; total: number };
  filters: Filters;
  heatmapMode: HeatmapMode;
  viewMode: ViewMode;
  timelineProgress: number; // 0-1
  isPlaying: boolean;
  playbackSpeed: number;

  setEvents: (events: GameEvent[]) => void;
  setLoading: (loading: boolean) => void;
  setLoadProgress: (loaded: number, total: number) => void;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  setHeatmapMode: (mode: HeatmapMode) => void;
  setViewMode: (mode: ViewMode) => void;
  setTimelineProgress: (p: number) => void;
  setIsPlaying: (p: boolean) => void;
  setPlaybackSpeed: (s: number) => void;

  // Derived
  availableMaps: () => string[];
  availableDates: () => string[];
  availableMatches: () => string[];
  availablePlayers: () => string[];
  filteredEvents: () => GameEvent[];
  timeFilteredEvents: () => GameEvent[];
}

export const useDataStore = create<DataStore>((set, get) => ({
  events: [],
  loading: false,
  loadProgress: { loaded: 0, total: 0 },
  filters: {
    map: '',
    dates: [],
    eventTypes: ALL_EVENTS as EventType[],
    showHumans: true,
    showBots: true,
    selectedMatch: null,
    selectedPlayer: null,
  },
  heatmapMode: 'none',
  viewMode: 'events',
  timelineProgress: 1,
  isPlaying: false,
  playbackSpeed: 1,

  setEvents: (events) => set({ events }),
  setLoading: (loading) => set({ loading }),
  setLoadProgress: (loaded, total) => set({ loadProgress: { loaded, total } }),
  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),
  setHeatmapMode: (mode) => set({ heatmapMode: mode }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setTimelineProgress: (p) => set({ timelineProgress: p }),
  setIsPlaying: (p) => set({ isPlaying: p }),
  setPlaybackSpeed: (s) => set({ playbackSpeed: s }),

  availableMaps: () => {
    const maps = new Set(get().events.map((e) => e.map_id));
    return Array.from(maps).sort();
  },
  availableDates: () => {
    const dates = new Set(get().events.map((e) => e.dateFolder));
    return Array.from(dates).sort();
  },
  availableMatches: () => {
    const filtered = get().filteredEvents();
    const matches = new Set(filtered.map((e) => e.match_id));
    return Array.from(matches).sort();
  },
  availablePlayers: () => {
    const filtered = get().filteredEvents();
    const players = new Set(
      filtered.filter((e) => !e.isBot).map((e) => e.user_id)
    );
    return Array.from(players).sort();
  },
  filteredEvents: () => {
    const { events, filters } = get();
    return events.filter((e) => {
      if (filters.map && e.map_id !== filters.map) return false;
      if (filters.dates.length > 0 && !filters.dates.includes(e.dateFolder))
        return false;
      if (!filters.eventTypes.includes(e.event as EventType)) return false;
      if (!filters.showHumans && !e.isBot) return false;
      if (!filters.showBots && e.isBot) return false;
      if (filters.selectedMatch && e.match_id !== filters.selectedMatch) return false;
      if (filters.selectedPlayer && e.user_id !== filters.selectedPlayer) return false;
      return true;
    });
  },
  timeFilteredEvents: () => {
    const filtered = get().filteredEvents();
    const progress = get().timelineProgress;
    if (progress >= 1) return filtered;

    // Get min/max ts for the filtered set
    if (filtered.length === 0) return [];
    let minTs = Infinity, maxTs = -Infinity;
    for (const e of filtered) {
      if (e.ts < minTs) minTs = e.ts;
      if (e.ts > maxTs) maxTs = e.ts;
    }
    const cutoff = minTs + (maxTs - minTs) * progress;
    return filtered.filter((e) => e.ts <= cutoff);
  },
}));
