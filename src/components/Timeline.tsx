import { useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, FastForward } from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';

export function Timeline() {
  const {
    timelineProgress, setTimelineProgress,
    isPlaying, setIsPlaying,
    playbackSpeed, setPlaybackSpeed,
    timeFilteredEvents, filteredEvents,
  } = useDataStore();

  const animRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const totalEvents = filteredEvents().length;
  const visibleEvents = timeFilteredEvents().length;

  const animate = useCallback(
    (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      const speed = playbackSpeed;
      const increment = (delta / 30000) * speed; // ~30s full playthrough at 1x
      setTimelineProgress(Math.min(timelineProgress + increment, 1));

      if (timelineProgress >= 1) {
        setIsPlaying(false);
        return;
      }
      animRef.current = requestAnimationFrame(animate);
    },
    [timelineProgress, playbackSpeed, setTimelineProgress, setIsPlaying]
  );

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = 0;
      animRef.current = requestAnimationFrame(animate);
    } else {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, animate]);

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-card border-t border-border">
      <button
        onClick={() => {
          setTimelineProgress(0);
          setIsPlaying(false);
        }}
        className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      >
        <SkipBack className="w-4 h-4" />
      </button>

      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="p-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>

      <input
        type="range"
        min="0"
        max="1"
        step="0.001"
        value={timelineProgress}
        onChange={(e) => setTimelineProgress(Number(e.target.value))}
        className="flex-1 h-1.5 accent-primary cursor-pointer"
      />

      <div className="flex items-center gap-2">
        <button
          onClick={() =>
            setPlaybackSpeed(playbackSpeed >= 8 ? 0.5 : playbackSpeed * 2)
          }
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-bold
                     bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <FastForward className="w-3 h-3" />
          {playbackSpeed}x
        </button>
      </div>

      <div className="text-xs text-muted-foreground font-mono min-w-[80px] text-right">
        {visibleEvents.toLocaleString()} / {totalEvents.toLocaleString()}
      </div>
    </div>
  );
}
