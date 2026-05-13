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
    this.defineTextureFrames();
    this.generateFallbackTextures();
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
    this.load.image('mold-sheet',       'assets/mold-sheet.png');
    this.load.image('fish-sheet',       'assets/fish-sheet.png');
    this.load.image('customer-sheet',   'assets/customer-sheet.png');
    this.load.image('ingredient-sheet', 'assets/ingredient-sheet.png');
    this.load.image('order-bubbles',    'assets/order-bubbles.png');
    this.load.image('shop-buildings',   'assets/shop-buildings.png');
    this.load.image('shop-decor',       'assets/shop-decor.png');
    this.load.image('ui-elements',      'assets/ui-elements.png');
  }

  private defineTextureFrames(): void {
    // mold-sheet.png (1448×1086) — 5 cols, 2 mold rows + 1 bar row
    // Each mold frame ≈ 290×435px; bars at y=870
    const MW = 290, MH = 435;
    const mold = this.textures.get('mold-sheet');
    mold.add('mold-empty',    0, 0,        0,   MW, MH);
    mold.add('mold-pouring',  0, MW,       0,   MW, MH);
    mold.add('mold-batter',   0, MW * 2,   0,   MW, MH);
    mold.add('mold-baking1',  0, MW * 3,   0,   MW, MH);
    mold.add('mold-baking2',  0, MW * 4,   0,   MW, MH);
    mold.add('mold-done',     0, 0,        MH,  MW, MH);
    mold.add('mold-perfect',  0, MW,       MH,  MW, MH);
    mold.add('mold-burnt',    0, MW * 2,   MH,  MW, MH);
    mold.add('mold-cleaning', 0, MW * 3,   MH,  MW, MH);

    // fish-sheet.png (1254×1254) — 4 cols × 2 rows
    // Row 1: fillings (red-bean, cream-cheese, custard, choux)
    // Row 2: baking stages (perfect, good, under, burnt)
    const FW = 313, FH = 627;
    const fish = this.textures.get('fish-sheet');
    fish.add('fish-red-bean',      0, 0,        0,   FW, FH);
    fish.add('fish-cream-cheese',  0, FW,       0,   FW, FH);
    fish.add('fish-custard',       0, FW * 2,   0,   FW, FH);
    fish.add('fish-choux',         0, FW * 3,   0,   FW, FH);
    fish.add('fish-stage-perfect', 0, 0,        FH,  FW, FH);
    fish.add('fish-stage-good',    0, FW,       FH,  FW, FH);
    fish.add('fish-stage-under',   0, FW * 2,   FH,  FW, FH);
    fish.add('fish-stage-burnt',   0, FW * 3,   FH,  FW, FH);

    // customer-sheet.png (1024×559) — title ~25px, fish row y=25 h=175, customers y=200
    const CW = 204, CY = 200, CH = 359;
    const cust = this.textures.get('customer-sheet');
    cust.add('cust-normal', 0, 0,        CY, CW, CH);
    cust.add('cust-worker', 0, CW,       CY, CW, CH);
    cust.add('cust-family', 0, CW * 2,   CY, CW, CH);
    cust.add('cust-vip',    0, CW * 3,   CY, CW, CH);

    // ingredient-sheet.png (1448×1086) — 5 cols × 2 rows
    // Row 1: flour, red_bean, cream_cheese, custard, mixed_nuts
    // Row 2: oil/brush, coin, coin-stack, star, medal
    const IW = 290, IH = 543;
    const ing = this.textures.get('ingredient-sheet');
    ing.add('ing-flour',        0, 0,        0,   IW, IH);
    ing.add('ing-red-bean',     0, IW,       0,   IW, IH);
    ing.add('ing-cream-cheese', 0, IW * 2,   0,   IW, IH);
    ing.add('ing-custard',      0, IW * 3,   0,   IW, IH);
    ing.add('ing-mixed-nuts',   0, IW * 4,   0,   IW, IH);
    ing.add('ing-oil',          0, 0,        IH,  IW, IH);
    ing.add('ing-coin',         0, IW,       IH,  IW, IH);
    ing.add('ing-coin-stack',   0, IW * 2,   IH,  IW, IH);
    ing.add('ing-star',         0, IW * 3,   IH,  IW, IH);
    ing.add('ing-medal',        0, IW * 4,   IH,  IW, IH);

    // order-bubbles.png (1448×1086) — 4 speech bubbles in row 1 (y=0, h=362)
    const OW = 362, OH = 362;
    const order = this.textures.get('order-bubbles');
    order.add('bubble-red-bean',     0, 0,        0, OW, OH);
    order.add('bubble-cream-cheese', 0, OW,       0, OW, OH);
    order.add('bubble-custard',      0, OW * 2,   0, OW, OH);
    order.add('bubble-choux',        0, OW * 3,   0, OW, OH);

    // shop-buildings.png (1448×1086) — 5 building levels
    const SW = 290;
    const shopBld = this.textures.get('shop-buildings');
    shopBld.add('shop-lv1', 0, 0,        0, SW, 1086);
    shopBld.add('shop-lv2', 0, SW,       0, SW, 1086);
    shopBld.add('shop-lv3', 0, SW * 2,   0, SW, 1086);
    shopBld.add('shop-lv4', 0, SW * 3,   0, SW, 1086);
    shopBld.add('shop-lv5', 0, SW * 4,   0, SW, 1086);
  }

  private generateFallbackTextures(): void {
    this.generateTexture('title-bg', 390, 844, (g) => {
      g.fillStyle(0x1a1a2e, 1);
      g.fillRect(0, 0, 390, 844);
      g.fillStyle(0x4ecdc4, 0.1);
      g.fillCircle(390, 200, 150);
      g.fillStyle(0xf39c12, 0.08);
      g.fillCircle(0, 600, 200);
    });
  }

  private generateTexture(
    key: string,
    width: number,
    height: number,
    draw: (g: Phaser.GameObjects.Graphics) => void,
  ): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    draw(g);
    g.generateTexture(key, width, height);
    g.destroy();
  }
}
