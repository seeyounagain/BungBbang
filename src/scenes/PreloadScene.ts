import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    this.createLoadingUI();
    this.loadAssets();
  }

  create(): void {
    this.generateMissingPlaceholders();
    this.scene.start('TitleScene');
  }

  private createLoadingUI(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.add.rectangle(cx, cy, width, height, 0x1a1a2e);

    this.add.text(cx, cy - 60, '붕어빵 타이쿤', {
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffdd00',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    const bar = this.add.rectangle(cx - 120, cy + 20, 0, 16, 0x4ecdc4).setOrigin(0, 0.5);
    this.add.rectangle(cx, cy + 20, 240, 16, 0x333333).setDepth(-1);

    const loadingText = this.add.text(cx, cy + 50, '로딩 중...', {
      fontSize: '14px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      bar.width = 240 * value;
      loadingText.setText(`로딩 중... ${Math.floor(value * 100)}%`);
    });
  }

  private loadAssets(): void {
    // Mold states (place your PNG files in public/assets/)
    this.load.image('mold-empty',    'assets/mold-empty.png');
    this.load.image('mold-pouring',  'assets/mold-pouring.png');
    this.load.image('mold-batter',   'assets/mold-batter.png');
    this.load.image('mold-baking1',  'assets/mold-baking1.png');
    this.load.image('mold-baking2',  'assets/mold-baking2.png');
    this.load.image('mold-done',     'assets/mold-done.png');
    this.load.image('mold-perfect',  'assets/mold-perfect.png');
    this.load.image('mold-burnt',    'assets/mold-burnt.png');
    this.load.image('mold-cleaning', 'assets/mold-cleaning.png');

    // Menu fish icons
    this.load.image('fish-red-bean',     'assets/fish-red-bean.png');
    this.load.image('fish-cream-cheese', 'assets/fish-cream-cheese.png');
    this.load.image('fish-choux',        'assets/fish-choux.png');

    // Customer characters
    this.load.image('cust-normal', 'assets/cust-normal.png');
    this.load.image('cust-worker', 'assets/cust-worker.png');
    this.load.image('cust-family', 'assets/cust-family.png');
    this.load.image('cust-vip',    'assets/cust-vip.png');

    // Ingredient icons
    this.load.image('ing-flour',        'assets/ing-flour.png');
    this.load.image('ing-red-bean',     'assets/ing-red-bean.png');
    this.load.image('ing-cream-cheese', 'assets/ing-cream-cheese.png');
    this.load.image('ing-choux',        'assets/ing-choux.png');

    // Shop backgrounds (one per level)
    this.load.image('shop-lv1', 'assets/shop-lv1.png');
    this.load.image('shop-lv2', 'assets/shop-lv2.png');
    this.load.image('shop-lv3', 'assets/shop-lv3.png');

    // Title screen background
    this.load.image('title-bg', 'assets/title-bg.png');
  }

  // Called in create() — generates colored placeholders for any images that failed to load
  private generateMissingPlaceholders(): void {
    const items: Array<[string, number, number, number]> = [
      // [key, width, height, fill-color]
      ['mold-empty',    96, 96, 0x666677],
      ['mold-pouring',  96, 96, 0x998844],
      ['mold-batter',   96, 96, 0xccbb55],
      ['mold-baking1',  96, 96, 0xcc8833],
      ['mold-baking2',  96, 96, 0xbb6622],
      ['mold-done',     96, 96, 0xD4A017],
      ['mold-perfect',  96, 96, 0xFFCC00],
      ['mold-burnt',    96, 96, 0x222222],
      ['mold-cleaning', 96, 96, 0x778899],
      ['fish-red-bean',     64, 64, 0xD4A017],
      ['fish-cream-cheese', 64, 64, 0xF5DEB3],
      ['fish-choux',        64, 64, 0xF8C471],
      ['cust-normal', 64, 96, 0x4ecdc4],
      ['cust-worker', 64, 96, 0x45b7d1],
      ['cust-family', 96, 96, 0xf7dc6f],
      ['cust-vip',    64, 96, 0xf39c12],
      ['ing-flour',        48, 48, 0xf5f5e0],
      ['ing-red-bean',     48, 48, 0x993333],
      ['ing-cream-cheese', 48, 48, 0xffffcc],
      ['ing-choux',        48, 48, 0xffdd88],
      ['shop-lv1', 390, 280, 0x3d2b1a],
      ['shop-lv2', 390, 280, 0x4a3020],
      ['shop-lv3', 390, 280, 0x5a3a20],
      ['title-bg', 390, 844, 0x1a1a2e],
    ];

    for (const [key, w, h, color] of items) {
      if (!this.textures.exists(key)) {
        this.makePlaceholder(key, w, h, color);
      }
    }
  }

  private makePlaceholder(key: string, w: number, h: number, color: number): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(color, 1);
    g.fillRoundedRect(0, 0, w, h, 6);
    g.lineStyle(2, 0xffffff, 0.25);
    g.strokeRoundedRect(1, 1, w - 2, h - 2, 5);
    g.generateTexture(key, w, h);
    g.destroy();
  }
}
