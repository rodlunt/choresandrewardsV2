import { useCallback, useRef, useState } from 'react';
import { useSettings } from '@/hooks/use-app-data';
import { isPinGraceActive, markPinVerified } from '@/lib/pin';

// Wraps a parent-only action so it runs immediately when no PIN is set, or
// when the parent verified a PIN recently enough to still be in the grace
// window (see lib/pin.ts), and otherwise pops a PinPromptDialog first. One
// instance per gated site (ChildChoresPage, TotalsPage, ChoresPage,
// SettingsPage each hold their own), all sharing the same in-memory grace
// window so a parent who verified on one page isn't re-prompted on another
// within five minutes.
export function usePinGuard() {
  const { data: settings } = useSettings();
  const [open, setOpen] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);

  const guard = useCallback((action: () => void) => {
    if (!settings?.pinHash || !settings?.pinSalt || isPinGraceActive()) {
      action();
      return;
    }
    pendingAction.current = action;
    setOpen(true);
  }, [settings?.pinHash, settings?.pinSalt]);

  const handleVerified = useCallback(() => {
    markPinVerified();
    setOpen(false);
    const action = pendingAction.current;
    pendingAction.current = null;
    action?.();
  }, []);

  return {
    guard,
    pinPromptProps: {
      open,
      onOpenChange: setOpen,
      onVerified: handleVerified,
      pinHash: settings?.pinHash,
      pinSalt: settings?.pinSalt,
    },
  };
}
