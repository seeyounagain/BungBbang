import Phaser from 'phaser';
import type { GameScene } from './GameScene';
import { UPGRADES } from '../data/balance';
import { INGREDIENT_DEFS, type IngredientType } from '../data/ingredients';
import { MENU_DEFS, type MenuItem } from '../data/menu';

const MENU_FISH_FRAME: Record<MenuItem, string> = {
  red_bean:     'fish-red-bean',
  cream_cheese: 'fish-cream-cheese',
  choux:        'fish-choux',
};

const INGREDIENT_FRAME: Record<IngredientType, string> = {
  flour:        'ing-flour',
  red_bean:     'ing-red-bean',
  cream_cheese: 'ing-cream-cheese',
  choux:        'ing-custard',
};

export class UIScene extends Phaser.Scene {
  private goldText!: Phaser.GameObjects.Text;
  private timerBar!: Phaser.GameObjects.Graphics;
  private timerText!: Phaser.GameObjects.Text;
  private dayText!: Phaser.GameObjects.Text;
  private reputationStars!: Phaser.GameObjects.Text;
  private bottomPanel!: Phaser.GameObjects.Container;
  private menuPanel!: Phaser.GameObjects.Container;
  private shopPanel!: Phaser.GameObjects.Container;
  private closeZone!: Phaser.GameObjects.Zone;
  private activePanel: 'menu' | 'shop' | null = null;
  private menuButtons: Map<MenuItem, Phaser.GameObjects.Container> = new Map();

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.buildHUD(width);
    this.buildBottomBar(width, height);
    this.buildMenuPanel(width, height);
    this.buildShopPanel(width, height);
    this.subscribeToGameEvents();
  }

  private buildHUD(width: number): void {
    // HUD background
    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x1a1a2e, 0.95);
    hudBg.fillRect(0, 0, width, 58);
    hudBg.lineStyle(2, 0x4ecdc4, 0.4);
    hudBg.lineBetween(0, 58, width, 58);

    // Day label
    this.dayText = this.add.text(12, 10, 'Day 1', {
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffdd00',
    });

    // Timer bar
    const timerBarBg = this.add.graphics();
    timerBarBg.fillStyle(0x333333, 1);
    timerBarBg.fillRoundedRect(width / 2 - 90, 16, 180, 12, 4);

    this.timerBar = this.add.graphics();

    this.timerText = this.add.text(width / 2, 14, '5:00', {
      fontSize: '11px',
      color: '#cccccc',
    }).setOrigin(0.5, 0);

    // Gold text
    this.goldText = this.add.text(width - 12, 10, '200G', {
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffdd00',
    }).setOrigin(1, 0);

    // Reputation stars
    this.reputationStars = this.add.text(12, 36, '★★★★★', {
      fontSize: '14px',
      color: '#ffcc00',
    });

    this.updateTimerBar(1.0);
  }

  private buildBottomBar(width: number, height: number): void {
    this.bottomPanel = this.add.container(0, height - 56);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRect(0, 0, width, 56);
    bg.lineStyle(2, 0x4ecdc4, 0.3);
    bg.lineBetween(0, 0, width, 0);

    const menuBtn = this.createTabButton(width / 4, 28, '🐟 메뉴', () => this.togglePanel('menu'));
    const shopBtn = this.createTabButton((width / 4) * 3, 28, '🏪 상점', () => this.togglePanel('shop'));

    this.bottomPanel.add([bg, menuBtn, shopBtn]);
  }

  private createTabButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x2d2d44, 1);
    bg.fillRoundedRect(-60, -18, 120, 36, 8);

    const text = this.add.text(0, 0, label, {
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(120, 36);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerdown', onClick);
    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x4ecdc4, 1);
      bg.fillRoundedRect(-60, -18, 120, 36, 8);
    });
    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x2d2d44, 1);
      bg.fillRoundedRect(-60, -18, 120, 36, 8);
    });

    return container;
  }

  private buildMenuPanel(width: number, height: number): void {
    this.menuPanel = this.add.container(0, height - 56 - 160);
    this.menuPanel.setVisible(false);
    this.menuPanel.setDepth(10);

    const bg = this.add.graphics();
    bg.fillStyle(0x2d2d44, 0.97);
    bg.fillRoundedRect(8, 0, width - 16, 155, 12);
    bg.lineStyle(1, 0x4ecdc4, 0.4);
    bg.strokeRoundedRect(8, 0, width - 16, 155, 12);

    this.menuPanel.add(bg);

    const menuKeys: MenuItem[] = ['red_bean', 'cream_cheese', 'choux'];
    menuKeys.forEach((key, i) => {
      const btn = this.buildMenuButton(key, 30 + i * 120, 75);
      this.menuButtons.set(key, btn);
      this.menuPanel.add(btn);
    });

    // Close tap outside — disabled by default, enabled only when a panel is open
    this.closeZone = this.add.zone(0, 0, width, height).setOrigin(0).setDepth(9);
    this.closeZone.setInteractive();
    this.closeZone.disableInteractive();
    this.closeZone.on('pointerdown', () => this.hideAllPanels());
  }

  private buildMenuButton(key: MenuItem, x: number, y: number): Phaser.GameObjects.Container {
    const def = MENU_DEFS[key];
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x3d3d5c, 1);
    bg.fillRoundedRect(-48, -55, 96, 110, 8);

    const icon = this.add.image(0, -22, 'fish-sheet', MENU_FISH_FRAME[key]);
    icon.setDisplaySize(44, 44);

    const nameText = this.add.text(0, 8, def.name, {
      fontSize: '9px',
      color: '#ffffff',
      wordWrap: { width: 86 },
      align: 'center',
    }).setOrigin(0.5, 0);

    const priceText = this.add.text(0, 28, `${def.price}G`, {
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffdd00',
    }).setOrigin(0.5, 0);

    const lockText = this.add.text(0, 0, '🔒', {
      fontSize: '20px',
    }).setOrigin(0.5).setVisible(false);

    container.add([bg, icon, nameText, priceText, lockText]);
    container.setSize(96, 110);
    container.setInteractive({ useHandCursor: true });

    container.setData('key', key);
    container.setData('lockText', lockText);
    container.setData('bg', bg);

    container.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene') as GameScene;
      gameScene.events.emit('menu-selected', key);
    });

    return container;
  }

  private buildShopPanel(width: number, height: number): void {
    this.shopPanel = this.add.container(0, height - 56 - 220);
    this.shopPanel.setVisible(false);
    this.shopPanel.setDepth(10);

    const bg = this.add.graphics();
    bg.fillStyle(0x2d2d44, 0.97);
    bg.fillRoundedRect(8, 0, width - 16, 215, 12);
    bg.lineStyle(1, 0x4ecdc4, 0.4);
    bg.strokeRoundedRect(8, 0, width - 16, 215, 12);

    const title = this.add.text(width / 2, 18, '🏪 재료 상점', {
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffdd00',
    }).setOrigin(0.5, 0);

    this.shopPanel.add([bg, title]);

    const ingredients: IngredientType[] = ['flour', 'red_bean', 'cream_cheese', 'choux'];
    ingredients.forEach((type, i) => {
      const row = this.buildIngredientRow(type, i, width);
      this.shopPanel.add(row);
    });
  }

  private buildIngredientRow(
    type: IngredientType,
    index: number,
    width: number,
  ): Phaser.GameObjects.Container {
    const def = INGREDIENT_DEFS[type];
    const y = 48 + index * 40;
    const row = this.add.container(width / 2, y);

    const ingIcon = this.add.image(-155, 0, 'ingredient-sheet', INGREDIENT_FRAME[type]);
    ingIcon.setDisplaySize(28, 28);

    const nameTxt = this.add.text(-136, 0, def.name, {
      fontSize: '13px',
      color: '#ffffff',
    }).setOrigin(0, 0.5);

    const stockTxt = this.add.text(-30, 0, '0개', {
      fontSize: '12px',
      color: '#aaaaaa',
    }).setOrigin(0, 0.5);
    stockTxt.setData('type', type);

    const buyBtn = this.add.graphics();
    buyBtn.fillStyle(0x4ecdc4, 1);
    buyBtn.fillRoundedRect(-5, -14, 95, 28, 6);

    const buyBtnText = this.add.text(42, 0, `${def.pricePerBatch}G 구매`, {
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    const btnContainer = this.add.container(60, 0);
    btnContainer.add([buyBtn, buyBtnText]);
    btnContainer.setSize(95, 28);
    btnContainer.setInteractive({ useHandCursor: true });
    btnContainer.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene') as GameScene;
      gameScene.events.emit('buy-ingredient', type);
    });

    row.add([ingIcon, nameTxt, stockTxt, btnContainer]);
    row.setData('stockTxt', stockTxt);
    row.setData('type', type);

    return row;
  }

  private togglePanel(panel: 'menu' | 'shop'): void {
    if (this.activePanel === panel) {
      this.hideAllPanels();
      return;
    }
    this.hideAllPanels();
    this.activePanel = panel;
    if (panel === 'menu') this.menuPanel.setVisible(true);
    if (panel === 'shop') this.shopPanel.setVisible(true);
    this.closeZone.setInteractive();
  }

  private hideAllPanels(): void {
    this.activePanel = null;
    this.menuPanel.setVisible(false);
    this.shopPanel.setVisible(false);
    this.closeZone.disableInteractive();
  }

  private subscribeToGameEvents(): void {
    const gameScene = this.scene.get('GameScene') as GameScene;

    gameScene.events.on('timer-update', (ratio: number) => {
      this.updateTimerBar(ratio);
      const totalMs = ratio * 5 * 60 * 1000;
      const secs = Math.ceil(totalMs / 1000);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      this.timerText.setText(`${m}:${s.toString().padStart(2, '0')}`);
    });

    gameScene.events.on('gold-changed', (gold: number) => {
      this.goldText.setText(`${gold}G`);
    });

    gameScene.events.on('reputation-changed', (rep: number) => {
      const filled = Math.round(rep);
      this.reputationStars.setText('★'.repeat(filled) + '☆'.repeat(Math.max(0, 5 - filled)));
    });

    gameScene.events.on('day-changed', (day: number) => {
      this.dayText.setText(`Day ${day}`);
    });

    gameScene.events.on('gold-init', (gold: number) => {
      this.goldText.setText(`${gold}G`);
    });

    gameScene.events.on('stock-changed', (type: IngredientType, amount: number) => {
      this.updateStockDisplay(type, amount);
    });

    gameScene.events.on('shop-level-changed', (level: number) => {
      this.updateMenuButtonsByLevel(level);
    });
  }

  updateTimerBar(ratio: number): void {
    const width = 180;
    this.timerBar.clear();
    const color = ratio > 0.5 ? 0x44cc44 : ratio > 0.25 ? 0xffcc00 : 0xff4444;
    this.timerBar.fillStyle(color, 1);
    this.timerBar.fillRoundedRect(this.scale.width / 2 - 90, 16, width * ratio, 12, 4);
  }

  updateStockDisplay(type: IngredientType, amount: number): void {
    this.shopPanel.each((child: Phaser.GameObjects.GameObject) => {
      if (child instanceof Phaser.GameObjects.Container) {
        if (child.getData('type') === type) {
          const txt = child.getData('stockTxt') as Phaser.GameObjects.Text | undefined;
          if (txt) txt.setText(`${amount}개`);
        }
      }
    });
  }

  updateMenuButtonsByLevel(level: number): void {
    this.menuButtons.forEach((btn, key) => {
      const def = MENU_DEFS[key];
      const locked = def.unlockLevel > level;
      const lockText = btn.getData('lockText') as Phaser.GameObjects.Text;
      const bg = btn.getData('bg') as Phaser.GameObjects.Graphics;
      lockText.setVisible(locked);
      bg.clear();
      bg.fillStyle(locked ? 0x222233 : 0x3d3d5c, 1);
      bg.fillRoundedRect(-48, -55, 96, 110, 8);
      if (locked) {
        btn.disableInteractive();
      } else {
        btn.setInteractive({ useHandCursor: true });
      }
    });
  }
}
