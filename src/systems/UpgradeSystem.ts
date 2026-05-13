import Phaser from 'phaser';
import { UPGRADES } from '../data/balance';

export interface UpgradeResult {
  newLevel: number;
  newSlots: number;
}

export class UpgradeSystem {
  readonly events = new Phaser.Events.EventEmitter();

  canUpgrade(currentLevel: number, gold: number): boolean {
    const next = UPGRADES.find(u => u.level === currentLevel + 1);
    return !!next && gold >= next.cost;
  }

  getNextCost(currentLevel: number): number | null {
    const next = UPGRADES.find(u => u.level === currentLevel + 1);
    return next ? next.cost : null;
  }

  upgrade(currentLevel: number): UpgradeResult | null {
    const next = UPGRADES.find(u => u.level === currentLevel + 1);
    if (!next) return null;
    this.events.emit('shop-upgraded', { newLevel: next.level, slots: next.slots });
    return { newLevel: next.level, newSlots: next.slots };
  }

  getSlotsForLevel(level: number): number {
    return UPGRADES.find(u => u.level === level)?.slots ?? 4;
  }
}
