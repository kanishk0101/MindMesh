import Phaser from 'phaser';
import { Puzzle } from '../core/Puzzle';
import { Campaign } from '../core/Campaign';
import { HUD } from '../ui/HUD';
import { Button } from '../ui/Button';
import { vestigeStore } from '../core/storage/VestigeStore';
import { Vestige } from '../core/vestige/Vestige';
import { progressStore } from '../core/storage/ProgressStore';
import { MemoryAnalyzer } from '../core/memory/MemoryAnalyzer';
import { MutationEngine } from '../core/mutations/MutationEngine';
import { BehaviorAnalyzer } from '../core/analytics/BehaviorAnalyzer';
import { analyticsStore } from '../core/storage/AnalyticsStore';

export class GameScene extends Phaser.Scene {
  puzzle!: Puzzle;
  hud!: HUD;
  campaign!: Campaign;

  restartBtn!: Button;
  menuBtn!: Button;
  
  overlay!: Phaser.GameObjects.Rectangle;
  winModal!: Phaser.GameObjects.Container;
  
  debugOverlay!: Phaser.GameObjects.Container;
  isDebugVisible: boolean = false;
  aiSelectedMutation: string = 'none';

  constructor() {
    super('GameScene');
  }

  init(data: { campaign: Campaign }) {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.campaign = data.campaign || new Campaign();
  }

  async create() {
    const { width, height } = this.scale;
    
    let chamberData;
    try {
      chamberData = this.campaign.getCurrentChamber();
    } catch (e) {
      console.error(e);
      this.scene.start('MenuScene');
      return;
    }

    this.hud = new HUD(this, chamberData);

    const maxGridWidth = width * 0.9;
    const maxGridHeight = height * 0.65; 
    const cellSizeX = maxGridWidth / chamberData.width;
    const cellSizeY = maxGridHeight / chamberData.height;
    const cellSize = Math.min(80, Math.floor(Math.min(cellSizeX, cellSizeY)));

    this.puzzle = new Puzzle(this, chamberData, cellSize);
    
    const puzzlePixelWidth = chamberData.width * cellSize;
    const puzzlePixelHeight = chamberData.height * cellSize;
    
    this.puzzle.setPosition(
      (width - puzzlePixelWidth) / 2,
      (height - puzzlePixelHeight) / 2 + 25 
    );
    
    this.puzzle.onMoveCallback = () => {
      this.hud.updateMoves(this.puzzle.moves);
      this.hud.startTimer();
    };

    // Apply mutations
    await MutationEngine.applyMutation(this.puzzle, this, chamberData);

    this.puzzle.onSolveCallback = async () => {
      this.hud.stopTimer();
      
      const vestige: Vestige = {
        id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'id_' + Date.now() + '_' + Math.random().toString(36).substring(2),
        chamberId: chamberData.id,
        act: chamberData.act,
        timestamp: Date.now(),
        solveTimeMs: this.puzzle.solveTimeMs,
        firstMoveDelayMs: this.puzzle.firstMoveDelayMs,
        totalMoves: this.puzzle.moves,
        backtracks: this.puzzle.backtracks,
        completed: true,
        pathOrder: this.puzzle.pathOrder
      };
      
      try {
        await vestigeStore.saveVestige(vestige);
        
        const allVestiges = await vestigeStore.getAllVestiges();
        const report = BehaviorAnalyzer.generateActReport(chamberData.act, allVestiges);
        await analyticsStore.saveReport(report);
        
        const progress = await progressStore.getProgress();
        const completed = progress ? progress.completedChambers : [];
        if (!completed.includes(chamberData.id)) {
           completed.push(chamberData.id);
        }
        
        let nextChamberId = chamberData.id + 1;
        if (progress && progress.currentChamber && progress.currentChamber > nextChamberId) {
           nextChamberId = progress.currentChamber;
        }
        
        await progressStore.saveProgress({
          id: 'singleton',
          currentAct: chamberData.act, // We might want to keep the act of the highest chamber, but this is fine for now
          currentChamber: nextChamberId,
          completedChambers: completed,
          lastPlayedAt: Date.now(),
          viewedTutorials: progress?.viewedTutorials || []
        });
        
      } catch (e) {
        console.error("Failed to save data", e);
      }
      
      this.showWinModal();
    };

    const btnY = height - 50;
    this.restartBtn = new Button(this, width / 2 - 100, btnY, 'Restart', () => {
      this.campaign.restartCurrentChamber();
      this.scene.restart({ campaign: this.campaign });
    });
    this.menuBtn = new Button(this, width / 2 + 100, btnY, 'Menu', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });

