export interface AudioSettings {
  music: boolean;
  sfx: boolean;
}

export class SettingsStore {
  private key = 'mindmesh_settings';

  getSettings(): AudioSettings {
    const data = localStorage.getItem(this.key);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error(e);
      }
    }
    return { music: true, sfx: true };
  }

  saveSettings(settings: AudioSettings) {
    localStorage.setItem(this.key, JSON.stringify(settings));
  }
}

export const settingsStore = new SettingsStore();
