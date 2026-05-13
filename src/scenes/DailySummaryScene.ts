import Phaser from 'phaser';
import type { DayStats } from '../data/types';

export class DailySummaryScene extends Phaser.Scene {
  private stats!: DayStats;

  constructor() {
    super({ key: 'DailySummaryScene' });
  }

  init(data: DayStats): void {
    this.stats = data;
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.add.rectangle(cx, height / 2, width, height, 0x1a1a2e);

    // Day title
    this.add.text(cx, 60, `Day ${this.stats.dayNumber} 마감!`, {
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffdd00',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Star rating
    const stars = this.calcStars();
    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    this.add.text(cx, 110, starStr, { fontSize: '32px' }).setOrigin(0.5);

    // Stats panel
    const panelY = 200;
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x2d2d44, 0.9);
    panelBg.fillRoundedRect(cx - 160, panelY, 320, 200, 12);
    panelBg.lineStyle(1, 0x4ecdc4, 0.4);
    panelBg.strokeRoundedRect(cx - 160, panelY, 320, 200, 12);

    const statItems = [
      { label: '판매한 붕어빵', value: `${this.stats.totalSold}개` },
      { label: '총 매출',      value: `${this.stats.revenue}G` },
      { label: '버린 빵',      value: `${this.stats.wastedCount}개` },
      { label: '불만족 손님',  value: `${this.stats.unsatisfiedCount}명` },
    ];

    statItems.forEach((item, i) => {
      const y = panelY + 28 + i * 42;
      this.add.text(cx - 140, y, item.label, {
        fontSize: '15px',
        color: '#aaaaaa',
      });

      const valueText = this.add.text(cx + 140, y, '0', {
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff',
      }).setOrigin(1, 0);

      const target = parseInt(item.value);
      if (!isNaN(target)) {
        this.tweens.addCounter({
          from: 0,
          to: target,
          duration: 800,
          delay: 200 + i * 150,
          onUpdate: (tween) => {
            valueText.setText(`${Math.floor(tween.getValue() ?? 0)}${item.value.replace(/\d+/, '')}`);
          },
          onComplete: () => {
            valueText.setText(item.value);
          },
        });
      } else {
        valueText.setText(item.value);
      }
    });

    // Gold info
    this.add.text(cx, 430, `보유 골드: ${this.stats.gold}G`, {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffdd00',
    }).setOrigin(0.5);

    // Next day button
    this.time.delayedCall(1200, () => {
      this.createNextButton(cx, height - 120);
    });
  }

  private calcStars(): number {
    const total = this.stats.satisfiedCount + this.stats.unsatisfiedCount;
    if (total === 0) return 1;
    return Math.max(1, Math.ceil((this.stats.satisfiedCount / total) * 3));
  }

  private createNextButton(x: number, y: number): void {
    const container = this.add.container(x, y);
    container.setAlpha(0);

    const bg = this.add.graphics();
    bg.fillStyle(0x4ecdc4, 1);
    bg.fillRoundedRect(-110, -24, 220, 48, 12);

    const text = this.add.text(0, 0, '내일 시작 →', {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(220, 48);
    container.setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 400,
    });

    container.on('pointerdown', () => {
      this.tweens.add({
        targets: container,
        scaleX: 0.92,
        scaleY: 0.92,
        duration: 80,
        yoyo: true,
        onComplete: () => {
          const nextStats: DayStats = {
            ...this.stats,
            dayNumber: this.stats.dayNumber + 1,
          };
          this.scene.start('GameScene', { save: nextStats });
        },
      });
    });
  }
}
