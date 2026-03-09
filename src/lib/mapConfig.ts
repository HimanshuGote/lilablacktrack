export interface MapConfig {
  name: string;
  scale: number;
  originX: number;
  originZ: number;
  imageUrl: string;
  imageSize: number;
}

export const MAP_CONFIGS: Record<string, MapConfig> = {
  AmbroseValley: {
    name: 'Ambrose Valley',
    scale: 900,
    originX: -370,
    originZ: -473,
    imageUrl: '/maps/AmbroseValley_Minimap.png',
    imageSize: 1024,
  },
  GrandRift: {
    name: 'Grand Rift',
    scale: 581,
    originX: -290,
    originZ: -290,
    imageUrl: '/maps/GrandRift_Minimap.png',
    imageSize: 1024,
  },
  Lockdown: {
    name: 'Lockdown',
    scale: 1000,
    originX: -500,
    originZ: -500,
    imageUrl: '/maps/Lockdown_Minimap.jpg',
    imageSize: 1024,
  },
};

export function worldToPixel(
  worldX: number,
  worldZ: number,
  config: MapConfig
): { px: number; py: number } {
  const u = (worldX - config.originX) / config.scale;
  const v = (worldZ - config.originZ) / config.scale;
  return {
    px: u * config.imageSize,
    py: (1 - v) * config.imageSize,
  };
}
