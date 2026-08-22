import Phaser from 'phaser';
import { Button } from '../ui/Button';
import { analyticsStore, ActReport } from '../core/storage/AnalyticsStore';
import { Campaign } from '../core/Campaign';

export class CognitiveReportScene extends Phaser.Scene {
  act!: string;
  nextChamberId!: number;
  report!: ActReport;

  constructor() {
    super('CognitiveReportScene');
  }

  init(data: { act: string, nextChamberId: number }) {
    this.act = data.act;
    this.nextChamberId = data.nextChamberId;
  }

  async create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const { width, height } = this.scale;

    try {
      const rep = await analyticsStore.getReport(this.act);
      if (!rep) throw new Error("Report not found");
      this.report = rep;
    } catch (e) {
      console.error(e);
      this.scene.start('MenuScene');
      return;
    }

    // BG
    this.add.rectangle(0, 0, width, height, 0x050505).setOrigin(0);

    // Title
    this.add.text(width / 2, 50, `${this.act.toUpperCase()} COGNITIVE REPORT`, {
      fontFamily: 'sans-serif',
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Draw Radar Chart (Left Side)
    const centerX = width / 3;
    const centerY = height / 2;
    const radius = 100;

    const radarGraphics = this.add.graphics();
    
    // Draw background pentagon
    radarGraphics.lineStyle(2, 0x333333);
    radarGraphics.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i / 5) - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      if (i === 0) radarGraphics.moveTo(x, y);
      else radarGraphics.lineTo(x, y);
    }
    radarGraphics.closePath();
    radarGraphics.strokePath();

    // Axes
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i / 5) - Math.PI / 2;
      radarGraphics.moveTo(centerX, centerY);
      radarGraphics.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
    }
    radarGraphics.strokePath();

    // Labels for Radar
    const labels = ['Planning', 'Commitment', 'Adaptability', 'Speed', 'Efficiency'];
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i / 5) - Math.PI / 2;
      const x = centerX + Math.cos(angle) * (radius + 35);
      const y = centerY + Math.sin(angle) * (radius + 35);
      this.add.text(x, y, labels[i], { fontSize: '12px', color: '#aaaaaa' }).setOrigin(0.5);
    }

    // Animated polygon
    const polyGraphics = this.add.graphics();
    
    // Right side: Progress bars
    const rightX = width * 2 / 3 - 60;
    const startY = height / 2 - 80;
    
    const stats = [
      { name: 'Planning', target: this.report.planning, angle: -Math.PI / 2 },
      { name: 'Commitment', target: this.report.commitment, angle: -Math.PI / 2 + (Math.PI * 2 / 5) },
      { name: 'Adaptability', target: this.report.adaptability, angle: -Math.PI / 2 + (Math.PI * 2 * 2 / 5) },
      { name: 'Speed', target: this.report.speed, angle: -Math.PI / 2 + (Math.PI * 2 * 3 / 5) },
      { name: 'Efficiency', target: this.report.efficiency, angle: -Math.PI / 2 + (Math.PI * 2 * 4 / 5) }
    ];

    const barGraphics = this.add.graphics();
    const texts: Phaser.GameObjects.Text[] = [];
    
    stats.forEach((stat, i) => {
      this.add.text(rightX, startY + i * 40, stat.name, { fontSize: '14px', color: '#ffffff' }).setOrigin(1, 0.5);
      const valText = this.add.text(rightX + 180, startY + i * 40, '0', { fontSize: '14px', color: '#00ffff' }).setOrigin(0, 0.5);
      texts.push(valText);
    });

    // Dominant Scar
    const scarText = this.add.text(width / 2, height - 120, `DOMINANT SCAR:\n${this.report.dominantScar.toUpperCase()}`, {
      fontSize: '20px', color: '#ff5555', align: 'center'
    }).setOrigin(0.5).setAlpha(0);

    // Animation Tween
    const animObj = { val: 0 };
    this.tweens.add({
      targets: animObj,
      val: 1,
      duration: 1500,
      ease: 'Power2',
      onUpdate: () => {
        polyGraphics.clear();
        polyGraphics.fillStyle(0xff8800, 0.4);
        polyGraphics.lineStyle(2, 0xffaa00);
        polyGraphics.beginPath();
        
        barGraphics.clear();

        stats.forEach((stat, i) => {
          const currentVal = stat.target * animObj.val;
          
          // Radar
          const dist = (currentVal / 100) * radius;
          const x = centerX + Math.cos(stat.angle) * dist;
          const y = centerY + Math.sin(stat.angle) * dist;
          
          if (i === 0) polyGraphics.moveTo(x, y);
          else polyGraphics.lineTo(x, y);
          
          // Bars
          barGraphics.fillStyle(0x222222);
          barGraphics.fillRect(rightX + 20, startY + i * 40 - 10, 150, 20);
          
          barGraphics.fillStyle(0xff8800);
          barGraphics.fillRect(rightX + 20, startY + i * 40 - 10, 150 * (currentVal / 100), 20);
          
          texts[i].setText(Math.round(currentVal).toString());
        });
        
        polyGraphics.closePath();
        polyGraphics.fillPath();
        polyGraphics.strokePath();
      },
      onComplete: () => {
        // Show Scar
        this.tweens.add({
          targets: scarText,
          alpha: 1,
          duration: 500,
          onComplete: () => {
            // Show Continue Button
            new Button(this, width / 2, height - 50, 'Continue', () => {
              this.cameras.main.fadeOut(300, 0, 0, 0);
              this.cameras.main.once('camerafadeoutcomplete', () => {
                if (this.nextChamberId <= 28) {
                  this.scene.start('GameScene', { campaign: new Campaign(this.nextChamberId) });
                } else {
                  this.scene.start('ChamberSelectScene');
                }
              });
            }, 180);
          }
        });
      }
    });
  }
}
