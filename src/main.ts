import Phaser from 'phaser';
import { GAME_CONFIG } from './config';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { TitleScene } from './scenes/TitleScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { DailySummaryScene } from './scenes/DailySummaryScene';

const config: Phaser.Types.Core.GameConfig = {
  ...GAME_CONFIG,
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    GameScene,
    UIScene,
    DailySummaryScene,
  ],
};

new Phaser.Game(config);
