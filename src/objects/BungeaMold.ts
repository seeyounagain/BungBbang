import Phaser from 'phaser';
import { MoldState, canTransition, type BakingQuality } from '../data/types';
import { BAKING, POURING_DURATION_MS, CLEANING_DURATION_MS } from '../data/balance';
import type { MenuItem } from '../data/menu';

export class BungeaMold extends Phaser.GameObjects.Container {
  state: MoldState = MoldState.Empty;
  progress = 0;
  quality: BakingQuality | null = null;
  currentMenu: MenuItem | null = null;

  private stateImage!: Phaser.GameObjects.Image;
  private progressBg!: Phaser.GameObjects.Graphics;
  private progressBar!: Phaser.GameObjects.Graphics;
  private stateLabel!: Phaser.GameObjects.Text;
  private cookTimer: Phaser.Time.TimerEvent | null = null;
  private progressTween: Phaser.Tweens.Tween | null = null;

  readonly moldId: number;
  readonly events = new Phaser.Events.EventEmitter();

  constructor(scene: Phaser.Scene, x: number, y: number, moldId: number) {
    super(scene, x, y);
    this.moldId = moldId;
    this.buildVisuals(scene);
    scene.add.existing(this);
    this.setSize(82, 100);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerdown', this.onTap, this);
  }

  private buildVisuals(scene: Phaser.Scene): void {
    // Single image that switches frames based on mold state
    this.stateImage = scene.add.image(0, -6, 'mold-empty');
    this.stateImage.setDisplaySize(82, 88);

    // Progress bar background
    this.progressBg = scene.add.graphics();
    this.progressBg.fillStyle(0x000000, 0.5);
    this.progressBg.fillRoundedRect(-28, 38, 56, 8, 3);

    // Progress bar fill
    this.progressBar = scene.add.graphics();

    // State label (below image)
    this.stateLabel = scene.add.text(0, 50, '', {
      fontSize: '9px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 0);

    this.add([this.stateImage, this.progressBg, this.progressBar, this.stateLabel]);
    this.updateVisuals();
  }

  private onTap(): void {
    switch (this.state) {
      case MoldState.Empty:
        this.events.emit('request-pour', this);
        break;
      case MoldState.Baking:
      case MoldState.Flipped:
        this.onFlip();
        break;
      case MoldState.Done:
        this.events.emit('request-serve', this);
        break;
      case MoldState.Burnt:
        this.startCleaning();
        break;
    }
  }

  startPouring(menu: MenuItem): boolean {
    if (!canTransition(this.state, MoldState.Pouring)) return false;
    this.currentMenu = menu;
    this.state = MoldState.Pouring;
    this.progress = 0;
    this.quality = null;
    this.updateVisuals();
    this.events.emit('audio', 'flip');

    this.cookTimer = this.scene.time.delayedCall(POURING_DURATION_MS, () => {
      this.startBaking();
    });
    return true;
  }

  private startBaking(): void {
    if (!canTransition(this.state, MoldState.Baking)) return;
    this.state = MoldState.Baking;
    this.progress = 0;
    this.updateVisuals();

    this.progressTween = this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: BAKING.totalDuration,
      onUpdate: (tween) => {
        this.progress = tween.getValue() ?? 0;
        this.updateBakingFrame();
        this.updateProgressBar();
        if (this.progress >= 1.0 && this.state === MoldState.Baking) {
          this.autoBurnt();
        }
        if (this.progress >= 1.0 && this.state === MoldState.Flipped) {
          this.autoBurnt();
        }
      },
    });
  }

  onFlip(): BakingQuality | null {
    if (this.state === MoldState.Flipped) {
      const isBurnt = this.progress >= BAKING.flippedDoneAt;
      if (isBurnt) {
        this.autoBurnt();
        return 'BURNT';
      } else {
        this.transitionTo(MoldState.Done);
        this.stopProgressTween();
        this.events.emit('state-changed', this, MoldState.Done);
        return this.quality;
      }
    }

    if (!canTransition(this.state, MoldState.Flipped)) return null;

    const p = this.progress;
    const z = BAKING.flipZones;
    let quality: BakingQuality;

    if      (p >= z.perfect.min    && p < z.perfect.max)    quality = 'PERFECT';
    else if (p >= z.good_early.min && p < z.good_early.max) quality = 'GOOD';
    else if (p >= z.good_late.min  && p < z.good_late.max)  quality = 'GOOD';
    else if (p < z.under.max)                                quality = 'UNDER';
    else                                                     quality = 'BURNT';

    this.quality = quality;
    this.transitionTo(MoldState.Flipped);
    this.events.emit('flipped', this, quality);
    this.events.emit('audio', 'flip');
    if (quality === 'PERFECT') this.events.emit('audio', 'perfect');
    return quality;
  }

