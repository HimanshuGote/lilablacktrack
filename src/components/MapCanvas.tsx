import { useEffect, useRef, useCallback, useState } from 'react';
import { MAP_CONFIGS, worldToPixel } from '@/lib/mapConfig';
import { useDataStore } from '@/store/useDataStore';
import { EVENT_COLORS } from '@/lib/types';
import type { GameEvent } from '@/lib/types';

export function MapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState(800);
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; event: GameEvent;
  } | null>(null);

  const {
    filters, viewMode, heatmapMode, timeFilteredEvents,
  } = useDataStore();

  const mapId = filters.map;
  const config = mapId ? MAP_CONFIGS[mapId] : null;

  // Load map image
  useEffect(() => {
    if (!config) return;
    setImageLoaded(false);
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.src = config.imageUrl;
  }, [config]);

  // Resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setCanvasSize(Math.min(width, height, 1024));
    });
    obs.observe(container);
    return () => obs.disconnect();
  }, []);

  // Draw
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !config || !imageRef.current) return;

    const size = canvasSize;
    canvas.width = size;
    canvas.height = size;
    const scale = size / config.imageSize;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, size, size);

    // Draw map
    ctx.drawImage(imageRef.current, 0, 0, size, size);

    const events = timeFilteredEvents();
    if (events.length === 0) return;

    if (heatmapMode !== 'none' && viewMode === 'heatmap') {
      drawHeatmap(ctx, events, config, scale, size);
      return;
    }

    if (viewMode === 'journeys') {
      drawJourneys(ctx, events, config, scale);
      return;
    }

    // Draw events
    for (const event of events) {
      if (event.event === 'Position' || event.event === 'BotPosition') continue;
      const { px, py } = worldToPixel(event.x, event.z, config);
      const sx = px * scale;
      const sy = py * scale;
      const color = EVENT_COLORS[event.event] || '#ffffff';
      const radius = event.isBot ? 3 : 5;

      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [canvasSize, config, timeFilteredEvents, viewMode, heatmapMode]);

  useEffect(() => {
    if (imageLoaded) draw();
  }, [imageLoaded, draw]);

  // Mouse hover for tooltips
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!config || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const scale = canvasSize / config.imageSize;

      const events = timeFilteredEvents();
      let closest: GameEvent | null = null;
      let closestDist = 15; // pixel threshold

      for (const event of events) {
        if (event.event === 'Position' || event.event === 'BotPosition') continue;
        const { px, py } = worldToPixel(event.x, event.z, config);
        const sx = px * scale;
        const sy = py * scale;
        const dist = Math.hypot(sx - mx, sy - my);
        if (dist < closestDist) {
          closestDist = dist;
          closest = event;
        }
      }

      if (closest) {
        setTooltip({ x: e.clientX, y: e.clientY, event: closest });
      } else {
        setTooltip(null);
      }
    },
    [config, canvasSize, timeFilteredEvents]
  );

  if (!mapId || !config) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-lg">Select a map to begin</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        className="rounded-lg shadow-2xl"
        style={{ width: canvasSize, height: canvasSize, imageRendering: 'auto' }}
      />
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-card border border-border rounded-lg shadow-xl px-3 py-2 text-xs"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <div className="font-bold text-foreground">{tooltip.event.event}</div>
          <div className="text-muted-foreground">
            {tooltip.event.isBot ? '🤖 Bot' : '👤 Human'}: {tooltip.event.user_id.slice(0, 8)}
          </div>
          <div className="text-muted-foreground">
            Match: {tooltip.event.match_id.slice(0, 8)}...
          </div>
          <div className="text-muted-foreground">
            Pos: ({tooltip.event.x.toFixed(0)}, {tooltip.event.z.toFixed(0)})
          </div>
        </div>
      )}
    </div>
  );
}

function drawJourneys(
  ctx: CanvasRenderingContext2D,
  events: GameEvent[],
  config: NonNullable<ReturnType<typeof getConfig>>,
  scale: number
) {
  // Group by user_id + match_id
  const journeys = new Map<string, GameEvent[]>();
  for (const e of events) {
    const key = `${e.user_id}_${e.match_id}`;
    if (!journeys.has(key)) journeys.set(key, []);
    journeys.get(key)!.push(e);
  }

  // Assign colors per journey
  const hueStep = 360 / Math.max(journeys.size, 1);
  let hue = 0;
  for (const [, journey] of journeys) {
    journey.sort((a, b) => a.ts - b.ts);
    const isBot = journey[0]?.isBot;
    const color = isBot
      ? `hsla(0, 0%, 50%, 0.3)`
      : `hsla(${hue}, 70%, 60%, 0.7)`;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = isBot ? 1 : 2;

    let started = false;
    for (const e of journey) {
      const { px, py } = worldToPixel(e.x, e.z, config);
      const sx = px * scale;
      const sy = py * scale;
      if (!started) {
        ctx.moveTo(sx, sy);
        started = true;
      } else {
        ctx.lineTo(sx, sy);
      }
    }
    ctx.stroke();

    // Draw event markers on journey
    for (const e of journey) {
      if (e.event === 'Position' || e.event === 'BotPosition') continue;
      const { px, py } = worldToPixel(e.x, e.z, config);
      const sx = px * scale;
      const sy = py * scale;
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fillStyle = EVENT_COLORS[e.event] || '#fff';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (!isBot) hue += hueStep;
  }
}

function drawHeatmap(
  ctx: CanvasRenderingContext2D,
  events: GameEvent[],
  config: NonNullable<ReturnType<typeof getConfig>>,
  scale: number,
  size: number
) {
  const { heatmapMode } = useDataStore.getState();

  const relevantEvents = events.filter((e) => {
    switch (heatmapMode) {
      case 'kills': return e.event === 'Kill' || e.event === 'BotKill';
      case 'deaths': return e.event === 'Killed' || e.event === 'BotKilled' || e.event === 'KilledByStorm';
      case 'traffic': return e.event === 'Position' || e.event === 'BotPosition';
      default: return false;
    }
  });

  if (relevantEvents.length === 0) return;

  // Create heatmap grid
  const gridSize = 64;
  const cellSize = size / gridSize;
  const grid = new Float32Array(gridSize * gridSize);

  for (const e of relevantEvents) {
    const { px, py } = worldToPixel(e.x, e.z, config);
    const gx = Math.floor((px * scale) / cellSize);
    const gy = Math.floor((py * scale) / cellSize);
    if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) {
      grid[gy * gridSize + gx]++;
    }
  }

  // Find max
  let maxVal = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] > maxVal) maxVal = grid[i];
  }
  if (maxVal === 0) return;

  // Draw heatmap with gaussian blur effect
  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      const val = grid[gy * gridSize + gx];
      if (val === 0) continue;
      const intensity = val / maxVal;
      const alpha = Math.min(intensity * 0.8, 0.8);

      let r: number, g: number, b: number;
      if (heatmapMode === 'kills') {
        r = 255; g = Math.floor(255 * (1 - intensity)); b = 0;
      } else if (heatmapMode === 'deaths') {
        r = 255; g = Math.floor(100 * (1 - intensity)); b = Math.floor(255 * intensity);
      } else {
        r = 0; g = Math.floor(255 * intensity); b = Math.floor(200 * (1 - intensity));
      }

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;

      // Draw with radial gradient for smoothness
      const cx = gx * cellSize + cellSize / 2;
      const cy = gy * cellSize + cellSize / 2;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, cellSize * 1.5);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(cx - cellSize * 1.5, cy - cellSize * 1.5, cellSize * 3, cellSize * 3);
    }
  }
}

function getConfig() {
  return null as any; // type helper
}
