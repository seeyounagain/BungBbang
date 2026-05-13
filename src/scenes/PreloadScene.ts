import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    this.createLoadingUI();
    this.generateAllTextures();
  }

  create(): void {
    this.scene.start('TitleScene');
  }

  private createLoadingUI(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.add.rectangle(cx, cy, width, height, 0x1a1a2e);

    const title = this.add.text(cx, cy - 60, '붕어빵 타이쿤', {
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffdd00',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    const barBg = this.add.rectangle(cx, cy + 20, 240, 16, 0x333333);
    const bar = this.add.rectangle(cx - 120, cy + 20, 0, 16, 0x4ecdc4);
    bar.setOrigin(0, 0.5);

    const loadingText = this.add.text(cx, cy + 50, '로딩 중...', {
      fontSize: '14px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      bar.width = 240 * value;
      loadingText.setText(`로딩 중... ${Math.floor(value * 100)}%`);
    });
  }

  private generateAllTextures(): void {
    this.generateMoldTextures();
    this.generateFishTextures();
    this.generateCustomerTextures();
    this.generateMenuIcons();
    this.generateUITextures();
  }

  private generateMoldTextures(): void {
    // mold-empty: grey fish-shaped mold outline
    this.generateTexture('mold-empty', 72, 72, (g) => {
      g.lineStyle(3, 0x888888, 1);
      g.fillStyle(0x444444, 1);
      this.drawFishShape(g, 36, 36, 32, 28);
    });

    // mold-baking: warm orange mold
    this.generateTexture('mold-baking', 72, 72, (g) => {
      g.fillStyle(0x664422, 1);
      this.drawFishShape(g, 36, 36, 32, 28);
      g.lineStyle(2, 0xaa6633, 1);
      g.strokeRect(4, 4, 64, 64);
    });

    // mold-done: golden mold
    this.generateTexture('mold-done', 72, 72, (g) => {
      g.fillStyle(0x886622, 1);
      this.drawFishShape(g, 36, 36, 32, 28);
      g.lineStyle(3, 0xffcc44, 1);
      g.strokeRect(4, 4, 64, 64);
    });

    // mold-burnt: dark mold
    this.generateTexture('mold-burnt', 72, 72, (g) => {
      g.fillStyle(0x222222, 1);
      this.drawFishShape(g, 36, 36, 32, 28);
      g.lineStyle(2, 0x444444, 1);
      g.strokeRect(4, 4, 64, 64);
    });

    // fish-baking: fish sprite (white, will be tinted)
    this.generateTexture('fish-baking', 56, 52, (g) => {
      g.fillStyle(0xFFFFFF, 1);
      this.drawFishBody(g, 28, 26, 24, 20);
      // eye
      g.fillStyle(0x000000, 1);
      g.fillCircle(38, 22, 3);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(39, 21, 1.5);
    });
  }

  private drawFishShape(g: Phaser.GameObjects.Graphics, cx: number, cy: number, rx: number, ry: number): void {
    // Simple fish silhouette using ellipse + tail
    g.fillEllipse(cx - 4, cy, rx * 1.8, ry * 2);
    // Tail
    g.fillTriangle(
      cx + rx - 6, cy,
      cx + rx + 10, cy - ry * 0.7,
      cx + rx + 10, cy + ry * 0.7,
    );
  }

  private drawFishBody(g: Phaser.GameObjects.Graphics, cx: number, cy: number, rx: number, ry: number): void {
    g.fillEllipse(cx - 4, cy, rx * 1.8, ry * 2);
    g.fillTriangle(
      cx + rx - 4, cy,
      cx + rx + 10, cy - ry * 0.7,
      cx + rx + 10, cy + ry * 0.7,
    );
  }

  private generateCustomerTextures(): void {
    const customerColors: Record<string, number> = {
      normal: 0x4ecdc4,
      worker: 0x45b7d1,
      family: 0xf7dc6f,
      vip:    0xf39c12,
    };
    const customerEmojis: Record<string, string> = {
      normal: '👤',
      worker: '💼',
      family: '👨‍👩‍👧',
      vip:    '⭐',
    };

    for (const [type, color] of Object.entries(customerColors)) {
      this.generateTexture(`customer-${type}`, 48, 48, (g) => {
        g.fillStyle(color, 1);
        g.fillCircle(24, 20, 18);
        g.fillStyle(color, 0.8);
        g.fillEllipse(24, 42, 32, 20);
      });
    }
  }

  private generateMenuIcons(): void {
    const menuColors: Record<string, number> = {
      red_bean:     0xD4A017,
      cream_cheese: 0xF5CBA7,
      choux:        0xF8C471,
    };

    for (const [menu, color] of Object.entries(menuColors)) {
      this.generateTexture(`menu-${menu}`, 28, 28, (g) => {
        g.fillStyle(color, 1);
        this.drawFishBody(g, 14, 14, 10, 9);
        g.fillStyle(0x000000, 0.3);
        g.fillCircle(18, 11, 2);
      });
    }
  }

  private generateFishTextures(): void {
    // Additional fish states
    this.generateTexture('fish-done', 56, 52, (g) => {
      g.fillStyle(0xD4A017, 1);
      this.drawFishBody(g, 28, 26, 24, 20);
      g.fillStyle(0x000000, 1);
      g.fillCircle(38, 22, 3);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(39, 21, 1.5);
    });
  }

  private generateUITextures(): void {
    // Button backgrounds
    this.generateTexture('btn-normal', 120, 36, (g) => {
      g.fillStyle(0x4ecdc4, 1);
      g.fillRoundedRect(0, 0, 120, 36, 8);
    });

    this.generateTexture('btn-upgrade', 140, 40, (g) => {
      g.fillStyle(0xf39c12, 1);
      g.fillRoundedRect(0, 0, 140, 40, 8);
    });

    this.generateTexture('btn-disabled', 120, 36, (g) => {
      g.fillStyle(0x555555, 1);
      g.fillRoundedRect(0, 0, 120, 36, 8);
    });

    // HUD background
    this.generateTexture('hud-bg', 390, 60, (g) => {
      g.fillStyle(0x1a1a2e, 0.95);
      g.fillRect(0, 0, 390, 60);
      g.lineStyle(2, 0x4ecdc4, 0.5);
      g.strokeRect(0, 0, 390, 60);
    });

    // Panel background
    this.generateTexture('panel-bg', 380, 120, (g) => {
      g.fillStyle(0x2d2d44, 0.9);
      g.fillRoundedRect(0, 0, 380, 120, 10);
      g.lineStyle(1, 0x4ecdc4, 0.3);
      g.strokeRoundedRect(0, 0, 380, 120, 10);
    });

    // Title background
    this.generateTexture('title-bg', 390, 844, (g) => {
      g.fillStyle(0x1a1a2e, 1);
      g.fillRect(0, 0, 390, 844);
      // Decorative circles
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
