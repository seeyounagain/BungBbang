import Phaser from 'phaser';
import { BungeaMold } from '../objects/BungeaMold';
import { CustomerUI } from '../objects/Customer';
import { EffectSystem } from '../objects/EffectSystem';
import { EconomySystem } from '../systems/EconomySystem';
import { CustomerSpawnerSystem } from '../systems/CustomerSpawnerSystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { AudioGateway } from '../systems/AudioGateway';
import { SaveSystem } from '../systems/storage/SaveSystem';
import { LocalStorageAdapter } from '../systems/storage/LocalStorageAdapter';
import { MoldState } from '../data/types';
import { UPGRADES, DAY, SHELF } from '../data/balance';
import type { BakingQuality } from '../data/types';
import type { DayStats } from '../data/types';
import { MENU_DEFS, type MenuItem } from '../data/menu';
import type { IngredientType } from '../data/ingredients';
import type { SpawnedCustomer } from '../systems/CustomerSpawnerSystem';
import type { AudioKey } from '../data/types';

const GAME_WIDTH  = 390;
const GAME_HEIGHT = 844;
const HUD_HEIGHT  = 58;
const BOTTOM_BAR  = 56;
const SHELF_Y     = 500;
const SHELF_SLOT_W = 52;
const SHELF_SLOT_H = 58;

export class GameScene extends Phaser.Scene {
  // Systems
  private economy!: EconomySystem;
  private spawner!: CustomerSpawnerSystem;
  private upgrader!: UpgradeSystem;
  private audio!: AudioGateway;
  private saveSystem!: SaveSystem;
  private effects!: EffectSystem;

  // State
  private molds: BungeaMold[] = [];
  private customerUIs: Map<string, CustomerUI> = new Map();
  private shopLevel: 1 | 2 | 3 = 1;
  private dayNumber = 1;
  private dayStartMs = 0;
  private dayEnded = false;

  // Filling panel
  private fillingPanel: Phaser.GameObjects.Container | null = null;
  private activeFillMold: BungeaMold | null = null;

  // Shelf
  private shelfCapacity: number = SHELF.initialCapacity;
  private shelfItems: ({ menu: MenuItem; quality: BakingQuality } | null)[] = [];
  private shelfSlotContainers: Phaser.GameObjects.Container[] = [];

  // Queue display
  private queueSlots: { x: number; y: number }[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { save?: DayStats }): void {
    if (data?.save) {
      const s = data.save;
      this.dayNumber     = s.dayNumber;
      this.shopLevel     = Math.min(3, Math.max(1, s.shopLevel)) as 1 | 2 | 3;
      this.shelfCapacity = Math.min(SHELF.maxCapacity, Math.max(SHELF.initialCapacity, s.shelfCapacity ?? SHELF.initialCapacity));
      this.economy       = new EconomySystem(s.gold, s.stock as Record<IngredientType, number>);
    } else {
      this.dayNumber     = 1;
      this.shopLevel     = 1;
      this.shelfCapacity = SHELF.initialCapacity;
      this.economy       = new EconomySystem(300);
    }
    this.shelfItems = new Array(SHELF.maxCapacity).fill(null);
  }

  create(): void {
    this.audio      = new AudioGateway();
    this.saveSystem = new SaveSystem(new LocalStorageAdapter());
    this.spawner    = new CustomerSpawnerSystem(this.economy);
    this.upgrader   = new UpgradeSystem();
    this.effects    = new EffectSystem(this);

    this.dayStartMs = Date.now();
    this.dayEnded   = false;

    this.buildBackground();
    this.buildQueueArea();
    this.buildMoldGrid();
    this.buildShelf();
    this.buildUpgradeButton();
    this.wireEconomyEvents();
    this.wireUpgradeEvents();
    this.wireInputEvents();

    // Launch UI overlay
    this.scene.launch('UIScene');

    // Emit initial state
    this.time.delayedCall(100, () => {
      this.events.emit('gold-init', this.economy.gold);
      this.events.emit('day-changed', this.dayNumber);
      this.events.emit('reputation-changed', this.economy.reputation);
      this.events.emit('shop-level-changed', this.shopLevel);
      for (const [type, amt] of Object.entries(this.economy.stock)) {
        this.events.emit('stock-changed', type as IngredientType, amt);
      }
    });

    // Unlock audio on first interaction
    this.input.once('pointerdown', () => this.audio.unlock());
  }

