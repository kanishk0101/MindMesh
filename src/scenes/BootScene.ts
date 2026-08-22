import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // No assets to load
  }

  create() {
    this.scene.start('MenuScene');
  }
}
