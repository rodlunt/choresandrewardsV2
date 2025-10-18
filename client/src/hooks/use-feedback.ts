import { useEffect } from 'react';
import { hapticsManager } from '@/lib/haptics';
import { useSettings } from './use-app-data';
// @ts-ignore
import confetti from 'canvas-confetti';

export function useFeedback() {
  const { data: settings } = useSettings();

  useEffect(() => {
    if (settings) {
      hapticsManager.setEnabled(settings.haptics);
    }
  }, [settings]);

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
    await completeHaptic();
  };

  const payoutFeedback = async () => {
    await payoutHaptic();
    showConfetti();
  };

  return {
    choreFeedback,
    payoutFeedback,
    completeHaptic,
    payoutHaptic,
    showConfetti,
  };
}
