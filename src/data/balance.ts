export const BAKING = {
  totalDuration: 12_000,
  flippedDoneAt: 0.75,
  flipZones: {
    under:      { min: 0.00, max: 0.70 } as const,
    good_early: { min: 0.70, max: 0.85 } as const,
    perfect:    { min: 0.85, max: 0.95 } as const,
    good_late:  { min: 0.95, max: 1.00 } as const,
  },
  priceMultiplier: { PERFECT: 1.2, GOOD: 1.0, UNDER: 0.7, BURNT: 0 } as const,
  colorTint: [
    { maxProgress: 0.30, tint: 0xFFFFFF },
    { maxProgress: 0.60, tint: 0xFFE066 },
    { maxProgress: 0.85, tint: 0xD4A017 },
    { maxProgress: 0.95, tint: 0x8B4513 },
    { maxProgress: 1.00, tint: 0x1a1a1a },
  ],
};

export const DAY = { durationMs: 5 * 60 * 1_000 };

export const UPGRADES = [
  { level: 1, name: '노점',      cost:     0, slots: 4 },
  { level: 2, name: '작은 가게', cost: 2_500, slots: 6 },
  { level: 3, name: '동네 맛집', cost: 8_000, slots: 8 },
] as const;

export const SPAWN_INTERVAL_MS: Record<1 | 2 | 3, number> = {
  1: 15_000,
  2: 10_000,
  3:  8_000,
};

export const MAX_QUEUE_SIZE = 5;
export const POURING_DURATION_MS = 500;
export const CLEANING_DURATION_MS = 300;
export const SERVING_DURATION_MS = 300;

export const SHELF = {
  initialCapacity: 2,
  maxCapacity: 6,
  upgradeCosts: [300, 600, 1_000, 1_500], // 3칸→4→5→6칸 잠금 해제 비용
} as const;
