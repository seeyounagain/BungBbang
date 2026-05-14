import type { CustomerType } from './types';
import type { MenuItem } from './menu';

export interface CustomerDef {
  type: CustomerType;
  name: string;
  patience: number;
  tipRate: number;
  reputationOnFail: number;
  color: number;
  availableMenus: MenuItem[];
  quantityRange: Record<1 | 2 | 3, [number, number]>; // [min, max] per shop level
}

export const CUSTOMER_DEFS: Record<CustomerType, CustomerDef> = {
  normal: {
    type: 'normal',
    name: '일반 손님',
    patience: 70_000,
    tipRate: 0,
    reputationOnFail: 1,
    color: 0x4ecdc4,
    availableMenus: ['red_bean'],
    quantityRange: { 1: [1, 1], 2: [1, 1], 3: [1, 2] },
  },
  worker: {
    type: 'worker',
    name: '직장인',
    patience: 50_000,
    tipRate: 0,
    reputationOnFail: 1,
    color: 0x45b7d1,
    availableMenus: ['red_bean', 'cream_cheese'],
    quantityRange: { 1: [1, 1], 2: [1, 2], 3: [2, 2] },
  },
  family: {
    type: 'family',
    name: '가족 손님',
    patience: 120_000,
    tipRate: 0.10,
    reputationOnFail: 1,
    color: 0xf7dc6f,
    availableMenus: ['red_bean', 'cream_cheese', 'choux'],
    quantityRange: { 1: [2, 2], 2: [2, 3], 3: [3, 4] },
  },
  vip: {
    type: 'vip',
    name: 'VIP',
    patience: Infinity,
    tipRate: 0.20,
    reputationOnFail: 0,
    color: 0xf39c12,
    availableMenus: ['red_bean', 'cream_cheese', 'choux'],
    quantityRange: { 1: [3, 3], 2: [3, 3], 3: [3, 5] },
  },
};

// Level-based spawn weights — VIP only at Lv.3
export const CUSTOMER_SPAWN_WEIGHTS: Record<1 | 2 | 3, Record<CustomerType, number>> = {
  1: { normal: 65, worker: 30, family: 5,  vip:  0 },
  2: { normal: 50, worker: 35, family: 15, vip:  0 },
  3: { normal: 35, worker: 30, family: 25, vip: 10 },
};

export function pickRandomCustomerType(shopLevel: 1 | 2 | 3): CustomerType {
  const weights = CUSTOMER_SPAWN_WEIGHTS[shopLevel];
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [type, weight] of Object.entries(weights) as [CustomerType, number][]) {
    roll -= weight;
    if (roll <= 0) return type;
  }
  return 'normal';
}

export function pickQuantity(def: CustomerDef, shopLevel: 1 | 2 | 3): number {
  const [min, max] = def.quantityRange[shopLevel];
  return min + Math.floor(Math.random() * (max - min + 1));
}
