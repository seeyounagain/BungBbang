import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Generate minimal placeholder textures for loading screen
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x4ecdc4);
    g.fillRoundedRect(0, 0, 64, 64, 8);
    g.generateTexture('boot-logo', 64, 64);
    g.destroy();
  }

  create(): void {
    this.scene.start('PreloadScene');
  }
}
