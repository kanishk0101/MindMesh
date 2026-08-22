import Phaser from 'phaser';
import { Button } from '../ui/Button';
import { settingsStore } from '../core/storage/SettingsStore';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('SettingsScene');
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, 0x050505).setOrigin(0);

    this.add.text(width / 2, 60, 'SETTINGS', {
      fontFamily: 'sans-serif', fontSize: '32px', color: '#00ffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    const settings = settingsStore.getSettings();

    const musicBtn = new Button(this, width / 2, height / 2 - 60, `Music: ${settings.music ? 'ON' : 'OFF'}`, () => {
      settings.music = !settings.music;
      settingsStore.saveSettings(settings);
      musicBtn.text.setText(`Music: ${settings.music ? 'ON' : 'OFF'}`);
    });

    const sfxBtn = new Button(this, width / 2, height / 2, `SFX: ${settings.sfx ? 'ON' : 'OFF'}`, () => {
      settings.sfx = !settings.sfx;
      settingsStore.saveSettings(settings);
      sfxBtn.text.setText(`SFX: ${settings.sfx ? 'ON' : 'OFF'}`);
    });

    this.add.text(width / 2, height / 2 + 80, 'Credits:\nCreated for the Advanced Agentic Coding Hackathon', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#888888', align: 'center'
    }).setOrigin(0.5);

    new Button(this, 80, 40, 'Back', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });
  }
}
