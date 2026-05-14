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
import { UPGRADES } from '../data/balance';
import { DAY } from '../data/balance';
import type { DayStats } from '../data/types';
import { MENU_DEFS, type MenuItem } from '../data/menu';
import type { IngredientType } from '../data/ingredients';
import type { SpawnedCustomer } from '../systems/CustomerSpawnerSystem';
import type { AudioKey } from '../data/types';

const GAME_WIDTH  = 390;
const GAME_HEIGHT = 844;
const HUD_HEIGHT  = 58;
const BOTTOM_BAR  = 56;

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

  // Queue display
  private queueSlots: { x: number; y: number }[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { save?: DayStats }): void {
    if (data?.save) {
      const s = data.save;
      this.dayNumber  = s.dayNumber;
      this.shopLevel  = Math.min(3, Math.max(1, s.shopLevel)) as 1 | 2 | 3;
      this.economy    = new EconomySystem(s.gold, s.stock as Record<IngredientType, number>);
    } else {
      this.dayNumber  = 1;
      this.shopLevel  = 1;
      this.economy    = new EconomySystem(300);
    }
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

    mold.events.on('request-serve', (m: BungeaMold) => {
      this.tryServe(m);
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

  private tryServe(mold: BungeaMold): void {
    if (!mold.currentMenu || !mold.quality) return;

    const allCustomers = [...this.spawner.customers];
    if (allCustomers.length === 0) {
      this.showToast('주문 손님이 없습니다');
      return;
    }

    // Find matching customer (correct order) with least patience
    const matches = allCustomers.filter(c => c.order === mold.currentMenu);
    const correctCustomer = matches.reduce<typeof matches[0] | undefined>((best, c) => {
      if (!best) return c;
      return this.spawner.getRemainingMs(c) < this.spawner.getRemainingMs(best) ? c : best;
    }, undefined);

    if (correctCustomer) {
      // ── Happy path: correct filling ──────────────────────────────
      const served = this.spawner.serveCustomer(correctCustomer.id, mold.currentMenu);
      if (!served) return;

      const earned = this.economy.sell(mold.currentMenu, mold.quality, served.def);
      mold.startServing();

      this.effects.showGoldEarned(mold.x, mold.y - 30, earned);
      this.effects.showHeart(mold.x + 30, mold.y - 20);
      this.audio.play('customer_happy');
      this.removeCustomerUI(correctCustomer.id, false);
    } else {
      // ── Wrong filling: give to most urgent customer, 0원 + penalty ──
      const mostUrgent = allCustomers.reduce((best, c) =>
        this.spawner.getRemainingMs(c) < this.spawner.getRemainingMs(best) ? c : best,
      );

      this.spawner.removeCustomer(mostUrgent.id);
      this.economy.decreaseReputation(mostUrgent.def.reputationOnFail);
      mold.forceBurnt();

      this.showToast('잘못된 소! 판매 실패');
      this.effects.showAngry(mold.x, mold.y - 30);
      this.audio.play('customer_angry');
      this.removeCustomerUI(mostUrgent.id, true);
    }
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

    const stats: DayStats = {
      version: 'v1',
      dayNumber: this.dayNumber,
      gold: this.economy.gold,
      shopLevel: this.shopLevel,
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
