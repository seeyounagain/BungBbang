import { SPAWN_INTERVAL_MS, MAX_QUEUE_SIZE } from '../data/balance';
import { pickRandomCustomerType, pickQuantity, CUSTOMER_DEFS } from '../data/customers';
import { MENU_DEFS } from '../data/menu';
import type { MenuItem } from '../data/menu';
import type { EconomySystem } from './EconomySystem';

export interface SpawnedCustomer {
  id: string;
  type: import('../data/types').CustomerType;
  order: MenuItem;
  quantity: number;
  quantityServed: number;
  startedAt: number;
  def: (typeof CUSTOMER_DEFS)[keyof typeof CUSTOMER_DEFS];
}

export class CustomerSpawnerSystem {
  private queue: SpawnedCustomer[] = [];
  private lastSpawnAt = 0;
  private idCounter = 0;

  constructor(private economySystem: EconomySystem) {}

  get customers(): ReadonlyArray<SpawnedCustomer> {
    return this.queue;
  }

  update(shopLevel: 1 | 2 | 3): SpawnedCustomer[] {
    const now      = Date.now();
    const base     = SPAWN_INTERVAL_MS[shopLevel];
    const rep      = this.economySystem.reputation;
    const repMult  = rep >= 5 ? 0.75 : rep >= 4 ? 0.85 : rep >= 3 ? 1.0 : rep >= 2 ? 1.25 : 1.6;
    const interval = Math.round(base * repMult);
    const spawned: SpawnedCustomer[] = [];

    if (now - this.lastSpawnAt >= interval && this.queue.length < MAX_QUEUE_SIZE) {
      const c = this.spawnCustomer(shopLevel);
      spawned.push(c);
      this.lastSpawnAt = now;
    }

    const expired = this.queue.filter(c => this.isExpired(c));
    expired.forEach(c => {
      this.economySystem.decreaseReputation(c.def.reputationOnFail);
      this.removeCustomer(c.id);
    });

    return spawned;
  }

  spawnCustomer(shopLevel: 1 | 2 | 3): SpawnedCustomer {
    const type = pickRandomCustomerType(shopLevel);
    const def  = CUSTOMER_DEFS[type];

    const available = def.availableMenus.filter(m => MENU_DEFS[m].unlockLevel <= shopLevel);
    const order     = available[Math.floor(Math.random() * available.length)] ?? 'red_bean';
    const quantity  = pickQuantity(def, shopLevel);

    const c: SpawnedCustomer = {
      id: `c${++this.idCounter}`,
      type,
      order,
      quantity,
      quantityServed: 0,
      startedAt: Date.now(),
      def,
    };
    this.queue.push(c);
    return c;
  }

  isExpired(c: SpawnedCustomer): boolean {
    if (c.def.patience === Infinity) return false;
    return Date.now() - c.startedAt >= c.def.patience;
  }

  getRemainingMs(c: SpawnedCustomer): number {
    if (c.def.patience === Infinity) return Infinity;
    return Math.max(0, c.def.patience - (Date.now() - c.startedAt));
  }

  getPatienceRatio(c: SpawnedCustomer): number {
    if (c.def.patience === Infinity) return 1.0;
    return this.getRemainingMs(c) / c.def.patience;
  }

  /** Serve one bread to the customer. Returns the customer, or null if mismatch.
   *  Customer stays in queue until fully served (quantityServed === quantity). */
  serveCustomer(customerId: string, item: MenuItem): SpawnedCustomer | null {
    const c = this.queue.find(x => x.id === customerId);
    if (!c || c.order !== item) return null;
    c.quantityServed++;
    if (c.quantityServed >= c.quantity) {
      this.removeCustomer(customerId);
    }
    return c;
  }

  removeCustomer(id: string): void {
    this.queue = this.queue.filter(c => c.id !== id);
  }

  clearQueueNoPenalty(): void {
    this.queue = [];
  }
}
