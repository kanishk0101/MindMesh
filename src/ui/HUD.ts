import Phaser from 'phaser';

export class HUD extends Phaser.GameObjects.Container {
  topBar: Phaser.GameObjects.Rectangle;
  levelText: Phaser.GameObjects.Text;
  movesText: Phaser.GameObjects.Text;
  timerText: Phaser.GameObjects.Text;
  title: Phaser.GameObjects.Text;
  
  timeElapsed: number = 0;
  timerEvent?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, chamber: import('../data/chambers').ChamberData) {
    super(scene, 0, 0);

    const { width } = scene.scale;

    this.topBar = scene.add.rectangle(width / 2, 35, width, 70, 0x111111);
    this.add(this.topBar);

    this.title = scene.add.text(20, 35, 'MindMesh', {
      fontFamily: 'sans-serif',
      fontSize: '24px',
      color: '#00ffff'
    }).setOrigin(0, 0.5);
    this.add(this.title);

    this.levelText = scene.add.text(width / 2, 20, `${chamber.act} · Chamber ${chamber.id}`, {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const chamberTitle = scene.add.text(width / 2, 45, chamber.title, {
      fontFamily: 'sans-serif',
      fontSize: '14px',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    this.movesText = scene.add.text(width - 20, 20, 'Moves: 0', {
      fontFamily: 'sans-serif',
      fontSize: '16px',
      color: '#aaaaaa'
    }).setOrigin(1, 0.5);

    this.timerText = scene.add.text(width - 20, 45, 'Time: 0:00', {
      fontFamily: 'sans-serif',
      fontSize: '16px',
      color: '#aaaaaa'
    }).setOrigin(1, 0.5);

    this.add(this.levelText);
    this.add(chamberTitle);
    this.add(this.movesText);
    this.add(this.timerText);

    scene.add.existing(this);

    this.timerEvent = scene.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeElapsed++;
        this.updateTime();
      },
      loop: true,
      paused: true
    });

    scene.scale.on('resize', this.resize, this);
    scene.events.once('shutdown', () => scene.scale.off('resize', this.resize, this));
  }

  resize(gameSize: Phaser.Structs.Size) {
    const { width } = gameSize;
    this.topBar.width = width;
    this.topBar.x = width / 2;
    this.levelText.x = width / 2;
    this.movesText.x = width - 20;
    this.timerText.x = width - 20;
  }

  updateMoves(moves: number) {
    this.movesText.setText(`Moves: ${moves}`);
  }

  startTimer() {
    if (this.timerEvent && this.timerEvent.paused) {
      this.timerEvent.paused = false;
    }
  }

  updateTime() {
    const m = Math.floor(this.timeElapsed / 60);
    const s = this.timeElapsed % 60;
    this.timerText.setText(`Time: ${m}:${s.toString().padStart(2, '0')}`);
  }

  stopTimer() {
    if (this.timerEvent) {
      this.timerEvent.remove();
    }
  }

  getFormattedTime(): string {
    const m = Math.floor(this.timeElapsed / 60);
    const s = this.timeElapsed % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
