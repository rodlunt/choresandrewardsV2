export class AudioManager {
  private completeSound: HTMLAudioElement | null = null;
  private payoutSound: HTMLAudioElement | null = null;
  private enabled: boolean = true;

  constructor() {
    this.initializeSounds();
  }

  private initializeSounds() {
    try {
      this.completeSound = new Audio('/sounds/complete.mp3');
      this.payoutSound = new Audio('/sounds/payout.mp3');
      
      // Preload sounds
      this.completeSound.preload = 'auto';
      this.payoutSound.preload = 'auto';
      
      // Set volume
      this.completeSound.volume = 0.7;
      this.payoutSound.volume = 0.8;
    } catch (error) {
      console.warn('Failed to initialize audio:', error);
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  async playComplete() {
    if (!this.enabled || !this.completeSound) return;
    
    try {
      this.completeSound.currentTime = 0;
      await this.completeSound.play();
    } catch (error) {
      console.warn('Failed to play complete sound:', error);
    }
  }

  async playPayout() {
    if (!this.enabled || !this.payoutSound) return;
    
    try {
      this.payoutSound.currentTime = 0;
      await this.payoutSound.play();
    } catch (error) {
      console.warn('Failed to play payout sound:', error);
    }
  }
}

export const audioManager = new AudioManager();