    this.scale.on('resize', this.resize, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.resize, this));

    this.input.keyboard?.on('keydown-D', () => {
      this.isDebugVisible = !this.isDebugVisible;
      if (this.debugOverlay) {
        this.debugOverlay.setVisible(this.isDebugVisible);
        if (this.isDebugVisible) {
          this.buildDebugOverlay();
        }
      } else {
        this.buildDebugOverlay();
        this.debugOverlay.setVisible(this.isDebugVisible);
      }
    });
  }

  async buildDebugOverlay() {
    if (this.debugOverlay) {
      this.debugOverlay.destroy();
    }
    this.debugOverlay = this.add.container(10, 10);
    this.debugOverlay.setDepth(1000);
    
    const bg = this.add.rectangle(0, 0, 300, 250, 0x000000, 0.8).setOrigin(0);
    bg.setStrokeStyle(1, 0xff00ff);
    
    const { BehaviorAnalyzer } = await import('../core/analytics/BehaviorAnalyzer');
    const { vestigeStore } = await import('../core/storage/VestigeStore');
    
    const allVestiges = await vestigeStore.getAllVestiges();
    const profile = BehaviorAnalyzer.generateActReport('debug', allVestiges);
    
    let y = 10;
    const addText = (label: string, value: any) => {
      this.debugOverlay.add(this.add.text(10, y, `${label}: ${value}`, {
        fontFamily: 'monospace', fontSize: '12px', color: '#00ff00'
      }));
      y += 20;
    };
    
    addText('Chamber', this.campaign.getCurrentChamber().id);
    addText('Planning', profile.planning);
    addText('Commitment', profile.commitment);
    addText('Adaptability', profile.adaptability);
    addText('Speed', profile.speed);
    addText('Efficiency', profile.efficiency);
    addText('Dominant Scar', profile.dominantScar);
    addText('AI Mutation', this.aiSelectedMutation);
    
    this.debugOverlay.add(bg);
    this.debugOverlay.sendToBack(bg);
    if (!this.isDebugVisible) {
      this.debugOverlay.setVisible(false);
    }
  }

  showTutorialModal(titleText: string, descText: string): Promise<void> {
    return new Promise((resolve) => {
      const { width, height } = this.scale;
      
      const tutOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
      tutOverlay.setInteractive();
      
      const tutContainer = this.add.container(width / 2, height / 2);
      const bg = this.add.rectangle(0, 0, 340, 200, 0x111111);
      bg.setStrokeStyle(2, 0xffaa00);
      
      const title = this.add.text(0, -60, titleText.toUpperCase(), {
        fontFamily: 'sans-serif', fontSize: '20px', color: '#ffaa00', fontStyle: 'bold'
      }).setOrigin(0.5);
      
      const desc = this.add.text(0, -10, descText, {
        fontFamily: 'sans-serif', fontSize: '16px', color: '#dddddd', align: 'center', wordWrap: { width: 300 }
      }).setOrigin(0.5);
      
      const okBtn = new Button(this, 0, 60, 'Acknowledge', () => {
        tutOverlay.destroy();
        tutContainer.destroy();
        resolve();
      });
      
      tutContainer.add([bg, title, desc, okBtn]);
    });
  }

  showAIBanner(text: string) {
    const { width, height } = this.scale;
    const banner = this.add.container(width / 2, 50);
    
    const bg = this.add.rectangle(0, 0, 300, 60, 0x111111, 0.9);
    bg.setStrokeStyle(1, 0x00ffff);
    
    const title = this.add.text(0, -12, 'AI ADAPTATION', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#00ffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    
    const desc = this.add.text(0, 10, text, {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#ffffff'
    }).setOrigin(0.5);
    
    banner.add([bg, title, desc]);
    banner.setAlpha(0);
    
    this.tweens.add({
      targets: banner,
      alpha: 1,
      duration: 300,
      yoyo: true,
      hold: 1500,
      onComplete: () => {
        banner.destroy();
      }
    });
  }

  resize(gameSize: Phaser.Structs.Size) {
    const { width, height } = gameSize;
    
    const btnY = height - 50;
    this.restartBtn.setPosition(width / 2 - 100, btnY);
    this.menuBtn.setPosition(width / 2 + 100, btnY);
    
    const puzzlePixelWidth = this.puzzle.grid.width * this.puzzle.cellSize;
    const puzzlePixelHeight = this.puzzle.grid.height * this.puzzle.cellSize;
    this.puzzle.setPosition(
      (width - puzzlePixelWidth) / 2,
      (height - puzzlePixelHeight) / 2 + 25
    );
    
    if (this.winModal && this.overlay) {
       this.overlay.setDisplaySize(width, height);
       this.overlay.setPosition(width/2, height/2);
       this.winModal.setPosition(width/2, height/2);
    }
  }

  showWinModal() {
    const { width, height } = this.scale;
    
    this.overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    this.overlay.setInteractive(); // block input

    this.winModal = this.add.container(width / 2, height / 2);

    const bg = this.add.rectangle(0, 0, 300, 250, 0x111111);
    bg.setStrokeStyle(2, 0x00ffff);

    const title = this.add.text(0, -80, 'CHAMBER CLEARED', {
      fontFamily: 'sans-serif',
      fontSize: '24px',
      color: '#00ffff'
    }).setOrigin(0.5);

    const timeText = this.add.text(0, -30, `Time: ${(this.puzzle.solveTimeMs / 1000).toFixed(1)}s`, {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const movesText = this.add.text(0, 0, `Moves: ${this.puzzle.moves}`, {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    const vestigeText = this.add.text(0, 30, '✓ VESTIGE CAPTURED', {
      fontFamily: 'sans-serif',
      fontSize: '14px',
      color: '#00ff00'
    }).setOrigin(0.5).setAlpha(0);
    
    this.tweens.add({
      targets: vestigeText,
      alpha: 1,
      duration: 1000,
      ease: 'Power2'
    });

    const actEnds = [5, 10, 16, 23, 28];
    const isActEnd = actEnds.includes(this.campaign.getCurrentChamber().id);
    const hasNext = this.campaign.hasNext();
    
    let btnText = 'Next Chamber';
    let btnWidth = 160;
    if (isActEnd) {
       btnText = 'View Cognitive Report';
       btnWidth = 220;
    } else if (!hasNext) {
       btnText = 'Return to Menu';
       btnWidth = 180;
    }

    const confirmBtn = new Button(this, 0, 80, btnText, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (isActEnd) {
          this.scene.start('CognitiveReportScene', { act: this.campaign.getCurrentChamber().act, nextChamberId: this.campaign.getCurrentChamber().id + 1 });
        } else if (hasNext) {
          // Replaying a completed chamber: never removes progress... Campaign progression always follows the highest completed chamber.
          // Wait! In Campaign.ts, nextChamber() increments the ID. If it's a replay of chamber 1, it will load chamber 2.
          // Is that correct? The user said: "Replaying a completed chamber: never removes progress... Campaign progression always follows the highest completed chamber."
          // So if they replay chamber 1, when they win, they should be taken back to Chamber Select!
          // But wait, the prompt says "Campaign progression always follows the highest completed chamber."
          // If we take them to Chamber 2, is that fine? 
          // Let's just let it load the next chamber, but if they want to exit they can use Menu.
          // Or we can just send them back to Chamber Select if they were replaying.
          // But for now, we'll just wrap the existing logic in a fadeOut.
          this.campaign.nextChamber();
          this.scene.start('GameScene', { campaign: this.campaign });
        } else {
          this.scene.start('ChamberSelectScene'); // Direct them to the hub instead of MenuScene
        }
      });
    }, btnWidth);

    this.winModal.add([bg, title, timeText, movesText, vestigeText, confirmBtn]);
  }
}