  update(): void {
    if (this.dayEnded) return;

    const elapsed   = Date.now() - this.dayStartMs;
    const remaining = DAY.durationMs - elapsed;

    if (remaining <= 0) {
      this.endDay();
      return;
    }

    this.events.emit('timer-update', remaining / DAY.durationMs);
    this.updateCustomerSpawning();
    this.updateCustomerUIs();
    this.checkUpgradeAvailability();
  }

  // ─── Background ──────────────────────────────────────────────────────────

  private buildBackground(): void {
    // Dark base
    const bg = this.add.graphics();
    bg.fillStyle(0x2a1f1a, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Shop building for current level, fills game width
    const displayH = 280;
    const buildingY = GAME_HEIGHT - BOTTOM_BAR - displayH / 2 + 20;
    const shopBg = this.add.image(GAME_WIDTH / 2, buildingY, `shop-lv${this.shopLevel}`);
    shopBg.setDisplaySize(GAME_WIDTH, displayH);
    shopBg.setDepth(-1);

    // Shop name label
    const shopName = UPGRADES.find(u => u.level === this.shopLevel)?.name ?? '노점';
    const nameBg = this.add.graphics();
    nameBg.fillStyle(0x4a2c0a, 0.85);
    nameBg.fillRoundedRect(GAME_WIDTH / 2 - 80, HUD_HEIGHT + 8, 160, 30, 6);
    nameBg.lineStyle(2, 0xD4A017, 0.9);
    nameBg.strokeRoundedRect(GAME_WIDTH / 2 - 80, HUD_HEIGHT + 8, 160, 30, 6);

    this.add.text(GAME_WIDTH / 2, HUD_HEIGHT + 23, `🐟 ${shopName}`, {
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffdd00',
    }).setOrigin(0.5);
  }

  // ─── Queue Area ──────────────────────────────────────────────────────────

  private buildQueueArea(): void {
    const queueY = HUD_HEIGHT + 60;
    const area = this.add.graphics();
    area.fillStyle(0x252538, 0.8);
    area.fillRoundedRect(8, queueY, GAME_WIDTH - 16, 90, 8);

    const label = this.add.text(20, queueY + 8, '손님 대기', {
      fontSize: '11px',
      color: '#777799',
    });

    // Define 5 queue slots
    this.queueSlots = [];
    for (let i = 0; i < 5; i++) {
      const x = 48 + i * 68;
      const y = queueY + 48;
      this.queueSlots.push({ x, y });

      // Slot indicator
      const slot = this.add.graphics();
      slot.lineStyle(1, 0x555577, 0.5);
      slot.strokeCircle(x, y, 26);
    }
  }

  // ─── Mold Grid ───────────────────────────────────────────────────────────

  private buildMoldGrid(): void {
    this.molds.forEach(m => m.destroy());
    this.molds = [];

    const slots = UPGRADES.find(u => u.level === this.shopLevel)?.slots ?? 4;
    const gridStartY = HUD_HEIGHT + 165;

    const cols = slots <= 4 ? 2 : slots <= 6 ? 3 : 4;
    const rows = Math.ceil(slots / cols);
    const cellW = Math.floor((GAME_WIDTH - 20) / cols);
    const cellH = 105;

    for (let i = 0; i < slots; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 10 + col * cellW + cellW / 2;
      const y = gridStartY + row * cellH + 45;

      const mold = new BungeaMold(this, x, y, i);
      this.molds.push(mold);
      this.wireMoldEvents(mold);
    }
  }

  private wireMoldEvents(mold: BungeaMold): void {
    mold.events.on('request-pour', (m: BungeaMold) => {
      this.tryPour(m);
    });

    mold.events.on('waiting-for-filling', (m: BungeaMold) => {
      this.showFillingPanel(m);
    });

    mold.events.on('request-shelf', (m: BungeaMold) => {
      this.tryPutOnShelf(m);
    });

    mold.events.on('flipped', (_m: BungeaMold, quality: string) => {
      const x = mold.x;
      const y = mold.y;
      this.effects.showQualityLabel(x, y - 40, quality);
      if (quality === 'PERFECT') {
        this.effects.showPerfect(x, y);
        this.audio.play('perfect');
      }
    });

    mold.events.on('state-changed', (_m: BungeaMold, state: MoldState) => {
      if (state === MoldState.Burnt) {
        this.audio.play('burnt');
        this.economy.wastedCount++;
        if (this.activeFillMold === mold) this.hideFillingPanel();
      }
    });

    mold.events.on('audio', (key: AudioKey) => {
      this.audio.play(key);
    });
  }

  private tryPour(mold: BungeaMold): void {
    mold.startPouring();
  }

  private showFillingPanel(mold: BungeaMold): void {
    this.hideFillingPanel();
    this.activeFillMold = mold;

    const panelW = 118;
    const itemH  = 48;
    const items: MenuItem[] = ['red_bean', 'cream_cheese', 'choux'];
    const panelH = items.length * itemH + 32;

    const FILLING_ICONS: Record<MenuItem, string> = {
      red_bean:     'ing-red-bean',
      cream_cheese: 'ing-cream-cheese',
      choux:        'ing-choux',
    };

    // Position: right of mold if space, else left
    let px = mold.x + 50;
    if (px + panelW > GAME_WIDTH - 8) px = mold.x - panelW - 50;
    let py = mold.y - panelH / 2;
    py = Math.max(HUD_HEIGHT + 4, Math.min(py, GAME_HEIGHT - BOTTOM_BAR - panelH - 4));

    const panel = this.add.container(px, py);
    panel.setDepth(100);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.96);
    bg.fillRoundedRect(0, 0, panelW, panelH, 10);
    bg.lineStyle(2, 0x4ecdc4, 0.8);
    bg.strokeRoundedRect(0, 0, panelW, panelH, 10);
    panel.add(bg);

    const title = this.add.text(panelW / 2, 10, '소 선택', {
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#4ecdc4',
    }).setOrigin(0.5, 0);
    panel.add(title);

    const rowBgs: Phaser.GameObjects.Graphics[] = [];

    items.forEach((key, i) => {
      const def        = MENU_DEFS[key];
      const ingredient = def.ingredient as IngredientType;
      const stock      = this.economy.stock[ingredient] ?? 0;
      const locked     = def.unlockLevel > this.shopLevel;
      const disabled   = locked || stock === 0;

      const iy = 28 + i * itemH;
      const iw = panelW - 12;

      const rowBg = this.add.graphics();
      rowBg.fillStyle(disabled ? 0x1e1e30 : 0x2d2d44, 1);
      rowBg.fillRoundedRect(6, iy, iw, itemH - 4, 6);
      rowBgs.push(rowBg);
      panel.add(rowBg);

      const icon = this.add.image(22, iy + (itemH - 4) / 2, FILLING_ICONS[key]);
      icon.setDisplaySize(24, 24);
      icon.setAlpha(disabled ? 0.25 : 1);
      panel.add(icon);

      panel.add(this.add.text(40, iy + 7, def.name, {
        fontSize: '9px',
        color: disabled ? '#444466' : '#ffffff',
      }));
      panel.add(this.add.text(40, iy + 22, locked ? '🔒 잠금' : `${stock}개`, {
        fontSize: '9px',
        color: disabled ? '#333355' : '#aaaaaa',
      }));
    });

    // Single interactive zone on the whole panel — no nested container issues
    panel.setSize(panelW, panelH);
    panel.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, panelW, panelH),
      Phaser.Geom.Rectangle.Contains,
    );

    panel.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const localY = pointer.y - py;
      items.forEach((key, i) => {
        const def      = MENU_DEFS[key];
        const stock    = this.economy.stock[def.ingredient as IngredientType] ?? 0;
        const locked   = def.unlockLevel > this.shopLevel;
        const disabled = locked || stock === 0;
        const iy       = 28 + i * itemH;
        const iw       = panelW - 12;
        rowBgs[i].clear();
        const hover = !disabled && localY >= iy && localY < iy + itemH - 4;
        rowBgs[i].fillStyle(hover ? 0x4ecdc4 : (disabled ? 0x1e1e30 : 0x2d2d44), hover ? 0.3 : 1);
        rowBgs[i].fillRoundedRect(6, iy, iw, itemH - 4, 6);
      });
    });

    panel.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const localX = pointer.x - px;
      const localY = pointer.y - py;
      const iw     = panelW - 12;
      items.forEach((key, i) => {
        const def      = MENU_DEFS[key];
        const stock    = this.economy.stock[def.ingredient as IngredientType] ?? 0;
        const locked   = def.unlockLevel > this.shopLevel;
        if (locked || stock === 0) return;
        const iy = 28 + i * itemH;
        if (localX >= 6 && localX <= 6 + iw && localY >= iy && localY < iy + itemH - 4) {
          this.selectFilling(mold, key);
        }
      });
    });

    this.fillingPanel = panel;
  }

  private hideFillingPanel(): void {
    if (this.fillingPanel) {
      this.fillingPanel.destroy();
      this.fillingPanel = null;
    }
    this.activeFillMold = null;
  }

  private selectFilling(mold: BungeaMold, key: MenuItem): void {
    const ingredient = MENU_DEFS[key].ingredient as IngredientType;
    if (!this.economy.consume(ingredient)) {
      this.showToast('재료가 부족합니다!');
      return;
    }
    mold.setFilling(key);
    this.hideFillingPanel();
  }

  // ─── Shelf ────────────────────────────────────────────────────────────────

  private buildShelf(): void {
    const gap    = 5;
    const total  = SHELF.maxCapacity * SHELF_SLOT_W + (SHELF.maxCapacity - 1) * gap;
    const startX = (GAME_WIDTH - total) / 2;

    this.add.text(GAME_WIDTH / 2, SHELF_Y - 22, '🐟 진열대', {
      fontSize: '11px',
      color: '#777799',
    }).setOrigin(0.5);

    this.shelfSlotContainers = [];
    for (let i = 0; i < SHELF.maxCapacity; i++) {
      const cx = startX + i * (SHELF_SLOT_W + gap) + SHELF_SLOT_W / 2;
      const slot = this.add.container(cx, SHELF_Y + SHELF_SLOT_H / 2);
      slot.setDepth(5);
      this.shelfSlotContainers.push(slot);
      this.refreshShelfSlot(i);
    }
  }

  private refreshShelfSlot(index: number): void {
    const container = this.shelfSlotContainers[index];
    if (!container) return;

    container.each((child: Phaser.GameObjects.GameObject) => child.destroy());
    container.removeAll(false);
    container.removeInteractive();
    container.removeAllListeners();

    const hw = SHELF_SLOT_W / 2;
    const hh = SHELF_SLOT_H / 2;
    const locked = index >= this.shelfCapacity;
    const item   = this.shelfItems[index] ?? null;
    const bg     = this.add.graphics();

    if (locked) {
      bg.fillStyle(0x1a1a2e, 1);
      bg.fillRoundedRect(-hw, -hh, SHELF_SLOT_W, SHELF_SLOT_H, 6);
      bg.lineStyle(1, 0x2a2a44, 1);
      bg.strokeRoundedRect(-hw, -hh, SHELF_SLOT_W, SHELF_SLOT_H, 6);

      const costIdx = index - SHELF.initialCapacity;
      const cost    = SHELF.upgradeCosts[costIdx] ?? 0;
      const lck     = this.add.text(0, -8, '🔒', { fontSize: '14px' }).setOrigin(0.5);
      const cst     = this.add.text(0, 12, `${cost}G`, { fontSize: '8px', color: '#555577' }).setOrigin(0.5);

      container.add([bg, lck, cst]);
      container.setSize(SHELF_SLOT_W, SHELF_SLOT_H);
      container.setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => this.tryUpgradeShelf(index));

    } else if (item) {
      const borderColor = item.quality === 'PERFECT' ? 0xffdd00 : item.quality === 'UNDER' ? 0x666666 : 0x4ecdc4;
      bg.fillStyle(0x2d2d44, 1);
      bg.fillRoundedRect(-hw, -hh, SHELF_SLOT_W, SHELF_SLOT_H, 6);
      bg.lineStyle(2, borderColor, 1);
      bg.strokeRoundedRect(-hw, -hh, SHELF_SLOT_W, SHELF_SLOT_H, 6);

      const FISH_ICON: Record<MenuItem, string> = {
        red_bean: 'fish-red-bean', cream_cheese: 'fish-cream-cheese', choux: 'fish-choux',
      };
      const icon = this.add.image(0, -6, FISH_ICON[item.menu]);
      icon.setDisplaySize(32, 32);
      const qLabel = item.quality === 'PERFECT' ? '✨' : item.quality === 'UNDER' ? '△' : '';
      const qTxt   = this.add.text(0, 20, qLabel, { fontSize: '9px', color: '#ffdd88' }).setOrigin(0.5);

      container.add([bg, icon, qTxt]);
      container.setSize(SHELF_SLOT_W, SHELF_SLOT_H);
      container.setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => this.tryServeFromShelf(index));
      container.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(0x3d3d5c, 1);
        bg.fillRoundedRect(-hw, -hh, SHELF_SLOT_W, SHELF_SLOT_H, 6);
        bg.lineStyle(2, borderColor, 1);
        bg.strokeRoundedRect(-hw, -hh, SHELF_SLOT_W, SHELF_SLOT_H, 6);
      });
      container.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(0x2d2d44, 1);
        bg.fillRoundedRect(-hw, -hh, SHELF_SLOT_W, SHELF_SLOT_H, 6);
        bg.lineStyle(2, borderColor, 1);
        bg.strokeRoundedRect(-hw, -hh, SHELF_SLOT_W, SHELF_SLOT_H, 6);
      });

    } else {
      bg.fillStyle(0x252538, 0.7);
      bg.fillRoundedRect(-hw, -hh, SHELF_SLOT_W, SHELF_SLOT_H, 6);
      bg.lineStyle(1, 0x444466, 0.5);
      bg.strokeRoundedRect(-hw, -hh, SHELF_SLOT_W, SHELF_SLOT_H, 6);
      container.add([bg]);
    }
  }

  private tryPutOnShelf(mold: BungeaMold): void {
    if (!mold.currentMenu || !mold.quality) return;

    const emptyIdx = this.shelfItems.findIndex((s, i) => i < this.shelfCapacity && s === null);
    if (emptyIdx === -1) {
      this.showToast('진열대가 가득 찼습니다!');
      return;
    }

    this.shelfItems[emptyIdx] = { menu: mold.currentMenu, quality: mold.quality };
    mold.startServing();
    this.refreshShelfSlot(emptyIdx);
  }

  private tryServeFromShelf(index: number): void {
    const item = this.shelfItems[index];
    if (!item) return;

    const allCustomers = [...this.spawner.customers];
    if (allCustomers.length === 0) {
      this.showToast('주문 손님이 없습니다');
      return;
    }

    const matches = allCustomers.filter(c => c.order === item.menu);
    if (matches.length === 0) {
      this.showToast('해당 주문 손님이 없습니다');
      return;
    }

    const customer = matches.reduce((best, c) =>
      this.spawner.getRemainingMs(c) < this.spawner.getRemainingMs(best) ? c : best,
    );
    const served = this.spawner.serveCustomer(customer.id, item.menu);
    if (!served) return;

    const earned = this.economy.sell(item.menu, item.quality, served.def);
    this.shelfItems[index] = null;
    this.refreshShelfSlot(index);

    const sx = this.shelfSlotContainers[index].x;
    const sy = this.shelfSlotContainers[index].y;
    this.effects.showGoldEarned(sx, sy - 30, earned);
    this.effects.showHeart(sx + 20, sy - 20);
    this.audio.play('customer_happy');

    const fullyServed = served.quantityServed >= served.quantity;
    if (fullyServed) {
      this.removeCustomerUI(customer.id, false);
    } else {
      const ui = this.customerUIs.get(customer.id);
      if (ui) ui.updateQuantity(served.quantity - served.quantityServed);
    }
  }

  private tryUpgradeShelf(index: number): void {
    if (index !== this.shelfCapacity || this.shelfCapacity >= SHELF.maxCapacity) return;

    const costIdx = this.shelfCapacity - SHELF.initialCapacity;
    const cost    = SHELF.upgradeCosts[costIdx];
    if (cost === undefined) return;

    if (this.economy.gold < cost) {
      this.showToast(`진열대 확장 비용: ${cost}G`);
      return;
    }

    this.economy.gold -= cost;
    this.events.emit('gold-changed', this.economy.gold);
    this.shelfCapacity++;

    for (let i = 0; i < SHELF.maxCapacity; i++) this.refreshShelfSlot(i);
    this.showToast(`진열대 ${this.shelfCapacity}칸으로 확장!`);
  }

  private removeCustomerUI(id: string, angry: boolean): void {
    const ui = this.customerUIs.get(id);
    if (!ui) return;
    this.customerUIs.delete(id); // remove immediately so updateCustomerSpawning skips it
    this.tweens.add({
      targets: ui,
      alpha: 0,
      scaleX: angry ? 1 : 0.5,
      scaleY: angry ? 1 : 0.5,
      y: angry ? ui.y - 20 : ui.y,
      duration: angry ? 400 : 300,
      onComplete: () => ui.destroy(),
    });
  }

  // ─── Customer spawning ───────────────────────────────────────────────────

  private updateCustomerSpawning(): void {
    const spawned = this.spawner.update(this.shopLevel as 1 | 2 | 3);
    spawned.forEach(c => this.addCustomerUI(c));

    // Remove expired customer UIs
    const currentIds = new Set(this.spawner.customers.map(c => c.id));
    for (const [id, ui] of this.customerUIs) {
      if (!currentIds.has(id)) {
        this.effects.showAngry(ui.x, ui.y - 30);
        this.audio.play('customer_angry');
        this.tweens.add({
          targets: ui,
          alpha: 0,
          y: ui.y - 20,
          duration: 400,
          onComplete: () => {
            ui.destroy();
            this.customerUIs.delete(id);
          },
        });
      }
    }
  }

  private addCustomerUI(c: SpawnedCustomer): void {
    if (this.customerUIs.has(c.id)) return;

    const slot = this.queueSlots[this.customerUIs.size % this.queueSlots.length];
    if (!slot) return;

    const ui = new CustomerUI(this, slot.x, slot.y, c, this.spawner);
    ui.setAlpha(0);
    this.tweens.add({ targets: ui, alpha: 1, duration: 300 });
    this.customerUIs.set(c.id, ui);
  }

  private updateCustomerUIs(): void {
    this.customerUIs.forEach(ui => ui.update());
  }

  // ─── Economy events ──────────────────────────────────────────────────────

  private wireEconomyEvents(): void {
    this.economy.events.on('gold-changed', (gold: number) => {
      this.events.emit('gold-changed', gold);
    });
    this.economy.events.on('reputation-changed', (rep: number) => {
      this.events.emit('reputation-changed', rep);
    });
    this.economy.events.on('stock-changed', (type: IngredientType, amt: number) => {
      this.events.emit('stock-changed', type, amt);
    });
    this.economy.events.on('ingredient-exhausted', (type: IngredientType) => {
      this.showToast(`${type} 재료 소진!`);
    });
  }

  private wireUpgradeEvents(): void {
    this.upgrader.events.on('shop-upgraded', ({ newLevel, slots }: { newLevel: number; slots: number }) => {
      this.shopLevel = newLevel as 1 | 2 | 3;
      this.buildMoldGrid();
      this.events.emit('shop-level-changed', newLevel);
      this.showToast(`레벨 ${newLevel} 업그레이드! 틀 ${slots}개`);
    });
  }

  private wireInputEvents(): void {
    // Buy ingredient from UIScene
    this.events.on('buy-ingredient', (type: IngredientType) => {
      if (!this.economy.buyIngredient(type)) {
        this.showToast('골드가 부족합니다!');
      }
    });

    // Upgrade request
    this.events.on('request-upgrade', () => {
      if (!this.upgrader.canUpgrade(this.shopLevel, this.economy.gold)) {
        const cost = this.upgrader.getNextCost(this.shopLevel);
        this.showToast(cost ? `업그레이드 비용: ${cost}G` : '최고 레벨입니다');
        return;
      }
      const result = this.upgrader.upgrade(this.shopLevel);
      if (result) {
        const cost = UPGRADES.find(u => u.level === result.newLevel)?.cost ?? 0;
        this.economy.gold -= cost;
        this.events.emit('gold-changed', this.economy.gold);
      }
    });
  }

  // ─── Upgrade button ───────────────────────────────────────────────────────

  private upgradeBtn!: Phaser.GameObjects.Container;

  private buildUpgradeButton(): void {
    const y = GAME_HEIGHT - BOTTOM_BAR - 50;
    this.upgradeBtn = this.add.container(GAME_WIDTH / 2, y);

    const bg = this.add.graphics();
    bg.fillStyle(0xf39c12, 1);
    bg.fillRoundedRect(-70, -18, 140, 36, 8);

    const txt = this.add.text(0, 0, '업그레이드', {
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.upgradeBtn.add([bg, txt]);
    this.upgradeBtn.setSize(140, 36);
    this.upgradeBtn.setInteractive({ useHandCursor: true });
    this.upgradeBtn.on('pointerdown', () => {
      this.events.emit('request-upgrade');
    });

    this.upgradeBtn.setVisible(false);
  }

  private checkUpgradeAvailability(): void {
    const canUpgrade = this.upgrader.canUpgrade(this.shopLevel, this.economy.gold);
    this.upgradeBtn.setVisible(canUpgrade);
  }

  // ─── Day end ─────────────────────────────────────────────────────────────

  private async endDay(): Promise<void> {
    if (this.dayEnded) return;
    this.dayEnded = true;

    this.hideFillingPanel();

    // Force burn all active molds
    this.molds.forEach(m => {
      if ([MoldState.Baking, MoldState.Flipped, MoldState.Pouring, MoldState.WaitingForFilling].includes(m.state)) {
        m.forceBurnt();
      }
    });

    // Clear queue without penalty
    this.spawner.clearQueueNoPenalty();
    this.customerUIs.forEach(ui => ui.destroy());
    this.customerUIs.clear();

    // Unsold shelf items count as wasted
    this.shelfItems.forEach(item => { if (item) this.economy.wastedCount++; });

    const stats: DayStats = {
      version: 'v1',
      dayNumber: this.dayNumber,
      gold: this.economy.gold,
      shopLevel: this.shopLevel,
      shelfCapacity: this.shelfCapacity,
      stock: { ...this.economy.stock },
      totalSold: this.economy.totalSold,
      revenue: this.economy.revenue,
      wastedCount: this.economy.wastedCount,
      unsatisfiedCount: this.economy.unsatisfiedCount,
      satisfiedCount: this.economy.satisfiedCount,
    };

    await this.saveSystem.save(stats);

    this.time.delayedCall(800, () => {
      this.scene.stop('UIScene');
      this.scene.start('DailySummaryScene', stats);
    });
  }

  // ─── Toast ────────────────────────────────────────────────────────────────

  private showToast(msg: string): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2 - 80;

    const toast = this.add.text(cx, cy, msg, {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000cc',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: toast,
      alpha: 0,
      y: cy - 30,
      duration: 1200,
      delay: 600,
      onComplete: () => toast.destroy(),
    });
  }
}
