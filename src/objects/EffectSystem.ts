import Phaser from 'phaser';

export class EffectSystem {
  constructor(private scene: Phaser.Scene) {}

  showPerfect(x: number, y: number): void {
    // Golden particles
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const dist = 30 + Math.random() * 20;
      const tx = x + Math.cos(angle) * dist;
      const ty = y + Math.sin(angle) * dist;

      const star = this.scene.add.text(x, y, '⭐', {
        fontSize: '16px',
      }).setOrigin(0.5).setDepth(100);

      this.scene.tweens.add({
        targets: star,
        x: tx,
        y: ty,
        alpha: 0,
        scale: 2,
        duration: 500,
        ease: 'Power2',
        onComplete: () => star.destroy(),
      });
    }

    const label = this.scene.add.text(x, y - 20, 'PERFECT!', {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffdd00',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100);

    this.scene.tweens.add({
      targets: label,
      y: y - 60,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => label.destroy(),
    });
  }

  showQualityLabel(x: number, y: number, quality: string): void {
    const colors: Record<string, string> = {
      PERFECT: '#ffdd00',
      GOOD:    '#88ff88',
      UNDER:   '#ffaa44',
      BURNT:   '#ff4444',
    };
    const label = this.scene.add.text(x, y, quality, {
      fontSize: '14px',
      fontStyle: 'bold',
      color: colors[quality] ?? '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(100);

    this.scene.tweens.add({
      targets: label,
      y: y - 40,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => label.destroy(),
    });
  }

  showHeart(x: number, y: number): void {
    const heart = this.scene.add.text(x, y, '❤️', {
      fontSize: '20px',
    }).setOrigin(0.5).setDepth(100);

    this.scene.tweens.add({
      targets: heart,
      y: y - 50,
      alpha: 0,
      scale: 1.5,
      duration: 600,
      ease: 'Power2',
      onComplete: () => heart.destroy(),
    });
  }

  showAngry(x: number, y: number): void {
    const angry = this.scene.add.text(x, y, '💢', {
      fontSize: '20px',
    }).setOrigin(0.5).setDepth(100);

    this.scene.tweens.add({
      targets: angry,
      y: y - 40,
      alpha: 0,
      scale: 1.5,
      duration: 500,
      ease: 'Power2',
      onComplete: () => angry.destroy(),
    });
  }

  showGoldEarned(x: number, y: number, amount: number): void {
    const label = this.scene.add.text(x, y, `+${amount}G`, {
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffdd00',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(100);

    this.scene.tweens.add({
      targets: label,
      y: y - 45,
      alpha: 0,
      duration: 700,
      ease: 'Power2',
      onComplete: () => label.destroy(),
    });
  }
}
