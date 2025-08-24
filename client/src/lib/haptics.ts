export class HapticsManager {
  private enabled: boolean = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  async vibrate(pattern: number | number[] = 50) {
    if (!this.enabled || !navigator.vibrate) return;
    
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Failed to vibrate:', error);
    }
  }

  async completeHaptic() {
    await this.vibrate([50, 30, 50]);
  }

  async payoutHaptic() {
    await this.vibrate([100, 50, 100, 50, 200]);
  }
}

export const hapticsManager = new HapticsManager();
