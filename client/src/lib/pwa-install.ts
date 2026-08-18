// Captures Chrome's beforeinstallprompt at module scope, the moment the
// bundle executes, because the event fires once and early: a listener
// attached later inside a React useEffect loses the race whenever Chrome
// evaluates installability before the component mounts (and on a first
// visit the FirstRunPage replaces the layout, so the install button is
// not mounted at all). This module is imported for its side effect from
// main.tsx, ahead of React rendering; the event is stashed here and
// handed to whichever component subscribes, whenever it mounts.

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type Listener = (event: BeforeInstallPromptEvent | null) => void;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener(deferredPrompt));
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // preventDefault suppresses Chrome's own mini-infobar so the in-app
    // button is the single, deliberate install entry point.
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

// Returns whatever has been captured so far (null if Chrome has not
// offered installation, or the app is already installed).
export function getDeferredPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

// Subscribe to future changes; immediately replays the current state so a
// late-mounting component still sees an event captured before it existed.
export function subscribeInstallPrompt(listener: Listener): () => void {
  listeners.add(listener);
  listener(deferredPrompt);
  return () => {
    listeners.delete(listener);
  };
}

// Consumes the stored event to show the browser's install dialog.
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) {
    return 'unavailable';
  }
  const event = deferredPrompt;
  await event.prompt();
  const choice = await event.userChoice;
  // The event is single-use regardless of outcome.
  deferredPrompt = null;
  notify();
  return choice.outcome;
}
