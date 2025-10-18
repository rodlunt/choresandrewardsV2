import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

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

    // Listen for the beforeinstallprompt event (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const beforeInstallPromptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(beforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      localStorage.removeItem(STORAGE_KEYS.DISMISSED);
      localStorage.removeItem(STORAGE_KEYS.REMIND_LATER);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
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
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user's response
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        localStorage.setItem(STORAGE_KEYS.LAST_SHOWN, new Date().toISOString());
      } else {
        console.log('User dismissed the install prompt');
      }

      // Clear the prompt
      setDeferredPrompt(null);
      setIsInstallable(false);
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
        <Button
          onClick={handleInstallClick}
          variant="outline"
          className="bg-white border-brand-coral text-brand-coral hover:bg-brand-coral hover:text-white transition-all shadow-soft pr-10"
          data-testid="button-install-pwa"
        >
          <Smartphone className="w-4 h-4 mr-2" />
          Install App
        </Button>
        <button
          onClick={handleRemindLater}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-brand-coral/10 rounded transition-colors"
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