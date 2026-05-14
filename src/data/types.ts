export enum MoldState {
  Empty             = 'empty',
  Pouring           = 'pouring',
  WaitingForFilling = 'waiting_for_filling',
  Baking            = 'baking',
  Flipped           = 'flipped',
  Done              = 'done',
  Serving           = 'serving',
  Burnt             = 'burnt',
  Cleaning          = 'cleaning',
}

export const MOLD_TRANSITIONS: Record<MoldState, MoldState[]> = {
  [MoldState.Empty]:             [MoldState.Pouring],
  [MoldState.Pouring]:           [MoldState.WaitingForFilling],
  [MoldState.WaitingForFilling]: [MoldState.Baking, MoldState.Burnt],
  [MoldState.Baking]:            [MoldState.Flipped, MoldState.Burnt],
  [MoldState.Flipped]:           [MoldState.Done, MoldState.Burnt],
  [MoldState.Done]:              [MoldState.Serving],
  [MoldState.Serving]:           [MoldState.Empty],
  [MoldState.Burnt]:             [MoldState.Cleaning],
  [MoldState.Cleaning]:          [MoldState.Empty],
};

export function canTransition(from: MoldState, to: MoldState): boolean {
  return MOLD_TRANSITIONS[from].includes(to);
}

export type BakingQuality = 'PERFECT' | 'GOOD' | 'UNDER' | 'BURNT';
export type CustomerType   = 'normal' | 'worker' | 'family' | 'vip';
export type AudioKey       = 'flip' | 'perfect' | 'burnt' | 'customer_happy' | 'customer_angry';

export interface DayStats {
  version: 'v1';
  dayNumber: number;
  gold: number;
  shopLevel: number;
  stock: Record<string, number>;
  totalSold: number;
  revenue: number;
  wastedCount: number;
  unsatisfiedCount: number;
  satisfiedCount: number;
  savedAt?: number;
}
