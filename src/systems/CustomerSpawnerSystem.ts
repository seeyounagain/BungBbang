import { SPAWN_INTERVAL_MS, MAX_QUEUE_SIZE } from '../data/balance';
import { pickRandomCustomerType, CUSTOMER_DEFS } from '../data/customers';
import { MENU_DEFS } from '../data/menu';
import type { MenuItem } from '../data/menu';
import type { EconomySystem } from './EconomySystem';

export interface SpawnedCustomer {
  id: string;
  type: import('../data/types').CustomerType;
  order: MenuItem;
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
    const now = Date.now();
    const interval = SPAWN_INTERVAL_MS[shopLevel];
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

  spawnCustomer(shopLevel: number): SpawnedCustomer {
    const type = pickRandomCustomerType();
    const def = CUSTOMER_DEFS[type];

    // Filter available menus by shop level
    const available = def.availableMenus.filter(m => MENU_DEFS[m].unlockLevel <= shopLevel);
    const order = available[Math.floor(Math.random() * available.length)] ?? 'red_bean';

    const c: SpawnedCustomer = {
      id: `c${++this.idCounter}`,
      type,
      order,
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

  serveCustomer(customerId: string, item: MenuItem): SpawnedCustomer | null {
    const c = this.queue.find(x => x.id === customerId);
    if (!c || c.order !== item) return null;
    this.removeCustomer(customerId);
    return c;
  }

  removeCustomer(id: string): void {
    this.queue = this.queue.filter(c => c.id !== id);
  }

  clearQueueNoPenalty(): void {
    this.queue = [];
  }
}
