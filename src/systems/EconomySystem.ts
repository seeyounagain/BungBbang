import Phaser from 'phaser';
import { MENU_DEFS, type MenuItem } from '../data/menu';
import { INGREDIENT_DEFS, type IngredientType } from '../data/ingredients';
import { BAKING } from '../data/balance';
import type { BakingQuality } from '../data/types';
import type { CustomerDef } from '../data/customers';

export class EconomySystem {
  gold: number;
  stock: Record<IngredientType, number>;
  reputation: number;
  totalSold = 0;
  revenue = 0;
  wastedCount = 0;
  unsatisfiedCount = 0;
  satisfiedCount = 0;

  readonly events = new Phaser.Events.EventEmitter();

  constructor(gold = 200, stock?: Partial<Record<IngredientType, number>>) {
    this.gold = gold;
    this.reputation = 5;
    this.stock = {
      red_bean:     stock?.red_bean     ?? 40,
      cream_cheese: stock?.cream_cheese ?? 0,
      choux:        stock?.choux        ?? 0,
    };
  }

  sell(item: MenuItem, quality: BakingQuality, customerDef: CustomerDef): number {
    if (quality === 'BURNT') {
      this.wastedCount++;
      return 0;
    }
    const base   = MENU_DEFS[item].price;
    const mult   = BAKING.priceMultiplier[quality];
    const tip    = customerDef.tipRate > 0 ? Math.floor(base * customerDef.tipRate) : 0;
    const earned = Math.floor(base * mult) + tip;
    this.gold += earned;
    this.revenue += earned;
    this.totalSold++;
    this.satisfiedCount++;
    this.events.emit('gold-changed', this.gold);
    return earned;
  }

  buyIngredient(type: IngredientType): boolean {
    const def = INGREDIENT_DEFS[type];
    if (this.gold < def.pricePerBatch) return false;
    this.gold -= def.pricePerBatch;
    this.stock[type] = (this.stock[type] ?? 0) + def.batchSize;
    this.events.emit('gold-changed', this.gold);
    this.events.emit('stock-changed', type, this.stock[type]);
    return true;
  }

  consume(type: IngredientType): boolean {
    if ((this.stock[type] ?? 0) <= 0) return false;
    this.stock[type]--;
    if (this.stock[type] === 0) this.events.emit('ingredient-exhausted', type);
    this.events.emit('stock-changed', type, this.stock[type]);
    return true;
  }

  decreaseReputation(amount: number): void {
    this.reputation = Math.max(0, this.reputation - amount);
    this.unsatisfiedCount++;
    this.events.emit('reputation-changed', this.reputation);
  }

  resetDayStats(): void {
    this.totalSold = 0;
    this.revenue = 0;
    this.wastedCount = 0;
    this.unsatisfiedCount = 0;
    this.satisfiedCount = 0;
  }
}
