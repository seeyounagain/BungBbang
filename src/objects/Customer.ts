import Phaser from 'phaser';
import type { SpawnedCustomer } from '../systems/CustomerSpawnerSystem';
import type { CustomerSpawnerSystem } from '../systems/CustomerSpawnerSystem';
import type { MenuItem } from '../data/menu';

const MENU_FISH_FRAME: Record<MenuItem, string> = {
  red_bean:     'fish-red-bean',
  cream_cheese: 'fish-cream-cheese',
  choux:        'fish-choux',
};

export class CustomerUI extends Phaser.GameObjects.Container {
  private avatarImg!: Phaser.GameObjects.Image;
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
    const cd = this.customerData;
    const frameKey = `cust-${cd.def.type}`;

    // Real character sprite
    this.avatarImg = scene.add.image(0, -4, 'customer-sheet', frameKey);
    this.avatarImg.setDisplaySize(48, 70);

    // Expression emoji overlay
    this.expressionLabel = scene.add.text(20, -36, '😊', {
      fontSize: '12px',
    }).setOrigin(0.5);

    // Patience bar
    this.patienceBarBg = scene.add.graphics();
    this.patienceBarBg.fillStyle(0x000000, 0.6);
    this.patienceBarBg.fillRoundedRect(-25, 32, 50, 7, 2);

    this.patienceBarFill = scene.add.graphics();

    // Name label
    const nameLabel = scene.add.text(0, 42, cd.def.name, {
      fontSize: '8px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 0);

    // Order speech bubble
    this.orderBubble = scene.add.container(-28, -58);
    const bubbleBg = scene.add.graphics();
    bubbleBg.fillStyle(0xfffff0, 0.95);
    bubbleBg.fillRoundedRect(0, 0, 34, 34, 7);
    bubbleBg.lineStyle(2, 0x886644, 1);
    bubbleBg.strokeRoundedRect(0, 0, 34, 34, 7);
    // Speech tail
    bubbleBg.fillStyle(0xfffff0, 0.95);
    bubbleBg.fillTriangle(8, 34, 16, 34, 10, 44);

    const fishFrame = MENU_FISH_FRAME[cd.order];
    const orderIcon = scene.add.image(17, 16, 'fish-sheet', fishFrame);
    orderIcon.setDisplaySize(26, 26);

    this.orderBubble.add([bubbleBg, orderIcon]);

    this.add([this.avatarImg, this.expressionLabel, this.patienceBarBg, this.patienceBarFill, nameLabel, this.orderBubble]);

    if (cd.type === 'vip') {
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
    this.patienceBarFill.fillRoundedRect(-25, 32, 50 * ratio, 7, 2);
  }

  private updateExpression(ratio: number): void {
    if (ratio > 0.6)      this.expressionLabel.setText('😊');
    else if (ratio > 0.3) this.expressionLabel.setText('😐');
    else                  this.expressionLabel.setText('😠');
  }
}
