import { EVENT_COLORS } from '@/lib/types';

const LEGEND_ITEMS = [
  { event: 'Kill', label: 'Player Kill', icon: '💀' },
  { event: 'Killed', label: 'Player Death', icon: '☠️' },
  { event: 'BotKill', label: 'Bot Kill', icon: '🤖💀' },
  { event: 'BotKilled', label: 'Killed by Bot', icon: '🤖☠️' },
  { event: 'KilledByStorm', label: 'Storm Death', icon: '⚡' },
  { event: 'Loot', label: 'Item Pickup', icon: '📦' },
];

export function Legend() {
  return (
    <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
      <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-2">
        Legend
      </div>
      <div className="flex flex-col gap-1">
        {LEGEND_ITEMS.map(({ event, label, icon }) => (
          <div key={event} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: EVENT_COLORS[event] }}
            />
            <span>{icon}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
