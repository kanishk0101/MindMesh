import Phaser from 'phaser';

export class Button extends Phaser.GameObjects.Container {
  bg: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, label: string, onClick: () => void, width: number = 160) {
    super(scene, x, y);

    this.bg = scene.add.rectangle(0, 0, width, 50, 0x222222);
    this.bg.setStrokeStyle(2, 0x555555);
    this.bg.setInteractive({ useHandCursor: true });

    this.text = scene.add.text(0, 0, label, {
      fontFamily: 'sans-serif',
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add(this.bg);
    this.add(this.text);

    this.bg.on('pointerover', () => this.bg.setFillStyle(0x333333));
    this.bg.on('pointerout', () => this.bg.setFillStyle(0x222222));
    this.bg.on('pointerdown', () => this.bg.setFillStyle(0x111111));
    this.bg.on('pointerup', () => {
      this.bg.setFillStyle(0x333333);
      onClick();
    });

    scene.add.existing(this);
  }
}
