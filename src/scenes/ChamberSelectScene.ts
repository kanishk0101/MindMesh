import Phaser from 'phaser';
import { Button } from '../ui/Button';
import { Campaign } from '../core/Campaign';
import { progressStore } from '../core/storage/ProgressStore';
import { CHAMBERS } from '../data/chambers';

export class ChamberSelectScene extends Phaser.Scene {
  constructor() {
    super('ChamberSelectScene');
  }

  async create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const { width, height } = this.scale;

    const progress = await progressStore.getProgress();
    const completedChambers = progress?.completedChambers || [];
    const currentChamber = progress?.currentChamber || 1;

    // Background
    this.add.rectangle(0, 0, width, height, 0x050505).setOrigin(0);

    // Header
    const totalChambers = Math.max(...CHAMBERS.map(c => c.id));
    const completionPercent = Math.floor((completedChambers.length / totalChambers) * 100);
    const actData = CHAMBERS.find(c => c.id === currentChamber) || CHAMBERS[CHAMBERS.length - 1];
    
    this.add.text(width / 2, 40, 'CHAMBER SELECT', {
      fontFamily: 'sans-serif', fontSize: '32px', color: '#00ffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, 80, `${actData.act.toUpperCase()} | COMPLETION: ${completionPercent}% | ${completedChambers.length} / ${totalChambers}`, {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#aaaaaa', letterSpacing: 2
    }).setOrigin(0.5);

    new Button(this, 80, 40, 'Back', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });

    const acts = [
      { name: 'Act I', chambers: [1, 2, 3, 4, 5] },
      { name: 'Act II', chambers: [6, 7, 8, 9, 10] },
      { name: 'Act III', chambers: [11, 12, 13, 14, 15, 16] },
      { name: 'Act IV', chambers: [17, 18, 19, 20, 21, 22, 23] },
      { name: 'Act V', chambers: [24, 25, 26, 27, 28] }
    ];

    let startY = 160;

    for (const act of acts) {
      this.add.text(width / 2, startY, act.name, {
        fontFamily: 'sans-serif', fontSize: '20px', color: '#ffffff'
      }).setOrigin(0.5);

      const tileWidth = 60;
      const tileSpacing = 20;
      const totalWidth = act.chambers.length * tileWidth + (act.chambers.length - 1) * tileSpacing;
      let currentX = (width - totalWidth) / 2 + tileWidth / 2;

      for (const cId of act.chambers) {
        const isCompleted = completedChambers.includes(cId);
        const isCurrent = cId === currentChamber;
        const isLocked = !isCompleted && !isCurrent;

        const tile = this.add.container(currentX, startY + 50);
        
        let bgColor = 0x222222;
        let strokeColor = 0x444444;
        let textColor = '#555555';

        if (isCompleted) {
          bgColor = 0xffaa00;
          strokeColor = 0xffaa00;
          textColor = '#000000';
        } else if (isCurrent) {
          bgColor = 0x111111;
          strokeColor = 0xffaa00;
          textColor = '#ffaa00';
        }

        const rect = this.add.rectangle(0, 0, tileWidth, tileWidth, bgColor);
        rect.setStrokeStyle(2, strokeColor);
        
        const txt = this.add.text(0, 0, cId.toString(), {
          fontFamily: 'sans-serif', fontSize: '20px', color: textColor, fontStyle: 'bold'
        }).setOrigin(0.5);

        tile.add([rect, txt]);

        if (isLocked) {
          // Add lock icon (simple graphics)
          const g = this.add.graphics();
          g.fillStyle(0x000000, 0.5);
          g.fillRect(-10, 0, 20, 14);
          g.lineStyle(2, 0x000000, 0.5);
          g.beginPath();
          g.arc(0, 0, 6, Math.PI, 0);
          g.strokePath();
          tile.add(g);
        }

        if (isCompleted) {
          // Add checkmark (small)
          const g = this.add.graphics();
          g.lineStyle(2, 0x000000);
          g.beginPath();
          g.moveTo(-10, 10);
          g.lineTo(-5, 18);
          g.lineTo(10, 0);
          g.strokePath();
          tile.add(g);
        }

        if (!isLocked) {
          rect.setInteractive({ useHandCursor: true });
          
          rect.on('pointerover', () => {
            this.tweens.add({ targets: tile, scale: 1.1, duration: 100 });
          });
          
          rect.on('pointerout', () => {
            this.tweens.add({ targets: tile, scale: 1, duration: 100 });
          });
          
          rect.on('pointerdown', () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
              this.scene.start('GameScene', { campaign: new Campaign(cId) });
            });
          });
        }

        if (isCurrent) {
          this.tweens.add({
            targets: rect,
            alpha: 0.6,
            duration: 800,
            yoyo: true,
            repeat: -1
          });
        }

        currentX += tileWidth + tileSpacing;
      }
      
      startY += 120;
    }
  }
}
