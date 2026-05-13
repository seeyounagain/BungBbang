import Phaser from 'phaser';
import { SaveSystem } from '../systems/storage/SaveSystem';
import { LocalStorageAdapter } from '../systems/storage/LocalStorageAdapter';
import type { DayStats } from '../data/types';

export class TitleScene extends Phaser.Scene {
  private saveSystem!: SaveSystem;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    this.saveSystem = new SaveSystem(new LocalStorageAdapter());
    this.buildUI();
    this.loadAndSetupButtons();
  }

  private buildUI(): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.add.image(cx, height / 2, 'title-bg');

    // Title text
    this.add.text(cx, 180, '🐟', { fontSize: '64px' }).setOrigin(0.5);
    this.add.text(cx, 270, '붕어빵 타이쿤', {
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#ffdd00',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(cx, 316, '노점에서 동네 맛집으로!', {
      fontSize: '14px',
      color: '#aaccff',
    }).setOrigin(0.5);
  }

  private async loadAndSetupButtons(): Promise<void> {
    const { width, height } = this.scale;
    const cx = width / 2;
    const save = await this.saveSystem.load();

    if (save) {
      this.createButton(cx, height - 280, '이어서 하기', 0x4ecdc4, () => {
        this.scene.start('GameScene', { save });
      });
      this.createButton(cx, height - 220, '새로 시작', 0x888888, async () => {
        await this.saveSystem.remove();
        this.scene.start('GameScene');
      });

      // Save info
      this.add.text(cx, height - 340, `Day ${save.dayNumber} | ${save.gold}G`, {
        fontSize: '13px',
        color: '#aaaaaa',
      }).setOrigin(0.5);
    } else {
      this.createButton(cx, height - 260, '게임 시작', 0x4ecdc4, () => {
        this.scene.start('GameScene');
      });
    }

    // Version info
    this.add.text(cx, height - 40, 'v1.0 MVP', {
      fontSize: '11px',
      color: '#555577',
    }).setOrigin(0.5);
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    color: number,
    onClick: () => void,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-90, -22, 180, 44, 10);

    const text = this.add.text(0, 0, label, {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(180, 44);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', () => {
      this.tweens.add({
        targets: container,
        scaleX: 0.92,
        scaleY: 0.92,
        duration: 80,
        yoyo: true,
        onComplete: onClick,
      });
    });

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(Phaser.Display.Color.ValueToColor(color).brighten(20).color, 1);
      bg.fillRoundedRect(-90, -22, 180, 44, 10);
    });
    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-90, -22, 180, 44, 10);
    });

    return container;
  }
}
