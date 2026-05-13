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
}

export const CUSTOMER_DEFS: Record<CustomerType, CustomerDef> = {
  normal: {
    type: 'normal',
    name: '일반 손님',
    patience: 60_000,
    tipRate: 0,
    reputationOnFail: 1,
    color: 0x4ecdc4,
    availableMenus: ['red_bean'],
  },
  worker: {
    type: 'worker',
    name: '직장인',
    patience: 30_000,
    tipRate: 0,
    reputationOnFail: 1,
    color: 0x45b7d1,
    availableMenus: ['red_bean', 'cream_cheese'],
  },
  family: {
    type: 'family',
    name: '가족 손님',
    patience: 90_000,
    tipRate: 0.10,
    reputationOnFail: 1,
    color: 0xf7dc6f,
    availableMenus: ['red_bean', 'cream_cheese', 'choux'],
  },
  vip: {
    type: 'vip',
    name: 'VIP',
    patience: Infinity,
    tipRate: 0,
    reputationOnFail: 0,
    color: 0xf39c12,
    availableMenus: ['red_bean', 'cream_cheese', 'choux'],
  },
};

export const CUSTOMER_SPAWN_WEIGHTS: Record<CustomerType, number> = {
  normal:  50,
  worker:  30,
  family:  15,
  vip:      5,
};

export function pickRandomCustomerType(): CustomerType {
  const total = Object.values(CUSTOMER_SPAWN_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [type, weight] of Object.entries(CUSTOMER_SPAWN_WEIGHTS) as [CustomerType, number][]) {
    roll -= weight;
    if (roll <= 0) return type;
  }
  return 'normal';
}
