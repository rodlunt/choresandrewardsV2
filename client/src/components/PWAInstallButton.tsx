import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone, X } from 'lucide-react';
import {
  subscribeInstallPrompt,
  promptInstall,
  type BeforeInstallPromptEvent,
} from '@/lib/pwa-install';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const STORAGE_KEYS = {
  DISMISSED: 'pwa-install-dismissed',
  REMIND_LATER: 'pwa-install-remind-later',
  LAST_SHOWN: 'pwa-install-last-shown',
};

const REMIND_LATER_DAYS = 7;

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;

    if (isInStandaloneMode || isIOSStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Check dismissal status
    const dismissed = localStorage.getItem(STORAGE_KEYS.DISMISSED);
    const remindLater = localStorage.getItem(STORAGE_KEYS.REMIND_LATER);

    if (dismissed === 'true') {
      setIsDismissed(true);
      return;
    }

    if (remindLater) {
      const remindDate = new Date(remindLater);
      if (new Date() < remindDate) {
        setIsDismissed(true);
        return;
      }
    }

    // For iOS, we can show the button immediately
    if (isIOSDevice) {
      setIsInstallable(true);
    }

    // The beforeinstallprompt event is captured at module scope in
    // lib/pwa-install.ts (armed before React renders); subscribing replays
    // whatever was captured before this component mounted, which is the
    // whole fix for the button never appearing: the event usually fires
    // long before the dashboard exists.
    const unsubscribe = subscribeInstallPrompt((event) => {
      setDeferredPrompt(event);
      if (event) {
        setIsInstallable(true);
      } else {
        // Cleared by lib on appinstalled or after prompting.
        setIsInstallable(isIOSDevice);
      }
    });

    return unsubscribe;
  }, []);

  const handleInstallClick = async () => {
    // iOS: Show instructions dialog
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    // Chrome/Edge: Use native prompt
    if (!deferredPrompt) return;

    try {
      const outcome = await promptInstall();
      if (outcome === 'accepted') {
        localStorage.setItem(STORAGE_KEYS.LAST_SHOWN, new Date().toISOString());
        setIsInstalled(true);
      }
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEYS.DISMISSED, 'true');
    setIsDismissed(true);
    setIsInstallable(false);
  };

  const handleRemindLater = () => {
    const remindDate = new Date();
    remindDate.setDate(remindDate.getDate() + REMIND_LATER_DAYS);
    localStorage.setItem(STORAGE_KEYS.REMIND_LATER, remindDate.toISOString());
    setIsDismissed(true);
    setIsInstallable(false);
  };

  // Don't show button if already installed or dismissed
  if (isInstalled || isDismissed || !isInstallable) {
    return null;
  }

  return (
    <>
      <div className="relative inline-block">
        {/* Same structural sizing as the Add Child button beside it (default
            Button size, same horizontal padding), so the pair reads as
            equals; the dismiss control floats as a corner badge instead of
            padding the button wider. The pulse-ring draws the eye without
            the flicker of an opacity pulse. */}
        <Button
          onClick={handleInstallClick}
          variant="outline"
          className="bg-white border-brand-coral text-brand-coral hover:bg-brand-coral hover:text-white transition-all shadow-soft animate-pulse-ring"
          data-testid="button-install-pwa"
        >
          <Smartphone className="w-4 h-4 mr-2" />
          Install App
        </Button>
        <button
          onClick={handleRemindLater}
          className="absolute -top-1.5 -right-1.5 p-0.5 bg-white border border-brand-coral/40 rounded-full shadow-soft hover:bg-brand-coral/10 transition-colors"
          aria-label="Remind me later"
          data-testid="button-remind-later"
        >
          <X className="w-3 h-3 text-brand-coral" />
        </button>
      </div>

      {/* iOS Installation Instructions Dialog */}
      <Dialog open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Install Chores & Rewards</DialogTitle>
            <DialogDescription>
              Follow these steps to install the app on your iPhone or iPad:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-brand-coral text-white rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <p className="text-sm text-brand-grayDark">
                  Tap the <strong>Share</strong> button at the bottom of Safari
                  <span className="inline-block ml-1 px-2 py-1 bg-brand-grayLight rounded text-xs">
                    <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                    </svg>
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-brand-coral text-white rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <p className="text-sm text-brand-grayDark">
                  Scroll down and tap <strong>"Add to Home Screen"</strong>
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-brand-coral text-white rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <p className="text-sm text-brand-grayDark">
                  Tap <strong>"Add"</strong> in the top right corner
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowIOSInstructions(false);
                handleDismiss();
              }}
              data-testid="button-ios-dismiss"
            >
              Don't Show Again
            </Button>
            <Button
              onClick={() => setShowIOSInstructions(false)}
              className="bg-brand-coral hover:bg-brand-coral/90"
              data-testid="button-ios-close"
            >
              Got It
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}