  private autoBurnt(): void {
    if (this.state === MoldState.Burnt) return;
    this.stopProgressTween();
    this.progress = 1.0;
    this.quality = 'BURNT';
    this.state = MoldState.Burnt;
    this.cookTimer?.remove();
    this.updateVisuals();
    this.events.emit('state-changed', this, MoldState.Burnt);
    this.events.emit('audio', 'burnt');
  }

  forceBurnt(): void {
    if (this.state === MoldState.Burnt || this.state === MoldState.Empty) return;
    this.stopProgressTween();
    this.cookTimer?.remove();
    this.progress = 1.0;
    this.quality = 'BURNT';
    this.state = MoldState.Burnt;
    this.updateVisuals();
    this.events.emit('state-changed', this, MoldState.Burnt);
  }

  startServing(): void {
    if (!canTransition(this.state, MoldState.Serving)) return;
    this.transitionTo(MoldState.Serving);
    this.scene.time.delayedCall(300, () => {
      this.transitionTo(MoldState.Empty);
      this.currentMenu = null;
      this.quality = null;
      this.progress = 0;
      this.updateVisuals();
      this.events.emit('state-changed', this, MoldState.Empty);
    });
  }

  private startCleaning(): void {
    if (!canTransition(this.state, MoldState.Cleaning)) return;
    this.transitionTo(MoldState.Cleaning);
    this.scene.time.delayedCall(CLEANING_DURATION_MS, () => {
      this.transitionTo(MoldState.Empty);
      this.currentMenu = null;
      this.quality = null;
      this.progress = 0;
      this.updateVisuals();
      this.events.emit('state-changed', this, MoldState.Empty);
    });
  }

  private transitionTo(next: MoldState): void {
    this.state = next;
    this.updateVisuals();
  }

  private stopProgressTween(): void {
    if (this.progressTween) {
      this.progressTween.stop();
      this.progressTween = null;
    }
  }

  private updateBakingFrame(): void {
    if (this.state === MoldState.Flipped) {
      this.stateImage.setTexture('mold-done');
      return;
    }
    if (this.state !== MoldState.Baking) return;
    const p = this.progress;
    if (p < 0.30) {
      this.stateImage.setTexture('mold-batter');
    } else if (p < 0.65) {
      this.stateImage.setTexture('mold-baking1');
    } else {
      this.stateImage.setTexture('mold-baking2');
    }
  }

  private updateProgressBar(): void {
    this.progressBar.clear();
    if (this.state !== MoldState.Baking && this.state !== MoldState.Flipped) return;

    const p = Math.min(this.progress, 1);
    let color = 0x44dd44;
    if (p >= 0.85 && p < 0.95) color = 0xffdd00;
    else if (p >= 0.95) color = 0xff4444;

    this.progressBar.fillStyle(color, 1);
    this.progressBar.fillRoundedRect(-28, 38, 56 * p, 8, 3);
  }

  private updateVisuals(): void {
    const isBaking = this.state === MoldState.Baking || this.state === MoldState.Flipped;
    this.progressBg.setVisible(isBaking);
    this.progressBar.setVisible(isBaking);

    switch (this.state) {
      case MoldState.Empty:
        this.stateImage.setTexture('mold-empty');
        this.stateLabel.setText('탭하여\n시작');
        this.stateLabel.setColor('#aaaaaa');
        break;
      case MoldState.Pouring:
        this.stateImage.setTexture('mold-pouring');
        this.stateLabel.setText('반죽중...');
        this.stateLabel.setColor('#88ccff');
        break;
      case MoldState.Baking:
        this.updateBakingFrame();
        this.stateLabel.setText('뒤집기!');
        this.stateLabel.setColor('#ffee44');
        break;
      case MoldState.Flipped:
        this.stateImage.setTexture('mold-done');
        this.stateLabel.setText('꺼내기!');
        this.stateLabel.setColor('#44ffaa');
        break;
      case MoldState.Done:
        this.stateImage.setTexture(this.quality === 'PERFECT' ? 'mold-perfect' : 'mold-done');
        this.stateLabel.setText('납품!');
        this.stateLabel.setColor('#ffdd00');
        break;
      case MoldState.Burnt:
        this.stateImage.setTexture('mold-burnt');
        this.stateLabel.setText('탄빵\n치우기');
        this.stateLabel.setColor('#ff6666');
        break;
      case MoldState.Cleaning:
        this.stateImage.setTexture('mold-cleaning');
        this.stateLabel.setText('청소중...');
        this.stateLabel.setColor('#aaaaaa');
        break;
      default:
        this.stateLabel.setText('');
    }
  }
}
