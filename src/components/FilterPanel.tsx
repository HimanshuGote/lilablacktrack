import { useDataStore } from '@/store/useDataStore';
import { ALL_EVENTS, EVENT_COLORS } from '@/lib/types';
import type { EventType } from '@/lib/types';
import { MAP_CONFIGS } from '@/lib/mapConfig';
import { Map, Calendar, Crosshair, Users, Eye, Layers } from 'lucide-react';

export function FilterPanel() {
  const {
    filters, setFilter, viewMode, setViewMode,
    heatmapMode, setHeatmapMode,
    availableMaps, availableDates, availableMatches,
    events,
  } = useDataStore();

  const maps = availableMaps();
  const dates = availableDates();
  const matches = availableMatches();

  const stats = {
    total: events.length,
    humans: events.filter((e) => !e.isBot).length,
    bots: events.filter((e) => e.isBot).length,
    matches: new Set(events.map((e) => e.match_id)).size,
  };

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto bg-card border-r border-border">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Events" value={stats.total.toLocaleString()} />
        <StatCard label="Matches" value={stats.matches.toLocaleString()} />
        <StatCard label="Humans" value={stats.humans.toLocaleString()} />
        <StatCard label="Bots" value={stats.bots.toLocaleString()} />
      </div>

      {/* View Mode */}
      <Section icon={<Eye className="w-4 h-4" />} label="View Mode">
        <div className="flex gap-1">
          {(['events', 'journeys', 'heatmap'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`flex-1 px-2 py-1.5 rounded text-xs font-medium capitalize transition-colors
                ${viewMode === m
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
            >
              {m}
            </button>
          ))}
        </div>
      </Section>

      {/* Heatmap Mode */}
      {viewMode === 'heatmap' && (
        <Section icon={<Layers className="w-4 h-4" />} label="Heatmap Layer">
          <div className="flex flex-col gap-1">
            {(['kills', 'deaths', 'traffic'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setHeatmapMode(m)}
                className={`px-3 py-1.5 rounded text-xs font-medium capitalize text-left transition-colors
                  ${heatmapMode === m
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
              >
                {m === 'kills' ? '🔴 Kill Zones' : m === 'deaths' ? '💀 Death Zones' : '🟢 Traffic'}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Map */}
      <Section icon={<Map className="w-4 h-4" />} label="Map">
        <div className="flex flex-col gap-1">
          {maps.map((m) => (
            <button
              key={m}
              onClick={() => setFilter('map', filters.map === m ? '' : m)}
              className={`px-3 py-1.5 rounded text-xs font-medium text-left transition-colors
                ${filters.map === m
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
            >
              {MAP_CONFIGS[m]?.name || m}
            </button>
          ))}
        </div>
      </Section>

      {/* Date */}
      <Section icon={<Calendar className="w-4 h-4" />} label="Date">
        <div className="flex flex-col gap-1">
          {dates.map((d) => (
            <button
              key={d}
              onClick={() => {
                const newDates = filters.dates.includes(d)
                  ? filters.dates.filter((x) => x !== d)
                  : [...filters.dates, d];
                setFilter('dates', newDates);
              }}
              className={`px-3 py-1.5 rounded text-xs font-medium text-left transition-colors
                ${filters.dates.includes(d)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
            >
              {d.replace('_', ' ')}
            </button>
          ))}
        </div>
      </Section>

      {/* Player Type */}
      <Section icon={<Users className="w-4 h-4" />} label="Players">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('showHumans', !filters.showHumans)}
            className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors
              ${filters.showHumans
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
              }`}
          >
            👤 Humans
          </button>
          <button
            onClick={() => setFilter('showBots', !filters.showBots)}
            className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors
              ${filters.showBots
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
              }`}
          >
            🤖 Bots
          </button>
        </div>
      </Section>

      {/* Event Types */}
      <Section icon={<Crosshair className="w-4 h-4" />} label="Events">
        <div className="flex flex-col gap-1">
          {ALL_EVENTS.map((evt) => {
            const active = filters.eventTypes.includes(evt);
            return (
              <button
                key={evt}
                onClick={() => {
                  const newTypes = active
                    ? filters.eventTypes.filter((t) => t !== evt)
                    : [...filters.eventTypes, evt as EventType];
                  setFilter('eventTypes', newTypes);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium text-left transition-colors
                  ${active
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground/50'
                  }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: active ? EVENT_COLORS[evt] : 'transparent',
                    border: `2px solid ${EVENT_COLORS[evt]}`,
                  }}
                />
                {evt}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Match selector */}
      <Section icon={<Crosshair className="w-4 h-4" />} label="Match">
        <select
          value={filters.selectedMatch || ''}
          onChange={(e) => setFilter('selectedMatch', e.target.value || null)}
          className="w-full bg-muted text-foreground rounded px-2 py-1.5 text-xs border-none outline-none"
        >
          <option value="">All matches</option>
          {matches.slice(0, 100).map((m) => (
            <option key={m} value={m}>
              {m.slice(0, 12)}...
            </option>
          ))}
        </select>
      </Section>
    </div>
  );
}

function Section({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted rounded-lg p-2 text-center">
      <div className="text-lg font-bold text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}
