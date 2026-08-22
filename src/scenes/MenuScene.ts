import Phaser from 'phaser';
import { Button } from '../ui/Button';
import { Campaign } from '../core/Campaign';
import { progressStore } from '../core/storage/ProgressStore';
import { vestigeStore } from '../core/storage/VestigeStore';
import { analyticsStore } from '../core/storage/AnalyticsStore';
import { CHAMBERS } from '../data/chambers';

export class MenuScene extends Phaser.Scene {
  titleText!: Phaser.GameObjects.Text;
  startBtn!: Button;

  constructor() {
    super('MenuScene');
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const { width, height } = this.scale;

    this.titleText = this.add.text(width / 2, height / 3, 'MindMesh', {
      fontFamily: 'sans-serif',
      fontSize: '64px',
      color: '#00ffff'
    }).setOrigin(0.5);

    let startY = height / 2 + 30;

    this.startBtn = new Button(this, width / 2, startY, 'Continue', async () => {
      try {
        const progress = await progressStore.getProgress();
        let targetChamber = 1;
        if (progress && progress.currentChamber) {
          targetChamber = progress.currentChamber;
        }

        const maxChamber = Math.max(...CHAMBERS.map(c => c.id));
        if (targetChamber > maxChamber) {
          targetChamber = maxChamber;
        }

        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('GameScene', { campaign: new Campaign(targetChamber) });
        });
      } catch (e) {
        console.error('Progress load failed, falling back to Chamber 1:', e);
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('GameScene', { campaign: new Campaign(1) });
        });
      }
    });

    startY += 60;
    
    new Button(this, width / 2, startY, 'Chamber Select', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('ChamberSelectScene');
      });
    });

    startY += 60;
    
    new Button(this, width / 2, startY, 'Settings', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('SettingsScene');
      });
    });

    startY += 60;

    const restartText = this.add.text(width / 2, startY, 'Restart Campaign', {
      fontFamily: 'sans-serif',
      fontSize: '14px',
      color: '#666666'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartText.on('pointerover', () => restartText.setColor('#aaaaaa'));
    restartText.on('pointerout', () => restartText.setColor('#666666'));
    restartText.on('pointerdown', () => this.showConfirmModal());

    this.scale.on('resize', this.resize, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.resize, this));
  }

  showConfirmModal() {
    const { width, height } = this.scale;
    
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
    overlay.setInteractive();
    
    const modal = this.add.container(width / 2, height / 2);
    
    const bg = this.add.rectangle(0, 0, 420, 250, 0x111111);
    bg.setStrokeStyle(1, 0x444444);
    modal.add(bg);
    
    const title = this.add.text(0, -80, 'Restart Campaign?', {
      fontFamily: 'sans-serif',
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    const body = this.add.text(0, -10, 'This will permanently erase your campaign progress, Vestiges, and behavioral history. A new journey will begin from Chamber 1.', {
      fontFamily: 'sans-serif',
      fontSize: '14px',
      color: '#aaaaaa',
      align: 'center',
      wordWrap: { width: 360 }
    }).setOrigin(0.5);
    
    modal.add([title, body]);
    
    const cancelBtn = new Button(this, -100, 80, 'Cancel', () => {
      overlay.destroy();
      modal.destroy();
    }, 160);
    
    const confirmBtn = new Button(this, 100, 80, 'Restart Campaign', async () => {
      await progressStore.clearProgress();
      await vestigeStore.clearAllVestiges();
      await analyticsStore.clearAllReports();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { campaign: new Campaign(1) });
      });
    }, 180);
    
    modal.add(cancelBtn);
    modal.add(confirmBtn);
  }

  resize(gameSize: Phaser.Structs.Size) {
    const { width, height } = gameSize;
    this.titleText.setPosition(width / 2, height / 3);
    this.startBtn.setPosition(width / 2, height / 2 + 50);
  }
}
