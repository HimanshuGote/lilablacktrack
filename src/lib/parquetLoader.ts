import { parquetRead } from 'hyparquet';
import type { GameEvent } from './types';

function isBot(userId: string): boolean {
  // Bots have short numeric IDs, humans have UUIDs
  return /^\d+$/.test(userId);
}

function decodeEvent(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
    const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : value;
    return new TextDecoder().decode(bytes);
  }
  if (Array.isArray(value)) {
    return new TextDecoder().decode(new Uint8Array(value));
  }
  return String(value ?? 'Unknown');
}

function decodeTimestamp(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (value instanceof Date) return value.getTime();
  return 0;
}

export async function loadParquetFile(
  file: File,
  dateFolder: string
): Promise<GameEvent[]> {
  const arrayBuffer = await file.arrayBuffer();
  const events: GameEvent[] = [];

  await parquetRead({
    file: arrayBuffer,
    onComplete: (data: unknown[][]) => {
      for (const row of data) {
        const userId = String(row[0] ?? '');
        const matchId = String(row[1] ?? '');
        const mapId = String(row[2] ?? '');
        const x = Number(row[3] ?? 0);
        const y = Number(row[4] ?? 0);
        const z = Number(row[5] ?? 0);
        const ts = decodeTimestamp(row[6]);
        const event = decodeEvent(row[7]);

        events.push({
          user_id: userId,
          match_id: matchId,
          map_id: mapId,
          x, y, z, ts,
          event,
          isBot: isBot(userId),
          dateFolder,
        });
      }
    },
  });

  return events;
}

export async function loadMultipleFiles(
  files: FileList | File[],
  onProgress?: (loaded: number, total: number) => void
): Promise<GameEvent[]> {
  const allEvents: GameEvent[] = [];
  const fileArray = Array.from(files);
  const total = fileArray.length;

  // Process in batches
  const BATCH_SIZE = 20;
  for (let i = 0; i < fileArray.length; i += BATCH_SIZE) {
    const batch = fileArray.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map((file) => {
        // Try to extract date folder from webkitRelativePath
        const path = (file as any).webkitRelativePath || file.name;
        const parts = path.split('/');
        const dateFolder = parts.length > 1 ? parts[parts.length - 2] : 'Unknown';
        return loadParquetFile(file, dateFolder).catch(() => [] as GameEvent[]);
      })
    );
    for (const r of results) allEvents.push(...r);
    onProgress?.(Math.min(i + BATCH_SIZE, total), total);
  }

  return allEvents;
}
