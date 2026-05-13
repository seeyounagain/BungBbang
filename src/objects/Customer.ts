import Phaser from 'phaser';
import type { SpawnedCustomer } from '../systems/CustomerSpawnerSystem';
import type { CustomerSpawnerSystem } from '../systems/CustomerSpawnerSystem';

export class CustomerUI extends Phaser.GameObjects.Container {
  private portrait!: Phaser.GameObjects.Graphics;
  private patienceBarBg!: Phaser.GameObjects.Graphics;
  private patienceBarFill!: Phaser.GameObjects.Graphics;
  private orderBubble!: Phaser.GameObjects.Container;
  private expressionLabel!: Phaser.GameObjects.Text;

  readonly customerData: SpawnedCustomer;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    customer: SpawnedCustomer,
    private spawner: CustomerSpawnerSystem,
  ) {
    super(scene, x, y);
    this.customerData = customer;
    this.buildVisuals(scene);
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    this.setSize(60, 100);
    this.setInteractive({ useHandCursor: true });
  }

  private buildVisuals(scene: Phaser.Scene): void {
    const def = this.customerData.def;

    // Portrait background circle
    const bg = scene.add.graphics();
    bg.fillStyle(def.color, 1);
    bg.fillCircle(0, 0, 24);

    // Portrait shape
    this.portrait = scene.add.graphics();
    this.portrait.fillStyle(0xffffff, 0.9);
    this.portrait.fillCircle(0, -5, 12);
    this.portrait.fillEllipse(0, 14, 22, 14);

    // Expression
    this.expressionLabel = scene.add.text(14, -18, '😊', {
      fontSize: '12px',
    }).setOrigin(0.5);

    // Patience bar background
    this.patienceBarBg = scene.add.graphics();
    this.patienceBarBg.fillStyle(0x333333, 0.8);
    this.patienceBarBg.fillRect(-25, 28, 50, 7);

    // Patience bar fill
    this.patienceBarFill = scene.add.graphics();

    // Name label
    const nameLabel = scene.add.text(0, 38, def.name, {
      fontSize: '8px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 0);

    // Order bubble
    this.orderBubble = scene.add.container(-30, -44);
    const bubbleBg = scene.add.graphics();
    bubbleBg.fillStyle(0xffffff, 0.95);
    bubbleBg.fillRoundedRect(0, 0, 28, 28, 6);
    bubbleBg.lineStyle(2, 0x333333, 1);
    bubbleBg.strokeRoundedRect(0, 0, 28, 28, 6);
    const orderIcon = scene.add.image(14, 14, `menu-${this.customerData.order}`);
    orderIcon.setDisplaySize(22, 22);
    this.orderBubble.add([bubbleBg, orderIcon]);

    this.add([bg, this.portrait, this.expressionLabel, this.patienceBarBg, this.patienceBarFill, nameLabel, this.orderBubble]);

    // VIP: hide patience bar
    if (this.customerData.type === 'vip') {
      this.patienceBarBg.setVisible(false);
      this.patienceBarFill.setVisible(false);
    }
  }

  update(): void {
    if (this.customerData.type === 'vip') {
      this.expressionLabel.setText('😊');
      return;
    }

    const ratio = this.spawner.getPatienceRatio(this.customerData);
    this.updatePatienceBar(ratio);
    this.updateExpression(ratio);
  }

  private updatePatienceBar(ratio: number): void {
    this.patienceBarFill.clear();
    const color = ratio > 0.6 ? 0x44cc44 : ratio > 0.3 ? 0xffcc00 : 0xff3333;
    this.patienceBarFill.fillStyle(color, 1);
    this.patienceBarFill.fillRect(-25, 28, 50 * ratio, 7);
  }

  private updateExpression(ratio: number): void {
    if (ratio > 0.6)      this.expressionLabel.setText('😊');
    else if (ratio > 0.3) this.expressionLabel.setText('😐');
    else                  this.expressionLabel.setText('😠');
  }
}
