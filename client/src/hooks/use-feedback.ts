import { useEffect } from 'react';
import { audioManager } from '@/lib/audio';
import { hapticsManager } from '@/lib/haptics';
import { useSettings } from './use-app-data';
// @ts-ignore
import confetti from 'canvas-confetti';

export function useFeedback() {
  const { data: settings } = useSettings();

  useEffect(() => {
    if (settings) {
      audioManager.setEnabled(settings.sounds);
      hapticsManager.setEnabled(settings.haptics);
    }
  }, [settings]);

  const playCompleteSound = async () => {
    if (settings?.sounds) {
      await audioManager.playComplete();
    }
  };

  const playPayoutSound = async () => {
    if (settings?.sounds) {
      await audioManager.playPayout();
    }
  };

  const completeHaptic = async () => {
    if (settings?.haptics) {
      await hapticsManager.completeHaptic();
    }
  };

  const payoutHaptic = async () => {
    if (settings?.haptics) {
      await hapticsManager.payoutHaptic();
    }
  };

  const showConfetti = () => {
    if (!settings?.confetti) return;

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F43F5E', '#14B8A6', '#FACC15', '#3B82F6']
    });
  };

  const choreFeedback = async () => {
    await Promise.all([
      playCompleteSound(),
      completeHaptic(),
    ]);
  };

  const payoutFeedback = async () => {
    await Promise.all([
      playPayoutSound(),
      payoutHaptic(),
    ]);
    showConfetti();
  };

  return {
    choreFeedback,
    payoutFeedback,
    playCompleteSound,
    playPayoutSound,
    completeHaptic,
    payoutHaptic,
    showConfetti,
  };
}
